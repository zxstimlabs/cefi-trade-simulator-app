import { useEffect, useRef, useState } from "react"
import { CandlestickChart, X } from "lucide-react"

import { Chart } from "@/components/chart"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Skeleton } from "@/components/ui/skeleton"
import { useFeedStatus, useMarketSnapshot } from "@/hooks/use-market"
import { cn, formatEth, formatPct, formatVnd } from "@/lib/utils"

const PAIR = "ETH/VND"

// Green if the last price rose since the previous one, red if it fell.
function usePriceDirection(price: number | undefined) {
  const prev = useRef<number | undefined>(undefined)
  const [dir, setDir] = useState<"up" | "down" | null>(null)
  useEffect(() => {
    if (price == null) return
    if (prev.current != null && price !== prev.current) setDir(price > prev.current ? "up" : "down")
    prev.current = price
  }, [price])
  return dir
}

export function FeedStatus({ compact = false }: { compact?: boolean }) {
  const { status, ageSec } = useFeedStatus()
  const dot = {
    connecting: "bg-yellow-500 animate-pulse",
    live: "bg-[#2ebd85] animate-pulse",
    lagging: "bg-yellow-500",
    down: "bg-[#f6465d]",
  }[status]
  const label = {
    connecting: "Đang kết nối…",
    live: "Trực tiếp",
    lagging: `Chậm · ${ageSec}s`,
    down: `Mất kết nối · ${ageSec}s`,
  }[status]
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <span className={cn("size-1.5 rounded-full", dot)} />
      {!compact && (
        <span
          className={cn(
            "text-xs",
            status === "down" ? "text-[#f6465d]" : status === "lagging" ? "text-yellow-500" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
      )}
    </div>
  )
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <div className="text-xs leading-tight text-muted-foreground">{label}</div>
      <div className="text-xs leading-tight tabular-nums">{children}</div>
    </div>
  )
}

function ChartDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Biểu đồ" className="text-muted-foreground">
          <CandlestickChart className="size-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
        <DrawerHeader className="sr-only">
          <DrawerTitle>{PAIR} Biểu đồ giá</DrawerTitle>
          <DrawerDescription>Biểu đồ giá cho {PAIR}</DrawerDescription>
        </DrawerHeader>
        <DrawerClose
          aria-label="Đóng biểu đồ"
          className="absolute top-3 right-3 z-10 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </DrawerClose>
        <div className="mt-6 h-[70vh] min-h-0">
          <Chart />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export function Header() {
  const { data } = useMarketSnapshot()
  const ticker = data?.ticker ?? null
  const dir = usePriceDirection(ticker?.last)
  const changeUp = (ticker?.change24h ?? 0) >= 0
  const changeColor = changeUp ? "text-[#2ebd85]" : "text-[#f6465d]"
  const priceColor = dir === "down" ? "text-[#f6465d]" : dir === "up" ? "text-[#2ebd85]" : ""

  return (
    <header className="flex items-center justify-between gap-6 border-b bg-background px-4 py-3">
      <div className="flex min-w-0 items-center gap-6">
        <div className="flex items-center gap-3">
          <img src="/icon.svg" alt="CeFi.vn" className="size-7" />
          <div className="flex flex-col">
            <div className="text-lg leading-tight font-semibold">{PAIR}</div>
            {ticker ? (
              <div className={cn("text-xs leading-tight tabular-nums md:hidden", changeColor)}>
                {formatVnd(ticker.last)} · {formatPct(ticker.changePct24h)}
              </div>
            ) : (
              <div className="text-xs leading-tight text-muted-foreground">Ether</div>
            )}
          </div>
        </div>

        <div className="hidden items-center gap-6 md:flex">
          {ticker ? (
            <>
              <div className={cn("text-xl leading-tight font-semibold tabular-nums transition-colors", priceColor)}>
                {formatVnd(ticker.last)}
              </div>
              <Stat label="Biến động 24h">
                <span className={changeColor}>
                  {changeUp ? "+" : ""}
                  {formatVnd(ticker.change24h)} {formatPct(ticker.changePct24h)}
                </span>
              </Stat>
              <Stat label="Cao 24h">{formatVnd(ticker.high24h)}</Stat>
              <Stat label="Thấp 24h">{formatVnd(ticker.low24h)}</Stat>
              <Stat label="KL 24h (ETH)">{formatEth(ticker.volume24h)}</Stat>
              <Stat label="KL 24h (VND)">{formatVnd(ticker.quoteVolume24h)}</Stat>
            </>
          ) : data ? (
            <span className="text-xs text-muted-foreground">Chưa có giao dịch</span>
          ) : (
            <Skeleton className="h-6 w-64" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:block">
          <FeedStatus />
        </div>
        <div className="flex items-center gap-1 md:hidden">
          <FeedStatus compact />
          <ChartDrawer />
        </div>
      </div>
    </header>
  )
}

export default Header
