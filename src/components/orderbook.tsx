import { ArrowUpDown, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react"

import { useEthUsdtMarketData, type LiveOrderRow } from "@/hooks/use-eth-usdt-market-data"

type OrderRow = { price: number; amount: number }

const orderbookStaticData = {
  pair: { base: "ETH", quote: "USDT" },
  tickSize: 0.01,
  marginEnabled: false,
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

function toRow([price, amount]: LiveOrderRow): OrderRow {
  return { price, amount }
}

function useDerivedOrderbook() {
  const data = useEthUsdtMarketData()
  const ob = data.orderbook
  // Binance: bids descending, asks ascending. We display asks descending (lowest near mid at bottom).
  const asks: OrderRow[] = ob ? [...ob.asks].reverse().map(toRow) : []
  const bids: OrderRow[] = ob ? ob.bids.map(toRow) : []

  const bidVolume = bids.reduce((s, r) => s + r.amount, 0)
  const askVolume = asks.reduce((s, r) => s + r.amount, 0)
  const total = bidVolume + askVolume
  const buyRatio = total > 0 ? (bidVolume / total) * 100 : 0
  const sellRatio = total > 0 ? 100 - buyRatio : 0

  const bestAsk = asks.length ? asks[asks.length - 1].price : null
  const bestBid = bids.length ? bids[0].price : null
  const midFromBook =
    bestAsk !== null && bestBid !== null ? (bestAsk + bestBid) / 2 : null
  const midPrice = data.lastTradePrice ?? midFromBook ?? 0

  const allAmounts = [...asks, ...bids].map((r) => r.amount)
  const maxAmount = allAmounts.length ? Math.max(...allAmounts) : 1

  return {
    asks,
    bids,
    buyRatio,
    sellRatio,
    midPrice,
    maxAmount,
    hasData: !!ob,
  }
}

function ViewModeIcon({ variant }: { variant: "both" | "bids" | "asks" }) {
  const ask = ASK_COLOR
  const bid = BID_COLOR
  let bars: string[] = []
  if (variant === "both") bars = [ask, ask, bid, bid]
  if (variant === "bids") bars = [bid, bid, bid, bid]
  if (variant === "asks") bars = [ask, ask, ask, ask]
  return (
    <div className="flex h-4 w-4 flex-col justify-between gap-px">
      {bars.map((c, i) => (
        <div
          key={i}
          className="h-[2px] w-full rounded-sm"
          style={{ backgroundColor: c }}
        />
      ))}
    </div>
  )
}

function MiniSwitch({ checked }: { checked: boolean }) {
  return (
    <span
      role="switch"
      aria-checked={checked}
      className={`relative inline-block h-3.5 w-6 rounded-full transition-colors ${
        checked ? "bg-yellow-500" : "bg-muted-foreground/30"
      }`}
    >
      <span
        className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-transform ${
          checked ? "left-3" : "left-0.5"
        }`}
      />
    </span>
  )
}

function DesktopRow({
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
  const bg =
    side === "ask" ? "rgba(246, 70, 93, 0.15)" : "rgba(46, 189, 133, 0.15)"
  return (
    <div className="relative grid grid-cols-3 px-3 py-[2px] text-xs leading-tight">
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: `${depth * 100}%`, backgroundColor: bg }}
      />
      <div className={`relative ${color}`}>{formatPrice(row.price)}</div>
      <div className="relative text-right tabular-nums">
        {formatAmount(row.amount)}
      </div>
      <div className="relative text-right tabular-nums">{formatTotal(total)}</div>
    </div>
  )
}

function MobileRow({
  row,
  depth,
  side,
}: {
  row: OrderRow
  depth: number
  side: "ask" | "bid"
}) {
  const color = side === "ask" ? "text-[#f6465d]" : "text-[#2ebd85]"
  const bg =
    side === "ask" ? "rgba(246, 70, 93, 0.18)" : "rgba(46, 189, 133, 0.18)"
  return (
    <div className="relative grid grid-cols-2 px-2 py-px text-xs leading-tight">
      <div
        className="absolute inset-y-0 right-0"
        style={{ width: `${depth * 100}%`, backgroundColor: bg }}
      />
      <div className={`relative ${color}`}>{formatPrice(row.price)}</div>
      <div className="relative text-right tabular-nums">
        {formatAmount(row.amount)}
      </div>
    </div>
  )
}

function OrderbookDesktop() {
  const s = orderbookStaticData
  const { asks, bids, buyRatio, sellRatio, midPrice, maxAmount } =
    useDerivedOrderbook()
  const midColor = "text-[#2ebd85]"

  return (
    <section className="flex flex-col border-r">
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
          {s.tickSize.toFixed(2)}
          <ChevronDown className="h-3 w-3" />
        </button>
      </div>

      <div className="grid grid-cols-3 px-3 pb-1 text-xs text-muted-foreground">
        <div>Price ({s.pair.quote})</div>
        <div className="text-right">Amount ({s.pair.base})</div>
        <div className="text-right">Total</div>
      </div>

      <div className="flex flex-col">
        {asks.map((row) => {
          const total = row.price * row.amount
          const depth = row.amount / maxAmount
          return (
            <DesktopRow
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
            {formatPrice(midPrice)}
          </span>
          <span className={midColor}>↑</span>
          <span className="text-xs text-muted-foreground">
            ${formatPrice(midPrice)}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      <div className="flex flex-col">
        {bids.map((row) => {
          const total = row.price * row.amount
          const depth = row.amount / maxAmount
          return (
            <DesktopRow
              key={`bid-${row.price}`}
              row={row}
              total={total}
              depth={depth}
              side="bid"
            />
          )
        })}
      </div>

      <div className="flex items-center gap-2 px-3 py-2 text-xs">
        <span className="text-[#2ebd85]">B</span>
        <span className="text-[#2ebd85] tabular-nums">
          {buyRatio.toFixed(2)}%
        </span>
        <div className="flex h-1.5 flex-1 overflow-hidden rounded-sm">
          <div
            className="h-full"
            style={{ width: `${buyRatio}%`, backgroundColor: BID_COLOR }}
          />
          <div
            className="h-full"
            style={{ width: `${sellRatio}%`, backgroundColor: ASK_COLOR }}
          />
        </div>
        <span className="text-[#f6465d] tabular-nums">
          {sellRatio.toFixed(2)}%
        </span>
        <span className="text-[#f6465d]">S</span>
      </div>
    </section>
  )
}

function OrderbookMobile() {
  const s = orderbookStaticData
  const { asks, bids, buyRatio, sellRatio, midPrice } = useDerivedOrderbook()
  const visibleAsks = asks.slice(-12)
  const visibleBids = bids.slice(0, 12)
  const visibleAmounts = [...visibleAsks, ...visibleBids].map((r) => r.amount)
  const visibleMax = visibleAmounts.length ? Math.max(...visibleAmounts) : 1
  const midColor = "text-[#2ebd85]"

  return (
    <section className="flex h-full flex-col">
      <div className="flex items-center justify-between px-2 pt-2 pb-1">
        <button
          type="button"
          className="flex items-center gap-1.5 text-xs"
          aria-label="Toggle margin"
        >
          <span className="font-medium">Margin</span>
          <MiniSwitch checked={s.marginEnabled} />
        </button>
      </div>

      <div className="grid grid-cols-2 px-2 pb-1 text-[10px] leading-tight text-muted-foreground">
        <div>
          Price
          <br />({s.pair.quote})
        </div>
        <div className="flex items-start justify-end gap-1 text-right">
          <span>
            Amount
            <br />({s.pair.base})
          </span>
          <ArrowUpDown className="size-3" />
        </div>
      </div>

      <div className="flex flex-col">
        {visibleAsks.map((row) => (
          <MobileRow
            key={`ask-m-${row.price}`}
            row={row}
            depth={row.amount / visibleMax}
            side="ask"
          />
        ))}
      </div>

      <div className="flex flex-col items-center justify-center px-2 py-2">
        <div className={`text-lg font-bold leading-tight ${midColor}`}>
          {formatPrice(midPrice)}
        </div>
        <div className="text-[11px] leading-tight text-muted-foreground">
          ≈ ${formatPrice(midPrice)}
        </div>
      </div>

      <div className="flex flex-col">
        {visibleBids.map((row) => (
          <MobileRow
            key={`bid-m-${row.price}`}
            row={row}
            depth={row.amount / visibleMax}
            side="bid"
          />
        ))}
      </div>

      <div className="mt-auto flex flex-col gap-2 px-2 pt-2 pb-2">
        <div className="flex items-center gap-2 text-[11px]">
          <span className="text-[#2ebd85] tabular-nums">
            {buyRatio.toFixed(2)}%
          </span>
          <div className="flex h-1.5 flex-1 overflow-hidden rounded-sm">
            <div
              className="h-full"
              style={{ width: `${buyRatio}%`, backgroundColor: BID_COLOR }}
            />
            <div
              className="h-full"
              style={{ width: `${sellRatio}%`, backgroundColor: ASK_COLOR }}
            />
          </div>
          <span className="text-[#f6465d] tabular-nums">
            {sellRatio.toFixed(2)}%
          </span>
        </div>

        <div className="flex items-center justify-between">
          <button className="flex items-center gap-1 text-xs">
            {s.tickSize.toFixed(2)}
            <ChevronDown className="size-3" />
          </button>
          <div className="flex items-center gap-1.5">
            <ViewModeIcon variant="both" />
            <ViewModeIcon variant="bids" />
            <ViewModeIcon variant="asks" />
          </div>
        </div>
      </div>
    </section>
  )
}

export function Orderbook() {
  return (
    <>
      <div className="h-full md:hidden">
        <OrderbookMobile />
      </div>
      <div className="hidden md:block">
        <OrderbookDesktop />
      </div>
    </>
  )
}

export default Orderbook
