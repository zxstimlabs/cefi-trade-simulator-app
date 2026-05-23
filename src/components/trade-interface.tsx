import {
  ChevronDown,
  ChevronUp,
  CreditCard,
  Percent,
  Repeat,
} from "lucide-react"

import { Chart } from "@/components/chart"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const tradeData = {
  pair: { base: "ETH", quote: "USDT" },
  counterparties: ["Counterparty 1", "Counterparty 2", "Counterparty 3"],
  buy: {
    available: 0.94211549,
    availableAsset: "USDT",
    maxAmount: 0.0004,
    maxAsset: "ETH",
    minTotal: 5,
  },
  sell: {
    price: 2031.61,
    available: 0,
    availableAsset: "ETH",
    maxAmount: 0,
    maxAsset: "USDT",
    minTotal: 5,
  },
}

const MARGIN_TABS = ["Spot", "Cross", "Isolated", "Grid"]
const ORDER_TYPE_TABS = ["Limit", "Market", "Stop Limit"]

function NumberSpinner() {
  return (
    <div className="flex flex-col">
      <button
        type="button"
        className="leading-none text-muted-foreground hover:text-foreground"
        aria-label="Increase"
      >
        <ChevronUp className="size-3" />
      </button>
      <button
        type="button"
        className="leading-none text-muted-foreground hover:text-foreground"
        aria-label="Decrease"
      >
        <ChevronDown className="size-3" />
      </button>
    </div>
  )
}

function PercentSlider() {
  return (
    <div className="relative h-4">
      <div className="absolute inset-x-1 top-1/2 h-px -translate-y-1/2 bg-muted-foreground/30" />
      <div className="relative flex h-full items-center justify-between">
        {[0, 25, 50, 75, 100].map((p) => (
          <div
            key={p}
            className="h-2 w-2 rotate-45 border border-muted-foreground/60 bg-background"
          />
        ))}
      </div>
    </div>
  )
}

function StatRow({
  label,
  value,
  showPlus,
}: {
  label: string
  value?: string
  showPlus?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground underline decoration-dotted underline-offset-2">
        {label}
      </span>
      {value && (
        <div className="flex items-center gap-1.5">
          <span className="tabular-nums">{value}</span>
          {showPlus && (
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black">
              +
            </span>
          )}
        </div>
      )}
    </div>
  )
}

type BuyData = typeof tradeData.buy
type SellData = typeof tradeData.sell

function BuyColumn({
  data,
  pair,
  counterparties,
}: {
  data: BuyData
  pair: { base: string; quote: string }
  counterparties: string[]
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Select defaultValue={counterparties[0]}>
          <SelectTrigger className="h-8 flex-1">
            <SelectValue placeholder="Counterparty" />
          </SelectTrigger>
          <SelectContent>
            {counterparties.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 px-3">
          BBO
        </Button>
      </div>

      <InputGroup>
        <InputGroupAddon align="inline-start">Amount</InputGroupAddon>
        <InputGroupInput className="text-right tabular-nums" />
        <InputGroupAddon align="inline-end">
          <span className="text-foreground">{pair.base}</span>
          <NumberSpinner />
        </InputGroupAddon>
      </InputGroup>

      <PercentSlider />

      <InputGroup>
        <InputGroupAddon align="inline-start">Total</InputGroupAddon>
        <InputGroupInput className="text-right tabular-nums" />
        <InputGroupAddon align="inline-end">
          <span className="text-muted-foreground/60">
            Minimum {data.minTotal}
          </span>
          <span className="text-foreground">{pair.quote}</span>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex items-center gap-2">
        <Checkbox id="buy-tpsl" />
        <Label htmlFor="buy-tpsl">TP/SL</Label>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="flex items-center gap-1 text-muted-foreground underline decoration-dotted underline-offset-2"
          >
            Avbl <ChevronDown className="size-3" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums">
              {data.available.toFixed(8)} {data.availableAsset}
            </span>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black">
              +
            </span>
          </div>
        </div>
        <StatRow
          label="Max Buy"
          value={`${data.maxAmount} ${data.maxAsset}`}
        />
        <StatRow label="Est. Fee" />
      </div>

      <Button className="h-10 w-full rounded-none bg-[#2ebd85] text-sm font-medium text-white hover:bg-[#2ebd85]/90">
        Buy {pair.base}
      </Button>
    </div>
  )
}

function SellColumn({
  data,
  pair,
}: {
  data: SellData
  pair: { base: string; quote: string }
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <InputGroup>
          <InputGroupAddon align="inline-start">Price</InputGroupAddon>
          <InputGroupInput
            defaultValue={data.price.toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
            className="text-right tabular-nums"
          />
          <InputGroupAddon align="inline-end">
            <span className="text-foreground">{pair.quote}</span>
            <NumberSpinner />
          </InputGroupAddon>
        </InputGroup>
        <Button variant="outline" size="sm" className="h-8 px-3">
          BBO
        </Button>
      </div>

      <InputGroup>
        <InputGroupAddon align="inline-start">Amount</InputGroupAddon>
        <InputGroupInput className="text-right tabular-nums" />
        <InputGroupAddon align="inline-end">
          <span className="text-foreground">{pair.base}</span>
          <NumberSpinner />
        </InputGroupAddon>
      </InputGroup>

      <PercentSlider />

      <InputGroup>
        <InputGroupAddon align="inline-start">Total</InputGroupAddon>
        <InputGroupInput className="text-right tabular-nums" />
        <InputGroupAddon align="inline-end">
          <span className="text-muted-foreground/60">
            Minimum {data.minTotal}
          </span>
          <span className="text-foreground">{pair.quote}</span>
        </InputGroupAddon>
      </InputGroup>

      <div className="flex items-center gap-2">
        <Checkbox id="sell-tpsl" />
        <Label htmlFor="sell-tpsl">TP/SL</Label>
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs">
          <button
            type="button"
            className="flex items-center gap-1 text-muted-foreground underline decoration-dotted underline-offset-2"
          >
            Avbl <ChevronDown className="size-3" />
          </button>
          <div className="flex items-center gap-1.5">
            <span className="tabular-nums">
              {data.available.toFixed(8)} {data.availableAsset}
            </span>
            <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-black">
              +
            </span>
          </div>
        </div>
        <StatRow
          label="Max Sell"
          value={`${data.maxAmount} ${data.maxAsset}`}
        />
        <StatRow label="Est. Fee" />
      </div>

      <Button className="h-10 w-full rounded-none bg-[#f6465d] text-sm font-medium text-white hover:bg-[#f6465d]/90">
        Sell {pair.base}
      </Button>
    </div>
  )
}

export function TradeInterface() {
  const d = tradeData
  return (
    <section className="flex h-full flex-col">
      <div className="flex h-1/2 min-h-0 flex-col border-b">
        <Chart />
      </div>

      <div className="flex h-1/2 min-h-0 flex-col p-3">
        <div className="flex items-center justify-between pb-3">
          <Tabs defaultValue="Spot">
            <TabsList variant="line" className="gap-3">
              {MARGIN_TABS.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className={cn(
                    "px-1 text-sm",
                    "data-active:text-foreground after:!bg-yellow-500"
                  )}
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <button
            type="button"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Percent className="size-3.5" />
            Fee Level
          </button>
        </div>

        <div className="flex items-center justify-between pb-3">
          <Tabs defaultValue="Limit">
            <TabsList variant="line" className="gap-3">
              {ORDER_TYPE_TABS.map((t) => (
                <TabsTrigger
                  key={t}
                  value={t}
                  className={cn(
                    "px-1",
                    "data-active:text-foreground after:!bg-yellow-500"
                  )}
                >
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Repeat className="size-3.5" />
              Recurring
            </button>
            <button
              type="button"
              className="flex items-center gap-1 hover:text-foreground"
            >
              <CreditCard className="size-3.5" />
              Buy with USD
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <BuyColumn
            data={d.buy}
            pair={d.pair}
            counterparties={d.counterparties}
          />
          <SellColumn data={d.sell} pair={d.pair} />
        </div>
      </div>
    </section>
  )
}

export default TradeInterface
