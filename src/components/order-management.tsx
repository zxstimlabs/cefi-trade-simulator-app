import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { FileSearch, LoaderCircle, X } from "lucide-react"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useSession } from "@/hooks/use-account"
import { useMarketSnapshot } from "@/hooks/use-market"
import { api, errorMessage, type Fill, type Order, type OrderStatus } from "@/lib/api"
import { cn, formatDateTime, formatEth, formatVnd } from "@/lib/utils"

type Tab = "open" | "history" | "trades" | "assets"

const PAIR = "ETH/VND"
const SIDE_LABEL = { buy: "Mua", sell: "Bán" } as const
const TYPE_LABEL = { limit: "Giới hạn", market: "Thị trường" } as const
const STATUS_LABEL: Record<OrderStatus, string> = {
  open: "Đang mở",
  partially_filled: "Khớp một phần",
  filled: "Đã khớp",
  cancelled: "Đã huỷ",
}

const sideClass = (side: "buy" | "sell") => (side === "buy" ? "text-[#2ebd85]" : "text-[#f6465d]")

// A responsive table: a grid row per item on desktop, a card per item on mobile.
interface Column<T> {
  label: string
  align?: "right"
  cell: (row: T) => React.ReactNode
}

function DataTable<T>({
  columns,
  rows,
  rowKey,
  empty,
  action,
}: {
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  empty: string
  action?: { header: React.ReactNode; cell: (row: T) => React.ReactNode }
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
        <FileSearch className="size-8 opacity-40" />
        <span>{empty}</span>
      </div>
    )
  }
  const template = `repeat(${columns.length}, minmax(0, 1fr))${action ? " 5rem" : ""}`
  return (
    <>
      {/* desktop */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        <div
          className="grid items-center gap-3 border-b px-3 py-2 text-xs text-muted-foreground"
          style={{ gridTemplateColumns: template }}
        >
          {columns.map((c) => (
            <span key={c.label} className={cn("whitespace-nowrap", c.align === "right" && "text-right")}>
              {c.label}
            </span>
          ))}
          {action && <span className="text-right">{action.header}</span>}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {rows.map((row) => (
            <div
              key={rowKey(row)}
              className="grid items-center gap-3 px-3 py-1.5 text-xs tabular-nums hover:bg-muted/40"
              style={{ gridTemplateColumns: template }}
            >
              {columns.map((c) => (
                <span key={c.label} className={cn("truncate", c.align === "right" && "text-right")}>
                  {c.cell(row)}
                </span>
              ))}
              {action && <span className="text-right">{action.cell(row)}</span>}
            </div>
          ))}
        </div>
      </div>
      {/* mobile */}
      <div className="flex flex-col md:hidden">
        {rows.map((row) => (
          <div key={rowKey(row)} className="flex flex-col gap-1.5 border-b px-3 py-2.5">
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
              {columns.map((c) => (
                <div key={c.label} className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">{c.label}</span>
                  <span className="truncate tabular-nums">{c.cell(row)}</span>
                </div>
              ))}
            </div>
            {action && <div className="flex justify-end">{action.cell(row)}</div>}
          </div>
        ))}
      </div>
    </>
  )
}

const orderBase: Column<Order>[] = [
  { label: "Thời gian", cell: (o) => formatDateTime(o.createdAt) },
  { label: "Cặp", cell: () => PAIR },
  { label: "Loại", cell: (o) => TYPE_LABEL[o.type] },
  { label: "Chiều", cell: (o) => <span className={sideClass(o.side)}>{SIDE_LABEL[o.side]}</span> },
  { label: "Giá", align: "right", cell: (o) => (o.price === null ? "Thị trường" : formatVnd(o.price)) },
]

const openColumns: Column<Order>[] = [
  ...orderBase,
  { label: "Khối lượng", align: "right", cell: (o) => formatEth(o.quantity) },
  { label: "Đã khớp", align: "right", cell: (o) => `${Math.round((o.filled / o.quantity) * 100)}%` },
  { label: "Tổng (VND)", align: "right", cell: (o) => formatVnd((o.price ?? 0) * o.quantity) },
]

const historyColumns: Column<Order>[] = [
  ...orderBase,
  { label: "Giá TB", align: "right", cell: (o) => (o.avgPrice === null ? "-" : formatVnd(o.avgPrice)) },
  { label: "Đã khớp / KL", align: "right", cell: (o) => `${formatEth(o.filled)} / ${formatEth(o.quantity)}` },
  { label: "Tổng (VND)", align: "right", cell: (o) => formatVnd(o.total) },
  {
    label: "Trạng thái",
    align: "right",
    cell: (o) => (
      <span className={cn(o.status === "filled" ? "text-foreground" : "text-muted-foreground")}>
        {o.status === "cancelled" && o.filled > 0 ? "Khớp một phần, đã huỷ" : STATUS_LABEL[o.status]}
      </span>
    ),
  },
]

const tradeColumns: Column<Fill>[] = [
  { label: "Thời gian", cell: (f) => formatDateTime(f.time) },
  { label: "Cặp", cell: () => PAIR },
  { label: "Chiều", cell: (f) => <span className={sideClass(f.side)}>{SIDE_LABEL[f.side]}</span> },
  { label: "Giá", align: "right", cell: (f) => formatVnd(f.price) },
  { label: "Khối lượng", align: "right", cell: (f) => formatEth(f.quantity) },
  { label: "Tổng (VND)", align: "right", cell: (f) => formatVnd(f.total) },
  { label: "Vai trò", align: "right", cell: (f) => (f.role === "maker" ? "Maker" : "Taker") },
]

interface AssetRow {
  asset: "VND" | "ETH"
  total: number
  available: number
  locked: number
  value: number // in VND
}

function CancelButton({ order }: { order: Order }) {
  const queryClient = useQueryClient()
  const cancel = useMutation({
    mutationFn: () => api.cancelOrder(order.id),
    onSuccess: () => {
      toast.success("Đã huỷ lệnh")
      void queryClient.invalidateQueries({ queryKey: ["account"] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })
  return (
    <button
      type="button"
      disabled={cancel.isPending}
      onClick={() => cancel.mutate()}
      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
    >
      {cancel.isPending ? <LoaderCircle className="size-3 animate-spin" /> : <X className="size-3" />}
      Huỷ
    </button>
  )
}

export function OrderManagement() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { data: account } = useAccount()
  const { data: snapshot } = useMarketSnapshot()
  const [tab, setTab] = useState<Tab>("open")

  const cancelAll = useMutation({
    mutationFn: api.cancelAll,
    onSuccess: (n) => {
      toast.success(`Đã huỷ ${n} lệnh`)
      void queryClient.invalidateQueries({ queryKey: ["account"] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  const openOrders = account?.openOrders ?? []
  const last = snapshot?.ticker?.last ?? 0
  const assets: AssetRow[] = account
    ? [
        {
          asset: "VND",
          available: account.balances.vnd.available,
          locked: account.balances.vnd.locked,
          total: account.balances.vnd.available + account.balances.vnd.locked,
          value: account.balances.vnd.available + account.balances.vnd.locked,
        },
        {
          asset: "ETH",
          available: account.balances.eth.available,
          locked: account.balances.eth.locked,
          total: account.balances.eth.available + account.balances.eth.locked,
          value: (account.balances.eth.available + account.balances.eth.locked) * last,
        },
      ]
    : []
  const fmt = (a: AssetRow, v: number) => (a.asset === "VND" ? formatVnd(v) : formatEth(v))
  const assetColumns: Column<AssetRow>[] = [
    { label: "Tài sản", cell: (a) => <span className="font-medium">{a.asset}</span> },
    { label: "Tổng", align: "right", cell: (a) => fmt(a, a.total) },
    { label: "Khả dụng", align: "right", cell: (a) => fmt(a, a.available) },
    { label: "Đang khoá", align: "right", cell: (a) => fmt(a, a.locked) },
    { label: "Giá trị (VND)", align: "right", cell: (a) => formatVnd(a.value) },
  ]

  const tabs: { value: Tab; label: string }[] = [
    { value: "open", label: `Lệnh đang mở (${openOrders.length})` },
    { value: "history", label: "Lịch sử lệnh" },
    { value: "trades", label: "Lịch sử giao dịch" },
    { value: "assets", label: "Tài sản" },
  ]

  let content: React.ReactNode
  if (!user) {
    content = (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-3 py-8 text-xs text-muted-foreground">
        <FileSearch className="size-8 opacity-40" />
        <span>Đăng nhập để xem lệnh và tài sản của bạn.</span>
      </div>
    )
  } else if (tab === "open") {
    content = (
      <DataTable
        columns={openColumns}
        rows={openOrders}
        rowKey={(o) => o.id}
        empty="Bạn không có lệnh đang mở."
        action={{ header: "", cell: (o) => <CancelButton order={o} /> }}
      />
    )
  } else if (tab === "history") {
    content = (
      <DataTable columns={historyColumns} rows={account?.orderHistory ?? []} rowKey={(o) => o.id} empty="Chưa có lệnh nào." />
    )
  } else if (tab === "trades") {
    content = <DataTable columns={tradeColumns} rows={account?.trades ?? []} rowKey={(f) => f.id} empty="Chưa có giao dịch nào." />
  } else {
    content = <DataTable columns={assetColumns} rows={assets} rowKey={(a) => a.asset} empty="Đang tải…" />
  }

  return (
    <section className="flex h-full min-h-0 flex-col border border-muted-foreground/10">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="min-w-0 overflow-x-auto">
          <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
            <TabsList variant="line" className="gap-4">
              {tabs.map((t) => (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="px-1 text-xs whitespace-nowrap data-active:text-foreground md:text-sm"
                >
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
        {user && tab === "open" && openOrders.length > 0 && (
          <button
            type="button"
            disabled={cancelAll.isPending}
            onClick={() => cancelAll.mutate()}
            className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {cancelAll.isPending && <LoaderCircle className="size-3 animate-spin" />}
            Huỷ tất cả
          </button>
        )}
      </div>
      {content}
    </section>
  )
}

export default OrderManagement
