import { ChevronDown, FileSearch } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"

const orderManagementData = {
  openOrders: [] as unknown[],
  tabs: [
    { value: "open-orders", label: "Open Orders", count: 0 },
    { value: "order-history", label: "Order History" },
    { value: "trade-history", label: "Trade History" },
    { value: "holdings", label: "Holdings" },
    { value: "bots", label: "Bots" },
  ],
  columns: [
    { label: "Date" },
    { label: "Pair" },
    { label: "Type", sortable: true },
    { label: "Side", sortable: true },
    { label: "Price", sortable: "both" as const },
    { label: "Amount" },
    { label: "Amount per Iceberg Order" },
    { label: "Filled" },
    { label: "Total" },
    { label: "Trigger Conditions" },
    { label: "SOR" },
    { label: "TP/SL" },
  ],
}

function ColumnHeader({
  label,
  sortable,
}: {
  label: string
  sortable?: boolean | "both"
}) {
  return (
    <div className="flex items-center gap-1 whitespace-nowrap text-xs text-muted-foreground">
      <span>{label}</span>
      {sortable === true && <ChevronDown className="size-3" />}
      {sortable === "both" && (
        <span className="flex flex-col leading-none">
          <ChevronDown className="size-2.5 -mb-0.5 rotate-180" />
          <ChevronDown className="size-2.5" />
        </span>
      )}
    </div>
  )
}

export function OrderManagement() {
  const d = orderManagementData

  return (
    <section className="flex flex-col border-t">
      <div className="flex items-center justify-between px-3 pt-3 pb-2">
        <Tabs defaultValue="open-orders">
          <TabsList variant="line" className="gap-4">
            {d.tabs.map((t) => (
              <TabsTrigger
                key={t.value}
                value={t.value}
                className={cn(
                  "px-1 text-sm",
                  "data-active:text-foreground after:!bg-yellow-500"
                )}
              >
                {t.label}
                {t.count !== undefined && `(${t.count})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-2">
          <Checkbox id="hide-other-pairs" />
          <Label htmlFor="hide-other-pairs">Hide Other Pairs</Label>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(12,minmax(0,1fr))_auto] items-center gap-3 border-b px-3 py-2">
        {d.columns.map((c) => (
          <ColumnHeader key={c.label} label={c.label} sortable={c.sortable} />
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-yellow-500 hover:text-yellow-400"
        >
          Cancel All
          <ChevronDown className="size-3" />
        </button>
      </div>

      {d.openOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-3 py-16 text-xs text-muted-foreground">
          <FileSearch className="size-10 opacity-40" />
          <span>You have no open orders.</span>
        </div>
      ) : null}
    </section>
  )
}

export default OrderManagement
