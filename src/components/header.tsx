import { CandlestickChart, ChevronDown, MoreHorizontal, X } from "lucide-react"

import { Chart } from "@/components/chart"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const headerData = {
  pair: "ETH/USDT",
  baseAsset: "ETH",
  quoteAsset: "USDT",
  baseName: "Ether",
  price: 2031.31,
  priceUsd: 2031.31,
  change24hAbs: -92.35,
  change24hPct: -4.35,
  high24h: 2138.0,
  low24h: 2009.3,
  volume24hBase: 298616.32,
  volume24hQuote: 618886319.34,
  networks: ["ETH"],
  networkCount: 9,
  tokenTags: ["Layer 1 / Layer 2", "Vol", "Hot", "Price Protection"],
  hasNotification: true,
}

function formatNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

function MobileHeader() {
  const d = headerData
  const isUp = d.change24hAbs >= 0
  const changeColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:hidden">
      <button type="button" className="flex flex-col items-start">
        <div className="flex items-center gap-1 text-xl font-semibold leading-tight">
          <span>{d.pair}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </div>
        <div className={`text-xs leading-tight ${changeColor}`}>
          {isUp ? "+" : ""}
          {formatNumber(d.change24hPct)}%
        </div>
      </button>

      <div className="flex items-center gap-4">
        <Drawer>
          <DrawerTrigger asChild aria-label="Chart">
            <CandlestickChart className="size-5 text-muted-foreground" />
          </DrawerTrigger>
          <DrawerContent className="outline-none focus:outline-none focus-visible:outline-none data-[vaul-drawer-direction=bottom]:max-h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{d.pair} chart</DrawerTitle>
              <DrawerDescription>Price chart for {d.pair}</DrawerDescription>
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
          {d.hasNotification && (
            <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-yellow-500" />
          )}
        </button>
      </div>
    </header>
  )
}

function DesktopHeader() {
  const d = headerData
  const isUp = d.change24hAbs >= 0
  const changeColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"
  const priceColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"

  return (
    <header className="hidden items-center gap-6 border-b bg-background px-4 py-3 md:flex">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#627eea] text-xs font-bold text-white">
          {d.baseAsset === "ETH" ? "Ξ" : d.baseAsset[0]}
        </div>
        <div className="flex flex-col">
          <div className="text-lg font-semibold leading-tight">{d.pair}</div>
          <div className="text-xs leading-tight text-muted-foreground">
            {d.baseName}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`text-xl font-semibold leading-tight ${priceColor}`}>
          {formatNumber(d.price)}
        </div>
        <div className="text-xs leading-tight text-muted-foreground">
          ${formatNumber(d.priceUsd)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">24h Chg</div>
        <div className={`text-xs leading-tight ${changeColor}`}>
          {isUp ? "+" : ""}
          {formatNumber(d.change24hAbs)}{" "}
          {isUp ? "+" : ""}
          {formatNumber(d.change24hPct)}%
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">24h High</div>
        <div className="text-xs leading-tight">{formatNumber(d.high24h)}</div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">24h Low</div>
        <div className="text-xs leading-tight">{formatNumber(d.low24h)}</div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          24h Vol({d.baseAsset})
        </div>
        <div className="text-xs leading-tight">
          {formatNumber(d.volume24hBase)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          24h Vol({d.quoteAsset})
        </div>
        <div className="text-xs leading-tight">
          {formatNumber(d.volume24hQuote)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs leading-tight text-muted-foreground">
          Token Tags
        </div>
        <div className="flex items-center gap-1.5 text-xs leading-tight text-yellow-500">
          {d.tokenTags.map((tag, i) => (
            <span key={tag} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-muted-foreground/40">|</span>}
              <span>{tag}</span>
            </span>
          ))}
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
