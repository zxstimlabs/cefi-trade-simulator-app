import { useState } from "react"
import {
  CandlestickSeries,
  Chart as LWChart,
  TimeScale,
  TimeScaleFitContentTrigger,
} from "lightweight-charts-react-components"
import type { KlineInterval } from "binance"

import { useEthUsdtKlines } from "@/hooks/use-eth-usdt-klines"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const COLORS = {
  green: "#2ebd85",
  red: "#f6465d",
}

const INTERVALS = [
  { value: "1m", label: "1m" },
  { value: "5m", label: "5m" },
  { value: "15m", label: "15m" },
  { value: "1h", label: "1H" },
  { value: "4h", label: "4H" },
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
] as const satisfies readonly { value: KlineInterval; label: string }[]

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
  const [interval, setInterval] = useState<KlineInterval>("1d")
  const { candles, loading } = useEthUsdtKlines(interval)

  return (
    <div className="flex h-full flex-col p-3">
      <div className="flex items-center justify-between">
        <Tabs
          value={interval}
          onValueChange={(v) => setInterval(v as KlineInterval)}
        >
          <TabsList variant="line" className="gap-3">
            {INTERVALS.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  "px-1 text-xs",
                  "data-active:text-foreground after:!bg-yellow-500"
                )}
              >
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        {loading && (
          <span className="text-[10px] text-muted-foreground">Loading…</span>
        )}
      </div>

      <div className="mt-3 flex-1 min-h-0">
        <LWChart
          options={chartCommonOptions}
          containerProps={{ style: { width: "100%", height: "100%" } }}
        >
          <CandlestickSeries
            data={candles}
            options={{
              upColor: COLORS.green,
              downColor: COLORS.red,
              borderUpColor: COLORS.green,
              borderDownColor: COLORS.red,
              wickUpColor: COLORS.green,
              wickDownColor: COLORS.red,
            }}
            reactive
          />
          <TimeScale>
            <TimeScaleFitContentTrigger deps={[interval, candles.length === 0]} />
          </TimeScale>
        </LWChart>
      </div>
    </div>
  )
}

export default Chart
