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
}

function formatNumber(value: number, fractionDigits = 2) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export function Header() {
  const d = headerData
  const isUp = d.change24hAbs >= 0
  const changeColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"
  const priceColor = isUp ? "text-[#2ebd85]" : "text-[#f6465d]"

  return (
    <header className="flex items-center gap-6 border-b bg-background px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#627eea] text-white text-xs font-bold">
          {d.baseAsset === "ETH" ? "Ξ" : d.baseAsset[0]}
        </div>
        <div className="flex flex-col">
          <div className="text-lg font-semibold leading-tight">{d.pair}</div>
          <div className="text-xs text-muted-foreground leading-tight">
            {d.baseName}
          </div>
        </div>
      </div>

      <div className="flex flex-col">
        <div className={`text-xl font-semibold leading-tight ${priceColor}`}>
          {formatNumber(d.price)}
        </div>
        <div className="text-xs text-muted-foreground leading-tight">
          ${formatNumber(d.priceUsd)}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground leading-tight">24h Chg</div>
        <div className={`text-xs leading-tight ${changeColor}`}>
          {isUp ? "+" : ""}
          {formatNumber(d.change24hAbs)}{" "}
          {isUp ? "+" : ""}
          {formatNumber(d.change24hPct)}%
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground leading-tight">24h High</div>
        <div className="text-xs leading-tight">{formatNumber(d.high24h)}</div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground leading-tight">24h Low</div>
        <div className="text-xs leading-tight">{formatNumber(d.low24h)}</div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground leading-tight">
          24h Vol({d.baseAsset})
        </div>
        <div className="text-xs leading-tight">{formatNumber(d.volume24hBase)}</div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground leading-tight">
          24h Vol({d.quoteAsset})
        </div>
        <div className="text-xs leading-tight">{formatNumber(d.volume24hQuote)}</div>
      </div>

      <div className="flex flex-col">
        <div className="text-xs text-muted-foreground leading-tight">Token Tags</div>
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

export default Header
