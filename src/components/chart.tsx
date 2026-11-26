import { useMemo, useState } from "react"
import {
  CandlestickSeries,
  Chart as LWChart,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components"
import type { CandlestickData, UTCTimestamp } from "lightweight-charts"
import { useQuery } from "@tanstack/react-query"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, MARKET, type MarketTrade } from "@/lib/api"
import { useMarketSnapshot } from "@/hooks/use-market"
import { cn, COLORS, formatVnd } from "@/lib/utils"

type Resolution = "1m" | "5m" | "15m" | "1h" | "4h" | "1d"

const INTERVALS: { value: Resolution; label: string; seconds: number }[] = [
  { value: "1m", label: "1m", seconds: 60 },
  { value: "5m", label: "5m", seconds: 300 },
  { value: "15m", label: "15m", seconds: 900 },
  { value: "1h", label: "1H", seconds: 3600 },
  { value: "4h", label: "4H", seconds: 14400 },
  { value: "1d", label: "1D", seconds: 86400 },
]

// lightweight-charts draws UTC; shift by the local offset so the time axis
// reads in the viewer's time zone (Vietnam: +7 h), like the trade tables.
const TZ_OFFSET = -new Date().getTimezoneOffset() * 60

const chartOptions = {
  layout: {
    background: { color: "transparent" },
    textColor: "#9ca3af",
  },
  grid: {
    vertLines: { color: "rgba(255, 255, 255, 0.06)" },
    horzLines: { color: "rgba(255, 255, 255, 0.06)" },
  },
  timeScale: { timeVisible: true, secondsVisible: false },
  localization: { priceFormatter: (p: number) => formatVnd(p) },
  autoSize: true,
}

type Candle = CandlestickData<UTCTimestamp>

// Fold one trade onto the trailing candle (or open the next one). Trades older
// than the last candle are ignored, so re-folding the same recent trades every
// poll is idempotent for open/high/low/close.
function applyTrade(candles: Candle[], trade: MarketTrade, bucketSeconds: number): Candle[] {
  const sec = Math.floor(trade.time / 1000)
  const t = (sec - (sec % bucketSeconds) + TZ_OFFSET) as UTCTimestamp
  const last = candles[candles.length - 1]
  if (last && last.time === t) {
    const updated: Candle = {
      time: t,
      open: last.open,
      high: Math.max(last.high, trade.price),
      low: Math.min(last.low, trade.price),
      close: trade.price,
    }
    return [...candles.slice(0, -1), updated]
  }
  if (!last || (last.time as number) < t) {
    return [...candles, { time: t, open: trade.price, high: trade.price, low: trade.price, close: trade.price }]
  }
  return candles
}

function useCandles(resolution: Resolution) {
  const bucketSeconds = INTERVALS.find((i) => i.value === resolution)!.seconds
  const { data: snapshot } = useMarketSnapshot()

  // OHLC history from the API, cached per resolution (the mobile drawer
  // reopening doesn't refetch). Refreshed every minute as a resync.
  const { data: seed, isLoading, isError } = useQuery({
    queryKey: ["candles", MARKET, resolution],
    queryFn: async () =>
      (await api.candles(resolution)).map(
        (c): Candle => ({
          time: (c.t + TZ_OFFSET) as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }),
      ),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  })

  // Live: fold the snapshot's recent trades (newest first) on top, oldest first.
  const candles = useMemo(() => {
    let next = seed ?? []
    const trades = snapshot?.trades ?? []
    for (let i = trades.length - 1; i >= 0; i--) next = applyTrade(next, trades[i]!, bucketSeconds)
    return next
  }, [seed, snapshot?.trades, bucketSeconds])

  return { candles, isLoading, isError }
}

export function Chart() {
  const [resolution, setResolution] = useState<Resolution>("15m")
  const { candles, isLoading, isError } = useCandles(resolution)

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <Tabs value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
          <TabsList variant="line" className="gap-3">
            {INTERVALS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn("px-1 text-xs", "data-active:text-foreground after:bg-yellow-500!")}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {isLoading && <span className="text-[10px] text-muted-foreground">Đang tải…</span>}
        {isError && <span className="text-[10px] text-[#f6465d]">Không tải được biểu đồ</span>}
        {!isLoading && !isError && candles.length === 0 && (
          <span className="text-[10px] text-muted-foreground">Chưa có giao dịch</span>
        )}
      </div>

      <div className="mt-3 min-h-0 flex-1">
        <LWChart options={chartOptions} containerProps={{ style: { width: "100%", height: "100%" } }}>
          <CandlestickSeries
            data={candles}
            options={{
              upColor: COLORS.green,
              downColor: COLORS.red,
              borderUpColor: COLORS.green,
              borderDownColor: COLORS.red,
              wickUpColor: COLORS.green,
              wickDownColor: COLORS.red,
              priceFormat: { type: "price", precision: 0, minMove: 1 },
            }}
            reactive
          />
          <TimeScale>
            <TimeScaleFitContentTrigger deps={[resolution, candles.length === 0]} />
          </TimeScale>
        </LWChart>
      </div>
    </div>
  )
}

export default Chart
