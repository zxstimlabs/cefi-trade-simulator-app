import { MoreHorizontal } from "lucide-react"

type Trade = {
  price: number
  amount: number
  time: string
  side: "buy" | "sell"
}

const marketStatusData: {
  pair: { base: string; quote: string }
  marketTrades: Trade[]
  myTrades: Trade[]
} = {
  pair: { base: "ETH", quote: "USDT" },
  marketTrades: [
    { price: 2031.87, amount: 0.0491, time: "17:48:07", side: "buy" },
    { price: 2031.87, amount: 0.0491, time: "17:48:06", side: "buy" },
    { price: 2031.87, amount: 0.0491, time: "17:48:06", side: "buy" },
    { price: 2031.87, amount: 19560, time: "17:48:06", side: "buy" },
    { price: 2031.86, amount: 2070, time: "17:48:06", side: "sell" },
    { price: 2031.86, amount: 0.2453, time: "17:48:05", side: "sell" },
    { price: 2031.87, amount: 0.0491, time: "17:48:05", side: "buy" },
    { price: 2031.87, amount: 0.9284, time: "17:48:05", side: "buy" },
    { price: 2031.87, amount: 0.2656, time: "17:48:05", side: "sell" },
    { price: 2031.87, amount: 0.9311, time: "17:48:04", side: "sell" },
    { price: 2031.87, amount: 0.9284, time: "17:48:04", side: "sell" },
    { price: 2031.87, amount: 4860, time: "17:48:03", side: "sell" },
    { price: 2031.87, amount: 0.4642, time: "17:48:02", side: "sell" },
    { price: 2031.87, amount: 0.4642, time: "17:48:02", side: "sell" },
    { price: 2031.87, amount: 0.3132, time: "17:48:01", side: "buy" },
    { price: 2031.87, amount: 28050, time: "17:48:00", side: "buy" },
    { price: 2031.87, amount: 14630, time: "17:47:59", side: "sell" },
  ],
  myTrades: [],
}

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
    <div className="flex h-1/2 min-h-0 flex-col">
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
        <div>Price ({pair.quote})</div>
        <div className="text-right">Amount ({pair.base})</div>
        <div className="text-right">Time</div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            No trades yet
          </div>
        ) : (
          trades.map((t, i) => <TradeRow key={i} trade={t} />)
        )}
      </div>
    </div>
  )
}

export function MarketStatus() {
  const d = marketStatusData
  return (
    <section className="flex h-full flex-col border-l">
      <TradesPanel title="Market Trades" trades={d.marketTrades} pair={d.pair} />
      <div className="border-t" />
      <TradesPanel title="My Trades" trades={d.myTrades} pair={d.pair} />
    </section>
  )
}

export default MarketStatus
