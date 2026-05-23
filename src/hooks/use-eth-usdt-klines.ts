import { useEffect, useState } from "react"
import { isWsFormattedKline } from "binance"
import type { Kline, KlineInterval, WsFormattedMessage } from "binance"
import type { CandlestickData, UTCTimestamp } from "lightweight-charts"

import { getRestClient, getWsClient } from "@/lib/binance-clients"

const SYMBOL = "ETHUSDT"
const HISTORY_LIMIT = 500

export type Candle = CandlestickData<UTCTimestamp>

function restKlineToCandle(k: Kline): Candle {
  return {
    time: (k[0] / 1000) as UTCTimestamp,
    open: Number(k[1]),
    high: Number(k[2]),
    low: Number(k[3]),
    close: Number(k[4]),
  }
}

function wsKlineToCandle(k: {
  startTime: number
  open: number
  high: number
  low: number
  close: number
}): Candle {
  return {
    time: (k.startTime / 1000) as UTCTimestamp,
    open: k.open,
    high: k.high,
    low: k.low,
    close: k.close,
  }
}

function upsert(candles: Candle[], next: Candle): Candle[] {
  if (candles.length === 0) return [next]
  const last = candles[candles.length - 1]
  if (next.time === last.time) {
    return [...candles.slice(0, -1), next]
  }
  if (next.time > last.time) {
    return [...candles, next]
  }
  // Out-of-order tick — find slot or drop.
  const idx = candles.findIndex((c) => c.time === next.time)
  if (idx >= 0) {
    const copy = candles.slice()
    copy[idx] = next
    return copy
  }
  return candles
}

export function useEthUsdtKlines(interval: KlineInterval) {
  const [candles, setCandles] = useState<Candle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const rest = getRestClient()
    rest
      .getKlines({ symbol: SYMBOL, interval, limit: HISTORY_LIMIT })
      .then((rows) => {
        if (cancelled) return
        setCandles(rows.map(restKlineToCandle))
        setLoading(false)
      })
      .catch((err) => {
        console.error("[binance rest] getKlines failed", err)
        if (!cancelled) setLoading(false)
      })

    const ws = getWsClient()
    const topic = `${SYMBOL.toLowerCase()}@kline_${interval}`
    ws.subscribe([topic], "main")

    const handler = (data: WsFormattedMessage) => {
      if (cancelled) return
      if (!isWsFormattedKline(data)) return
      if (data.symbol !== SYMBOL) return
      if (data.kline.interval !== interval) return
      const next = wsKlineToCandle(data.kline)
      setCandles((prev) => upsert(prev, next))
    }
    ws.on("formattedMessage", handler)

    return () => {
      cancelled = true
      ws.off("formattedMessage", handler)
      ws.unsubscribe([topic], "main")
    }
  }, [interval])

  return { candles, loading }
}
