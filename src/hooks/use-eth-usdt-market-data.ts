import { useEffect, useSyncExternalStore } from "react"
import {
  isWsFormattedTrade,
  isWsPartialBookDepthEventFormatted,
} from "binance"
import type { WsFormattedMessage } from "binance"

import { getWsClient } from "@/lib/binance-clients"

export type LiveOrderRow = [price: number, quantity: number]

export type LiveOrderbook = {
  bids: LiveOrderRow[]
  asks: LiveOrderRow[]
  lastUpdateId: number
}

export type LiveTrade = {
  id: number
  price: number
  quantity: number
  time: number
  side: "buy" | "sell"
}

export type LiveMarketData = {
  orderbook: LiveOrderbook | null
  trades: LiveTrade[]
  lastTradePrice: number | null
}

const SYMBOL = "ETHUSDT"
const MAX_TRADES = 50

let state: LiveMarketData = {
  orderbook: null,
  trades: [],
  lastTradePrice: null,
}

const listeners = new Set<() => void>()
function emit() {
  for (const l of listeners) l()
}

let subscribed = false

function ensureSubscribed() {
  if (subscribed) return
  subscribed = true
  const c = getWsClient()

  c.on("formattedMessage", (data: WsFormattedMessage) => {
    if (isWsPartialBookDepthEventFormatted(data)) {
      state = {
        ...state,
        orderbook: {
          bids: data.bids as LiveOrderRow[],
          asks: data.asks as LiveOrderRow[],
          lastUpdateId: data.lastUpdateId,
        },
      }
      emit()
      return
    }
    if (isWsFormattedTrade(data) && data.symbol === SYMBOL) {
      const trade: LiveTrade = {
        id: data.tradeId,
        price: data.price,
        quantity: data.quantity,
        time: data.time,
        side: data.maker ? "sell" : "buy",
      }
      state = {
        ...state,
        trades: [trade, ...state.trades].slice(0, MAX_TRADES),
        lastTradePrice: data.price,
      }
      emit()
    }
  })

  c.subscribePartialBookDepths(SYMBOL, 20, 1000, "spot")
  c.subscribeSpotTrades(SYMBOL)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return state
}

export function useEthUsdtMarketData(): LiveMarketData {
  useEffect(() => {
    ensureSubscribed()
  }, [])
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}
