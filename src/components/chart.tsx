import { useMemo, useState } from "react"
import {
  AreaSeries,
  BarSeries,
  BaselineSeries,
  CandlestickSeries,
  Chart as LWChart,
  HistogramSeries,
  LineSeries,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components"
import type { CandlestickData, HistogramData, LineData } from "lightweight-charts"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const COLORS = {
  green: "#2ebd85",
  red: "#f6465d",
  pink: "#ec4899",
  orange: "#f59e0b",
  blue: "#3b82f6",
}

const SERIES_TYPES = [
  "Candlestick",
  "Line",
  "Bar",
  "Area",
  "Histogram",
  "Baseline",
] as const
type SeriesType = (typeof SERIES_TYPES)[number]

function formatDate(d: Date) {
  return d.toISOString().slice(0, 10)
}

function addDays(d: Date, days: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + days)
  return next
}

function generateLineData(length: number): LineData<string>[] {
  const start = addDays(new Date(), -length)
  let lastValue = Math.floor(Math.random() * 100)
  return Array.from({ length }, (_, i) => {
    const change = Math.floor(Math.random() * 21) - 10
    lastValue = Math.max(0, lastValue + change)
    return { time: formatDate(addDays(start, i)), value: lastValue }
  })
}

function generateOHLCData(length: number): CandlestickData<string>[] {
  const start = addDays(new Date(), -length)
  let prevClose = Math.max(1, Math.random() * 100)
  return Array.from({ length }, (_, i) => {
    const open = prevClose
    const high = open + Math.random() * 10
    const low = Math.max(0, open - Math.random() * 10)
    const adjustedHigh = Math.max(high, low + 0.01)
    const close = low + Math.random() * (adjustedHigh - low)
    prevClose = close
    return {
      time: formatDate(addDays(start, i)),
      open,
      high: adjustedHigh,
      low,
      close,
    }
  })
}

function generateHistogramData(
  length: number,
  upColor: string,
  downColor: string
): HistogramData<string>[] {
  const line = generateLineData(length)
  return line.map((item, i) => ({
    time: item.time,
    value: item.value,
    color: i > 0 && item.value < line[i - 1].value ? downColor : upColor,
  }))
}

const chartCommonOptions = {
  layout: {
    background: { color: "transparent" },
    textColor: "#9ca3af",
  },
  grid: {
    vertLines: { color: "rgba(255, 255, 255, 0.06)" },
    horzLines: { color: "rgba(255, 255, 255, 0.06)" },
  },
  autoSize: true,
}

export function Chart() {
  const [activeTab, setActiveTab] = useState<SeriesType>("Candlestick")

  const lineData = useMemo(() => generateLineData(50), [])
  const ohlcData = useMemo(() => generateOHLCData(50), [])
  const histogramData = useMemo(
    () => generateHistogramData(50, COLORS.orange, COLORS.blue),
    []
  )
  const baselinePrice = useMemo(() => {
    const values = lineData.map((d) => d.value)
    return (Math.min(...values) + Math.max(...values)) / 2
  }, [lineData])

  return (
    <div className="flex h-full flex-col p-3">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as SeriesType)}
      >
        <TabsList variant="line" className="gap-3">
          {SERIES_TYPES.map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className={cn(
                "px-1 text-xs",
                "data-active:text-foreground after:!bg-yellow-500"
              )}
            >
              {t}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="mt-3 flex-1 min-h-0">
        <LWChart
          options={chartCommonOptions}
          containerProps={{ style: { width: "100%", height: "100%" } }}
        >
          {activeTab === "Candlestick" && (
            <CandlestickSeries
              data={ohlcData}
              options={{
                upColor: COLORS.green,
                downColor: COLORS.red,
                borderUpColor: COLORS.green,
                borderDownColor: COLORS.red,
                wickUpColor: COLORS.green,
                wickDownColor: COLORS.red,
              }}
              reactive={false}
            />
          )}
          {activeTab === "Line" && (
            <LineSeries data={lineData} reactive={false} />
          )}
          {activeTab === "Bar" && (
            <BarSeries
              data={ohlcData}
              options={{ upColor: COLORS.green, downColor: COLORS.red }}
              reactive={false}
            />
          )}
          {activeTab === "Area" && (
            <AreaSeries
              data={lineData}
              options={{
                topColor: COLORS.pink,
                bottomColor: `${COLORS.pink}20`,
                lineColor: COLORS.pink,
              }}
              reactive={false}
            />
          )}
          {activeTab === "Histogram" && (
            <HistogramSeries data={histogramData} reactive={false} />
          )}
          {activeTab === "Baseline" && (
            <BaselineSeries
              data={lineData}
              options={{
                baseValue: { type: "price", price: baselinePrice },
                topLineColor: COLORS.green,
                bottomLineColor: COLORS.red,
              }}
              reactive={false}
            />
          )}
          <TimeScale>
            <TimeScaleFitContentTrigger deps={[activeTab]} />
          </TimeScale>
        </LWChart>
      </div>
    </div>
  )
}

export default Chart
