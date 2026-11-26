import { useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMarketSnapshot } from "@/hooks/use-market"
import type { DepthLevel, MarketTrade } from "@/lib/api"
import { cn, COLORS, formatEth, formatTime, formatVnd } from "@/lib/utils"

// Asks and bids from the 1 s snapshot (top levels per side), with cumulative
// depth bars, the last price in between, and the buy/sell split.

interface Row extends DepthLevel {
  cumulative: number // ETH from the best price to this level
}

function withCumulative(levels: DepthLevel[]): Row[] {
  let sum = 0
  return levels.map((l) => ({ ...l, cumulative: (sum += l.quantity) }))
}

function LevelRow({ row, side, max }: { row: Row; side: "bid" | "ask"; max: number }) {
  const color = side === "bid" ? COLORS.green : COLORS.red
  return (
    <div className="relative grid shrink-0 grid-cols-3 gap-2 px-3 py-0.5 font-mono text-[11px] leading-4 tabular-nums">
      <div
        className="absolute inset-y-0 right-0 opacity-15"
        style={{ width: `${max > 0 ? (row.cumulative / max) * 100 : 0}%`, backgroundColor: color }}
      />
      <span className="relative" style={{ color }}>
        {formatVnd(row.price)}
      </span>
      <span className="relative text-right">{formatEth(row.quantity)}</span>
      <span className="relative text-right text-muted-foreground">{formatEth(row.cumulative)}</span>
    </div>
  )
}

function useLastPriceDirection(price: number | undefined) {
  const prev = useRef<number | undefined>(undefined)
  const [dir, setDir] = useState<"up" | "down" | null>(null)
  useEffect(() => {
    if (price == null) return
    if (prev.current != null && price !== prev.current) setDir(price > prev.current ? "up" : "down")
    prev.current = price
  }, [price])
  return dir
}

function ColumnHeads({ cols }: { cols: [string, string, string] }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 pb-1 text-[10px] text-muted-foreground">
      <span>{cols[0]}</span>
      <span className="text-right">{cols[1]}</span>
      <span className="text-right">{cols[2]}</span>
    </div>
  )
}

export function OrderBook({ className }: { className?: string }) {
  const { data } = useMarketSnapshot()
  const asks = useMemo(() => withCumulative(data?.depth.asks ?? []), [data?.depth.asks])
  const bids = useMemo(() => withCumulative(data?.depth.bids ?? []), [data?.depth.bids])
  const max = Math.max(asks.at(-1)?.cumulative ?? 0, bids.at(-1)?.cumulative ?? 0)
  const last = data?.ticker?.last
  const dir = useLastPriceDirection(last)
  const bestBid = bids[0]?.price
  const bestAsk = asks[0]?.price
  const spread = bestBid != null && bestAsk != null ? bestAsk - bestBid : null

  const bidVolume = bids.at(-1)?.cumulative ?? 0
  const askVolume = asks.at(-1)?.cumulative ?? 0
  const buyPct = bidVolume + askVolume > 0 ? Math.round((bidVolume / (bidVolume + askVolume)) * 100) : 50

  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <ColumnHeads cols={["Giá (VND)", "KL (ETH)", "Tổng (ETH)"]} />
      {!data ? (
        <div className="flex flex-col gap-1.5 px-3 py-2">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-full" />
          ))}
        </div>
      ) : (
        <>
          {/* Asks: best ask next to the price, higher ones above. column-reverse
              keeps the scroll anchored at the spread when they don't all fit. */}
          <div className="no-scrollbar flex min-h-0 flex-1 flex-col-reverse overflow-y-auto">
            {asks.map((r) => (
              <LevelRow key={r.price} row={r} side="ask" max={max} />
            ))}
          </div>
          <div className="flex items-baseline justify-between border-y border-muted-foreground/10 px-3 py-1.5">
            <span
              className={cn(
                "flex items-center gap-1 text-base font-semibold tabular-nums",
                dir === "up" && "text-[#2ebd85]",
                dir === "down" && "text-[#f6465d]",
              )}
            >
              {last != null ? formatVnd(last) : "-"}
              {dir === "up" && <ArrowUp className="size-3.5" />}
              {dir === "down" && <ArrowDown className="size-3.5" />}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {spread != null ? `Chênh lệch ${formatVnd(spread)}` : ""}
            </span>
          </div>
          <div className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-y-auto">
            {bids.map((r) => (
              <LevelRow key={r.price} row={r} side="bid" max={max} />
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 pt-2 pb-1 text-[10px] tabular-nums">
            <span className="text-[#2ebd85]">M {buyPct}%</span>
            <div className="flex h-1 flex-1 overflow-hidden">
              <div style={{ width: `${buyPct}%`, backgroundColor: COLORS.green }} />
              <div className="flex-1" style={{ backgroundColor: COLORS.red }} />
            </div>
            <span className="text-[#f6465d]">{100 - buyPct}% B</span>
          </div>
        </>
      )}
    </div>
  )
}

function TradeRow({ trade }: { trade: MarketTrade }) {
  return (
    <div className="grid grid-cols-3 gap-2 px-3 py-0.5 font-mono text-[11px] leading-4 tabular-nums">
      <span className={trade.side === "buy" ? "text-[#2ebd85]" : "text-[#f6465d]"}>{formatVnd(trade.price)}</span>
      <span className="text-right">{formatEth(trade.quantity)}</span>
      <span className="text-right text-muted-foreground">{formatTime(trade.time)}</span>
    </div>
  )
}

export function RecentTrades({ className }: { className?: string }) {
  const { data } = useMarketSnapshot()
  const trades = data?.trades ?? []
  return (
    <div className={cn("flex min-h-0 flex-col", className)}>
      <ColumnHeads cols={["Giá (VND)", "KL (ETH)", "Thời gian"]} />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!data ? (
          <div className="flex flex-col gap-1.5 px-3 py-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>
        ) : trades.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">Chưa có giao dịch</p>
        ) : (
          trades.map((t) => <TradeRow key={t.id} trade={t} />)
        )}
      </div>
    </div>
  )
}

function Title({ children }: { children: React.ReactNode }) {
  return <h3 className="px-3 pt-3 pb-2 text-sm font-bold">{children}</h3>
}

// Desktop: the book over the recent trades, between the chart and the order form.
export function MarketPanel() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <section className="flex min-h-0 flex-[3] flex-col border border-muted-foreground/10">
        <Title>Sổ lệnh</Title>
        <OrderBook className="flex-1" />
      </section>
      <section className="flex min-h-0 flex-[2] flex-col border border-t-0 border-muted-foreground/10">
        <Title>Giao dịch gần đây</Title>
        <RecentTrades className="flex-1" />
      </section>
    </div>
  )
}

// Mobile: the same two as tabs.
export function MarketTabs() {
  return (
    <Tabs defaultValue="book" className="flex h-96 flex-col border border-muted-foreground/10 pt-2">
      <TabsList variant="line" className="gap-4 px-3">
        <TabsTrigger value="book" className="px-1 text-sm">
          Sổ lệnh
        </TabsTrigger>
        <TabsTrigger value="trades" className="px-1 text-sm">
          Giao dịch gần đây
        </TabsTrigger>
      </TabsList>
      <TabsContent value="book" className="flex min-h-0 flex-1 flex-col pt-2">
        <OrderBook className="flex-1" />
      </TabsContent>
      <TabsContent value="trades" className="flex min-h-0 flex-1 flex-col pt-2">
        <RecentTrades className="flex-1" />
      </TabsContent>
    </Tabs>
  )
}
