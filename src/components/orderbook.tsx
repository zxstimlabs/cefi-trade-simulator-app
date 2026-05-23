import { ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"

type OrderRow = { price: number; amount: number }

const orderbookData: {
  pair: { base: string; quote: string }
  tickSize: number
  asks: OrderRow[]
  bids: OrderRow[]
  midPrice: number
  midPriceUsd: number
  midPriceDirection: "up" | "down"
  buyRatio: number
  sellRatio: number
} = {
  pair: { base: "ETH", quote: "USDT" },
  tickSize: 0.01,
  asks: [
    { price: 2031.62, amount: 0.0885 },
    { price: 2031.61, amount: 2.8055 },
    { price: 2031.6, amount: 0.0104 },
    { price: 2031.59, amount: 4.338 },
    { price: 2031.58, amount: 3.05 },
    { price: 2031.57, amount: 0.035 },
    { price: 2031.56, amount: 1.1197 },
    { price: 2031.55, amount: 21.8039 },
    { price: 2031.54, amount: 9.4563 },
    { price: 2031.53, amount: 14.4161 },
    { price: 2031.52, amount: 0.0103 },
    { price: 2031.51, amount: 0.3795 },
    { price: 2031.5, amount: 0.611 },
    { price: 2031.49, amount: 0.0077 },
    { price: 2031.48, amount: 0.5555 },
    { price: 2031.47, amount: 11.4049 },
    { price: 2031.46, amount: 73.5803 },
  ],
  bids: [
    { price: 2031.45, amount: 29.2864 },
    { price: 2031.44, amount: 0.0153 },
    { price: 2031.43, amount: 0.0153 },
    { price: 2031.42, amount: 66.6432 },
    { price: 2031.41, amount: 0.0052 },
    { price: 2031.4, amount: 0.0102 },
    { price: 2031.39, amount: 0.0052 },
    { price: 2031.38, amount: 0.0141 },
    { price: 2031.37, amount: 0.0152 },
    { price: 2031.36, amount: 0.1142 },
    { price: 2031.34, amount: 0.0025 },
    { price: 2031.32, amount: 0.0189 },
    { price: 2031.31, amount: 0.3453 },
    { price: 2031.3, amount: 0.0024 },
    { price: 2031.29, amount: 0.324 },
    { price: 2031.27, amount: 4.4458 },
    { price: 2031.26, amount: 2.8626 },
  ],
  midPrice: 2031.46,
  midPriceUsd: 2031.46,
  midPriceDirection: "up",
  buyRatio: 42.29,
  sellRatio: 57.7,
}

const ASK_COLOR = "#f6465d"
const BID_COLOR = "#2ebd85"

function formatPrice(p: number) {
  return p.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatAmount(a: number) {
  return a.toLocaleString("en-US", {
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  })
}

function formatTotal(t: number) {
  if (t >= 1000) {
    return (
      (t / 1000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + "K"
    )
  }
  return t.toLocaleString("en-US", {
    minimumFractionDigits: 5,
    maximumFractionDigits: 5,
  })
}

function ViewModeIcon({ variant }: { variant: "both" | "bids" | "asks" }) {
  const ask = ASK_COLOR
  const bid = BID_COLOR
  let bars: string[] = []
  if (variant === "both") bars = [ask, ask, bid, bid]
  if (variant === "bids") bars = [bid, bid, bid, bid]
  if (variant === "asks") bars = [ask, ask, ask, ask]
  return (
    <div className="flex h-4 w-4 flex-col justify-between gap-[1px]">
      {bars.map((c, i) => (
        <div key={i} className="h-[2px] w-full rounded-sm" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

function Row({
  row,
  total,
  depth,
  side,
}: {
  row: OrderRow
  total: number
  depth: number
  side: "ask" | "bid"
}) {
  const color = side === "ask" ? "text-[#f6465d]" : "text-[#2ebd85]"
  const bg = side === "ask" ? "rgba(246, 70, 93, 0.15)" : "rgba(46, 189, 133, 0.15)"
  return (
    <div className="relative grid grid-cols-3 px-3 py-[2px] text-xs leading-tight">
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: `${depth * 100}%`, backgroundColor: bg }}
      />
      <div className={`relative ${color}`}>{formatPrice(row.price)}</div>
      <div className="relative text-right tabular-nums">{formatAmount(row.amount)}</div>
      <div className="relative text-right tabular-nums">{formatTotal(total)}</div>
    </div>
  )
}

export function Orderbook() {
  const d = orderbookData
  const allAmounts = [...d.asks, ...d.bids].map((r) => r.amount)
  const maxAmount = Math.max(...allAmounts)
  const midColor =
    d.midPriceDirection === "up" ? "text-[#2ebd85]" : "text-[#f6465d]"

  return (
    <section className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between px-3 py-3">
        <div className="text-sm font-semibold">Order Book</div>
        <button className="text-muted-foreground" aria-label="More">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center justify-between px-3 pb-2">
        <div className="flex items-center gap-2">
          <ViewModeIcon variant="both" />
          <ViewModeIcon variant="bids" />
          <ViewModeIcon variant="asks" />
        </div>
        <button className="flex items-center gap-1 text-xs text-foreground">
          {d.tickSize.toFixed(2)}
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 px-3 pb-1 text-xs text-muted-foreground">
        <div>Price ({d.pair.quote})</div>
        <div className="text-right">Amount ({d.pair.base})</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex flex-col">
        {d.asks.map((row) => {
          const total = row.price * row.amount
          const depth = row.amount / maxAmount
          return (
            <Row
              key={`ask-${row.price}`}
              row={row}
              total={total}
              depth={depth}
              side="ask"
            />
          )
        })}
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-baseline gap-2">
          <span className={`text-xl font-semibold ${midColor}`}>
            {formatPrice(d.midPrice)}
          </span>
          <span className={midColor}>
            {d.midPriceDirection === "up" ? "↑" : "↓"}
          </span>
          <span className="text-xs text-muted-foreground">
            ${formatPrice(d.midPriceUsd)}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col">
        {d.bids.map((row) => {
          const total = row.price * row.amount
          const depth = row.amount / maxAmount
          return (
            <Row
              key={`bid-${row.price}`}
              row={row}
              total={total}
              depth={depth}
              side="bid"
            />
          )
        })}
      </div>

      <div className="mt-auto flex items-center gap-2 px-3 py-2 text-xs">
        <span className="text-[#2ebd85]">B</span>
        <span className="text-[#2ebd85] tabular-nums">
          {d.buyRatio.toFixed(2)}%
        </span>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-sm">
          <div
            className="h-full"
            style={{ width: `${d.buyRatio}%`, backgroundColor: BID_COLOR }}
          />
          <div
            className="h-full"
            style={{ width: `${d.sellRatio}%`, backgroundColor: ASK_COLOR }}
          />
        </div>
        <span className="text-[#f6465d] tabular-nums">
          {d.sellRatio.toFixed(2)}%
        </span>
        <span className="text-[#f6465d]">S</span>
      </div>
    </section>
  )
}

export default Orderbook
