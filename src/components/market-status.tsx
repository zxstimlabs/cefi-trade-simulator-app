import { MoreHorizontal } from "lucide-react"

import {
  useEthUsdtMarketData,
  type LiveTrade,
} from "@/hooks/use-eth-usdt-market-data"

type Trade = {
  price: number
  amount: number
  time: string
  side: "buy" | "sell"
  key: string
}

const PAIR = { base: "ETH", quote: "USDT" }

function formatPrice(p: number) {
  return p.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatAmount(a: number) {
  if (a >= 1000) {
    return (
      (a / 1000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "K"
    )
  }
  return a.toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 4,
  })
}

function formatTime(ms: number) {
  const d = new Date(ms)
  return d.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function toTrade(t: LiveTrade): Trade {
  return {
    price: t.price,
    amount: t.quantity,
    time: formatTime(t.time),
    side: t.side,
    key: `${t.id}`,
  }
}

function TradeRow({ trade }: { trade: Trade }) {
  const color = trade.side === "buy" ? "text-[#2ebd85]" : "text-[#f6465d]"
  return (
    <div className="grid grid-cols-3 px-3 py-[2px] text-xs leading-tight">
      <div className={color}>{formatPrice(trade.price)}</div>
      <div className="text-right tabular-nums">{formatAmount(trade.amount)}</div>
      <div className="text-right text-muted-foreground tabular-nums">
        {trade.time}
      </div>
    </div>
  )
}

function TradesPanel({
  title,
  trades,
  pair,
}: {
  title: string
  trades: Trade[]
  pair: { base: string; quote: string }
}) {
  return (
    <div className="flex h-[300px] min-h-0 flex-col">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <div className="relative">
          <div className="text-sm font-semibold">{title}</div>
          <div className="absolute -bottom-1 left-0 h-[2px] w-6 bg-yellow-500" />
        </div>
        <button className="text-muted-foreground" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 px-3 pb-1 text-xs text-muted-foreground">
        <div>Giá ({pair.quote})</div>
        <div className="text-right">KL ({pair.base})</div>
        <div className="text-right">Thời gian</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            Chưa có giao dịch
          </div>
        ) : (
          trades.map((t) => <TradeRow key={t.key} trade={t} />)
        )}
      </div>
    </div>
  )
}

export function MarketStatus() {
  const data = useEthUsdtMarketData()
  const marketTrades: Trade[] = data.trades.map(toTrade)
  const myTrades: Trade[] = []

  return (
    <section className="flex flex-col border-l">
      <TradesPanel title="Bảng GD" trades={marketTrades} pair={PAIR} />
      <div className="border-t" />
      <TradesPanel title="GD của tôi" trades={myTrades} pair={PAIR} />
    </section>
  )
}

export default MarketStatus
