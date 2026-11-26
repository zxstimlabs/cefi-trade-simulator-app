import { useEffect, useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, LoaderCircle } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useSession } from "@/hooks/use-account"
import { useMarketSnapshot } from "@/hooks/use-market"
import { api, errorMessage, type DepthLevel, type Order, type OrderType, type Side } from "@/lib/api"
import { cn, formatAmount, formatEth, formatVnd, normalizeAmount } from "@/lib/utils"

const MIN_ETH = 0.001
const PERCENTS = [25, 50, 75, 100]

const floor4 = (v: number) => Math.floor(v * 10_000 + 1e-9) / 10_000

// Walk the book: what `qty` ETH would cost (asks) or fetch (bids), and how
// much of it the shown depth can fill.
function walk(levels: DepthLevel[], qty: number) {
  let left = qty
  let total = 0
  for (const l of levels) {
    if (left <= 0) break
    const q = Math.min(left, l.quantity)
    total += q * l.price
    left -= q
  }
  return { total, filled: qty - Math.max(0, left) }
}

// How much ETH `budget` VND buys from the asks.
function qtyForBudget(asks: DepthLevel[], budget: number) {
  let left = budget
  let qty = 0
  for (const l of asks) {
    if (left <= 0) break
    const q = Math.min(l.quantity, left / l.price)
    qty += q
    left -= q * l.price
  }
  return qty
}

function Field({
  label,
  unit,
  children,
  muted,
}: {
  label: string
  unit: string
  children: React.ReactNode
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center border border-muted-foreground/30 px-3 py-2 focus-within:border-ring",
        muted && "bg-muted/40",
      )}
    >
      <span className="mr-2 shrink-0 text-xs text-muted-foreground">{label}</span>
      {children}
      <span className="ml-2 shrink-0 text-xs text-muted-foreground">{unit}</span>
    </div>
  )
}

function describe(order: Order): string {
  const verb = order.side === "buy" ? "mua" : "bán"
  if (order.status === "filled") {
    return `Đã khớp ${verb} ${formatEth(order.filled)} ETH, giá TB ${formatVnd(order.avgPrice ?? 0)} VND`
  }
  if (order.type === "market") {
    return order.filled > 0
      ? `Khớp ${verb} ${formatEth(order.filled)}/${formatEth(order.quantity)} ETH, phần còn lại đã huỷ`
      : "Không có thanh khoản để khớp lệnh"
  }
  return order.filled > 0
    ? `Đã đặt lệnh ${verb}, khớp ngay ${formatEth(order.filled)} ETH`
    : `Đã đặt lệnh ${verb} ${formatEth(order.quantity)} ETH @ ${formatVnd(order.price ?? 0)}`
}

export function OrderForm() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const { data: account, isLoading: accountLoading } = useAccount()
  const { data: snapshot } = useMarketSnapshot()

  const [side, setSide] = useState<Side>("buy")
  const [type, setType] = useState<OrderType>("limit")
  const [price, setPrice] = useState("") // whole VND, digits only
  const [priceTouched, setPriceTouched] = useState(false)
  const [amount, setAmount] = useState("") // ETH, "." decimal

  const bestAsk = snapshot?.depth.asks[0]?.price
  const bestBid = snapshot?.depth.bids[0]?.price
  const refPrice = (side === "buy" ? bestAsk : bestBid) ?? snapshot?.ticker?.last

  // Start the limit price at the best price on the other side (once per side,
  // unless the user has typed one). Set during render, React's pattern for
  // state that follows other state.
  if (!priceTouched && price === "" && refPrice) setPrice(String(Math.round(refPrice)))

  const priceNum = Number(price || 0)
  const amountNum = Number(amount || 0)
  const asks = snapshot?.depth.asks ?? []
  const bids = snapshot?.depth.bids ?? []

  const available = side === "buy" ? account?.balances.vnd.available : account?.balances.eth.available
  const estimate = type === "market" && amountNum > 0 ? walk(side === "buy" ? asks : bids, amountNum) : null
  const total = type === "limit" ? priceNum * amountNum : (estimate?.total ?? 0)

  let problem: string | null = null
  if (amountNum > 0 && amountNum < MIN_ETH) problem = `Tối thiểu ${formatEth(MIN_ETH)} ETH`
  else if (available !== undefined && amountNum > 0) {
    const need = side === "buy" ? total : amountNum
    if (need > available + 1e-9) problem = "Số dư không đủ"
  }

  const place = useMutation({
    mutationFn: () =>
      api.placeOrder({
        side,
        type,
        quantity: amount.replace(/\.$/, ""),
        ...(type === "limit" ? { price } : {}),
      }),
    onSuccess: (order) => {
      setAmount("")
      const msg = describe(order)
      if (order.type === "market" && order.filled === 0) toast.error(msg)
      else toast.success(msg)
      void queryClient.invalidateQueries({ queryKey: ["account"] })
    },
    onError: (e) => toast.error(errorMessage(e)),
  })

  // Back to idle shortly after a result. Depend on the stable bits only: the
  // mutation object changes every render (the 1 s polls).
  const { isSuccess, isError, reset } = place
  useEffect(() => {
    if (!isSuccess && !isError) return
    const t = setTimeout(() => reset(), 1200)
    return () => clearTimeout(t)
  }, [isSuccess, isError, reset])

  function setPercent(pct: number) {
    if (available === undefined) return
    let qty: number
    if (side === "sell") qty = (available * pct) / 100
    else if (type === "limit") qty = priceNum > 0 ? (available * pct) / 100 / priceNum : 0
    else qty = qtyForBudget(asks, (available * pct) / 100)
    const q = floor4(qty)
    setAmount(q > 0 ? String(q) : "")
  }

  const canSubmit =
    !!user &&
    amountNum >= MIN_ETH &&
    (type === "market" || priceNum > 0) &&
    !problem &&
    !place.isPending &&
    !place.isSuccess

  const buy = side === "buy"
  const sideColor = buy ? "bg-[#2ebd85] hover:bg-[#2ebd85]/90" : "bg-[#f6465d] hover:bg-[#f6465d]/90"

  return (
    <section className="flex flex-col gap-3 border border-muted-foreground/10 p-3">
      <div className="grid grid-cols-2 border border-muted-foreground/20">
        {(["buy", "sell"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => {
              setSide(s)
              setPriceTouched(false)
              setPrice("")
              setAmount("")
            }}
            className={cn(
              "py-1.5 text-sm font-semibold transition-colors",
              side === s
                ? s === "buy"
                  ? "bg-[#2ebd85] text-white"
                  : "bg-[#f6465d] text-white"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {s === "buy" ? "Mua" : "Bán"}
          </button>
        ))}
      </div>

      <Tabs value={type} onValueChange={(v) => setType(v as OrderType)}>
        <TabsList variant="line" className="gap-4">
          <TabsTrigger value="limit" className="px-1 text-xs data-active:text-foreground">
            Giới hạn
          </TabsTrigger>
          <TabsTrigger value="market" className="px-1 text-xs data-active:text-foreground">
            Thị trường
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (canSubmit) place.mutate()
        }}
      >
        {type === "limit" ? (
          <Field label="Giá" unit="VND">
            <input
              value={formatAmount(price)}
              onChange={(e) => {
                setPriceTouched(true)
                setPrice(normalizeAmount(e.target.value, false))
              }}
              inputMode="numeric"
              placeholder="0"
              aria-label="Giá (VND)"
              className="min-w-0 flex-1 bg-transparent text-right text-sm tabular-nums outline-none"
            />
          </Field>
        ) : (
          <Field label="Giá" unit="VND" muted>
            <span className="flex-1 text-right text-sm text-muted-foreground">Giá thị trường</span>
          </Field>
        )}

        <Field label="Khối lượng" unit="ETH">
          <input
            value={formatAmount(amount)}
            onChange={(e) => setAmount(normalizeAmount(e.target.value, true, 4))}
            inputMode="decimal"
            placeholder="0"
            aria-label="Khối lượng (ETH)"
            className="min-w-0 flex-1 bg-transparent text-right text-sm tabular-nums outline-none"
          />
        </Field>

        <div className="grid grid-cols-4 gap-1">
          {PERCENTS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={!user || available === undefined}
              onClick={() => setPercent(p)}
              className="border border-muted-foreground/20 py-1 text-[10px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
            >
              {p}%
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{type === "market" ? "Tổng (ước tính)" : "Tổng"}</span>
            <span className="tabular-nums">
              {total > 0 ? `${type === "market" ? "≈ " : ""}${formatVnd(total)}` : "0"} VND
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Khả dụng</span>
            <span className="tabular-nums">
              {!user ? (
                "-"
              ) : accountLoading || available === undefined ? (
                <Skeleton className="inline-block h-3 w-16" />
              ) : buy ? (
                `${formatVnd(available)} VND`
              ) : (
                `${formatEth(available)} ETH`
              )}
            </span>
          </div>
          {estimate && estimate.filled < amountNum - 1e-9 && (
            <p className="text-[10px] text-muted-foreground">
              Sổ lệnh hiện chỉ đủ khớp khoảng {formatEth(floor4(estimate.filled))} ETH
            </p>
          )}
          {problem && <p className="text-[10px] text-[#f6465d]">{problem}</p>}
        </div>

        {user ? (
          <Button type="submit" size="lg" className={cn("w-full font-bold text-white", sideColor)} disabled={!canSubmit}>
            {place.isPending && <LoaderCircle className="size-4 animate-spin" />}
            {place.isSuccess && <Check className="size-4" />}
            {!place.isPending && !place.isSuccess && (buy ? "Mua ETH" : "Bán ETH")}
          </Button>
        ) : (
          <Button type="button" size="lg" variant="outline" className="w-full" disabled>
            Đăng nhập để giao dịch
          </Button>
        )}
      </form>
    </section>
  )
}

export default OrderForm
