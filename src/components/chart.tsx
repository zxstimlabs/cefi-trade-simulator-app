import { Component, useMemo, useState, type ReactNode } from "react"
import { CandlestickSeries, Chart as LWChart } from "lightweight-charts-react-components"
import type { CandlestickData, UTCTimestamp } from "lightweight-charts"
import { useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { api, MARKET, type MarketTrade } from "@/lib/api"
import { useMarketSnapshot } from "@/hooks/use-market"
import { COLORS, formatVnd } from "@/lib/utils"

type Resolution = "1m" | "5m" | "15m" | "1h" | "4h" | "1d"

const INTERVALS: { value: Resolution; label: string; seconds: number }[] = [
  { value: "1m", label: "1m", seconds: 60 },
  { value: "5m", label: "5m", seconds: 300 },
  { value: "15m", label: "15m", seconds: 900 },
  { value: "1h", label: "1H", seconds: 3600 },
  { value: "4h", label: "4H", seconds: 14400 },
  { value: "1d", label: "1D", seconds: 86400 },
]

// lightweight-charts draws UTC; shift by the local offset so the time axis
// reads in the viewer's time zone (Vietnam: +7 h), like the trade tables.
const TZ_OFFSET = -new Date().getTimezoneOffset() * 60


const chartOptions = {
  layout: {
    background: { color: "transparent" },
    textColor: "#9ca3af",
  },
  grid: {
    vertLines: { color: "rgba(127, 127, 127, 0.08)" },
    horzLines: { color: "rgba(127, 127, 127, 0.08)" },
  },
  // A fixed bar width, latest bars on the right: a young market's few candles
  // at 1h/4h/1D stay candle-sized instead of being stretched across the chart
  // (what fitContent did: one giant bar).
  timeScale: { timeVisible: true, secondsVisible: false, barSpacing: 8, minBarSpacing: 2, rightOffset: 4 },
  localization: { priceFormatter: (p: number) => formatVnd(p) },
  autoSize: true,
}

// Daily candles: dates on the time axis, not the (shifted) bucket time.
const dailyChartOptions = { ...chartOptions, timeScale: { ...chartOptions.timeScale, timeVisible: false } }

const seriesOptions = {
  upColor: COLORS.green,
  downColor: COLORS.red,
  borderUpColor: COLORS.green,
  borderDownColor: COLORS.red,
  wickUpColor: COLORS.green,
  wickDownColor: COLORS.red,
  priceFormat: { type: "price" as const, precision: 0, minMove: 1 },
}

type Candle = CandlestickData<UTCTimestamp>

// Fold one trade onto the trailing candle (or open the next one). Trades older
// than the last candle are ignored, so re-folding the same recent trades every
// poll is idempotent for open/high/low/close.
function applyTrade(candles: Candle[], trade: MarketTrade, bucketSeconds: number): Candle[] {
  const sec = Math.floor(trade.time / 1000)
  const t = (sec - (sec % bucketSeconds) + TZ_OFFSET) as UTCTimestamp
  const last = candles[candles.length - 1]
  if (last && last.time === t) {
    const updated: Candle = {
      time: t,
      open: last.open,
      high: Math.max(last.high, trade.price),
      low: Math.min(last.low, trade.price),
      close: trade.price,
    }
    return [...candles.slice(0, -1), updated]
  }
  if (!last || (last.time as number) < t) {
    return [...candles, { time: t, open: trade.price, high: trade.price, low: trade.price, close: trade.price }]
  }
  return candles
}

function useCandles(resolution: Resolution) {
  const bucketSeconds = INTERVALS.find((i) => i.value === resolution)!.seconds
  const { data: snapshot } = useMarketSnapshot()

  // OHLC history from the API, cached per resolution (the mobile drawer
  // reopening doesn't refetch). Refreshed every minute as a resync.
  const { data: seed, isLoading, isError } = useQuery({
    queryKey: ["candles", MARKET, resolution],
    queryFn: async () =>
      (await api.candles(resolution)).map(
        (c): Candle => ({
          time: (c.t + TZ_OFFSET) as UTCTimestamp,
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }),
      ),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
    retry: 5,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  })

  // Live: fold the snapshot's recent trades (newest first) on top, oldest
  // first. Nothing until this resolution's history has loaded.
  const candles = useMemo(() => {
    if (!seed) return []
    let next = seed
    const trades = snapshot?.trades ?? []
    for (let i = trades.length - 1; i >= 0; i--) next = applyTrade(next, trades[i]!, bucketSeconds)
    return next
  }, [seed, snapshot?.trades, bucketSeconds])

  return { candles, isLoading, isError }
}

// A chart error (data lightweight-charts rejects) must never take the page
// down with it: show a message instead, and start over on retry or on another
// resolution.
class ChartBoundary extends Component<
  { resetKey: string; children: ReactNode },
  { error: Error | null; attempt: number }
> {
  state = { error: null as Error | null, attempt: 0 }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error("[chart]", error)
  }

  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
          <span>Không hiển thị được biểu đồ.</span>
          <Button variant="outline" size="sm" onClick={() => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }))}>
            Thử lại
          </Button>
        </div>
      )
    }
    return (
      <div key={this.state.attempt} className="h-full">
        {this.props.children}
      </div>
    )
  }
}

export function Chart() {
  const [resolution, setResolution] = useState<Resolution>("15m")
  const { candles, isLoading, isError } = useCandles(resolution)

  const empty = !isLoading && !isError && candles.length === 0

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <Tabs value={resolution} onValueChange={(v) => setResolution(v as Resolution)}>
          <TabsList variant="line" className="gap-3">
            {INTERVALS.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="px-1 text-xs data-active:text-foreground">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {isLoading && <span className="text-[10px] text-muted-foreground">Đang tải…</span>}
        {isError && <span className="text-[10px] text-[#f6465d]">Không tải được biểu đồ</span>}
      </div>

      <div className="relative mt-3 min-h-0 flex-1">
        <ChartBoundary resetKey={resolution}>
          {/* Keyed by resolution: each resolution gets a fresh chart, loaded
              with setData and scrolled to its latest bars. Reusing one would
              hand the series another resolution's older candles through
              series.update(), which throws ("Cannot update oldest data") and
              took the whole page down. */}
          <LWChart
            key={resolution}
            options={resolution === "1d" ? dailyChartOptions : chartOptions}
            containerProps={{ style: { width: "100%", height: "100%" } }}
          >
            <CandlestickSeries data={candles} options={seriesOptions} reactive />
          </LWChart>
        </ChartBoundary>
        {empty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Chưa có giao dịch ở khung thời gian này
          </div>
        )}
      </div>
    </div>
  )
}

export default Chart
