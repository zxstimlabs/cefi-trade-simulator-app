import { CandlestickChart, ChevronDown, MoreHorizontal, X } from "lucide-react"

import { Chart } from "@/components/chart"
import { useEthUsdtMarketData } from "@/hooks/use-eth-usdt-market-data"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const headerStaticData = {
  pair: "ETH/USDT",
  baseAsset: "ETH",
  quoteAsset: "USDT",
  baseName: "Ether",
  hasNotification: true,
}

function formatNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function MobileHeader() {
  const s = headerStaticData
  const { ticker } = useEthUsdtMarketData()
  const pct = ticker?.priceChangePct ?? 0
  const isUp = pct >= 0
  const changeColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <button type="button" className="flex flex-col items-start">
        <div className="flex items-center gap-1 text-xl font-semibold leading-tight">
          <span>{s.pair}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
        <div className={`text-xs leading-tight ${changeColor}`}>
          {isUp ? "+" : ""}
          {formatNumber(pct)}%
        </div>
      </button>

      <div className="flex items-center gap-4">
        <Drawer>
          <DrawerTrigger asChild aria-label="Chart">
            <CandlestickChart className="size-5 text-muted-foreground" />
          </DrawerTrigger>
          <DrawerContent className="outline-none focus:outline-none focus-visible:outline-none data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{s.pair} Biểu đồ giá</DrawerTitle>
              <DrawerDescription>Biểu đồ giá cho {s.pair}</DrawerDescription>
            </DrawerHeader>
            <DrawerClose
              aria-label="Close chart"
              className="absolute right-3 top-3 z-10 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </DrawerClose>
            <div className="mt-6 h-[70vh] min-h-0">
              <Chart />
            </div>
          </DrawerContent>
        </Drawer>
        <button type="button" aria-label="More" className="relative">
          <MoreHorizontal className="size-5 text-muted-foreground" />
          {s.hasNotification && (
            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-yellow-500" />
          )}
        </button>
      </div>
    </header>
  )
}

function DesktopHeader() {
  const s = headerStaticData
  const { ticker } = useEthUsdtMarketData()
  const price = ticker?.price ?? 0
  const change = ticker?.priceChange ?? 0
  const pct = ticker?.priceChangePct ?? 0
  const isUp = change >= 0
  const changeColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"
  const priceColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"

  return (
    <header className="hidden items-center gap-6 border-b bg-background px-4 py-3 md:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#627eea] text-xs font-bold text-white">
          {s.baseAsset === "ETH" ? "Ξ" : s.baseAsset[0]}
        </div>
        <div className="flex flex-col">
          <div className="text-lg font-semibold leading-tight">{s.pair}</div>
          <div className="text-xs leading-tight text-muted-foreground">
            {s.baseName}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`text-xl font-semibold leading-tight ${priceColor}`}>
          {formatNumber(price)}
        </div>
        <div className="text-xs leading-tight text-muted-foreground">
          ${formatNumber(price)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          24h Biến động
        </div>
        <div className={`text-xs leading-tight ${changeColor}`}>
          {isUp ? "+" : ""}
          {formatNumber(change)}{" "}
          {isUp ? "+" : ""}
          {formatNumber(pct)}%
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          24h Cao
        </div>
        <div className="text-xs leading-tight">
          {formatNumber(ticker?.high ?? 0)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          24h Thấp
        </div>
        <div className="text-xs leading-tight">
          {formatNumber(ticker?.low ?? 0)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          KL 24h ({s.baseAsset})
        </div>
        <div className="text-xs leading-tight">
          {formatNumber(ticker?.volumeBase ?? 0)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          KL 24h ({s.quoteAsset})
        </div>
        <div className="text-xs leading-tight">
          {formatNumber(ticker?.volumeQuote ?? 0)}
        </div>
      </div>
    </header>
  )
}

export function Header() {
  return (
    <>
      <MobileHeader />
      <DesktopHeader />
    </>
  )
}

export default Header
