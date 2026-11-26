// The CeFi API (zxstim-api, api.cefi.vn): ETH/VND market data, the signed-in
// user's account and orders, and account creation. Sign-in, sign-out and
// passkeys go through Better Auth's client (auth-client.ts). Every call sends
// the session cookie (credentials: "include").

export const API_BASE: string =
  import.meta.env.VITE_CEFI_API ||
  (import.meta.env.DEV ? "http://localhost:8002" : "https://api.cefi.vn")

export const MARKET = "ETH-VND"

export type Side = "buy" | "sell"
export type OrderType = "limit" | "market"
export type OrderStatus = "open" | "partially_filled" | "filled" | "cancelled"

export interface Ticker {
  last: number
  open24h: number
  high24h: number
  low24h: number
  change24h: number
  changePct24h: number
  volume24h: number // ETH
  quoteVolume24h: number // VND
}

export interface DepthLevel {
  price: number
  quantity: number
  count: number
}

export interface MarketTrade {
  id: number
  price: number
  quantity: number
  side: Side // the taker's side
  time: number
}

export interface MarketSnapshot {
  market: string
  ticker: Ticker | null
  depth: { bids: DepthLevel[]; asks: DepthLevel[] }
  trades: MarketTrade[] // newest first
  updatedAt: number
}

export interface Candle {
  t: number // unix seconds
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface Order {
  id: string
  side: Side
  type: OrderType
  price: number | null
  quantity: number
  filled: number
  avgPrice: number | null
  total: number
  status: OrderStatus
  createdAt: number
  updatedAt: number
}

export interface Fill {
  id: string
  orderId: string
  side: Side
  price: number
  quantity: number
  total: number
  role: "maker" | "taker"
  time: number
}

export interface Balance {
  available: number
  locked: number
}

export interface Account {
  balances: { vnd: Balance; eth: Balance }
  openOrders: Order[] // newest first
  orderHistory: Order[]
  trades: Fill[]
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

async function toApiError(res: Response): Promise<ApiError> {
  const body = await res.json().catch(() => null)
  return new ApiError(res.status, body?.code ?? `http_${res.status}`, body?.error ?? res.statusText)
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: init.body ? { "content-type": "application/json", ...init.headers } : init.headers,
  })
  if (!res.ok) throw await toApiError(res)
  return res.json() as Promise<T>
}

// A GET that sends back the last ETag and reuses the last body on a 304, so
// polling every second is cheap.
export function etagPoller<T>(path: string): () => Promise<T> {
  let etag: string | null = null
  let last: T | undefined
  return async () => {
    const res = await fetch(`${API_BASE}${path}`, {
      credentials: "include",
      cache: "no-store",
      headers: etag && last !== undefined ? { "If-None-Match": etag } : {},
    })
    if (res.status === 304 && last !== undefined) return last
    if (!res.ok) throw await toApiError(res)
    etag = res.headers.get("etag")
    last = (await res.json()) as T
    return last
  }
}

export interface PlaceOrderBody {
  side: Side
  type: OrderType
  price?: string // VND, whole
  quantity: string // ETH, up to 4 decimals
}

export const api = {
  candles: (resolution: string, limit = 500) =>
    request<{ candles: Candle[] }>(
      `/market/${MARKET}/candles?resolution=${resolution}&limit=${limit}`,
    ).then((r) => r.candles),
  createAccount: (pin: string) =>
    request<{ accountNumber: string }>("/accounts", {
      method: "POST",
      body: JSON.stringify({ pin }),
    }),
  placeOrder: (body: PlaceOrderBody) =>
    request<{ order: Order }>("/me/orders", {
      method: "POST",
      body: JSON.stringify(body),
    }).then((r) => r.order),
  cancelOrder: (id: string) =>
    request<{ order: Order }>(`/me/orders/${encodeURIComponent(id)}`, {
      method: "DELETE",
    }).then((r) => r.order),
  cancelAll: () =>
    request<{ cancelled: number }>("/me/orders", { method: "DELETE" }).then(
      (r) => r.cancelled,
    ),
}

// The API's error codes, in Vietnamese. Unknown codes fall back to the message.
const MESSAGES: Record<string, string> = {
  insufficient_balance: "Số dư không đủ",
  price_out_of_band: "Giá nằm ngoài biên độ cho phép (±50% giá gần nhất)",
  invalid_price: "Giá phải là số nguyên VND",
  invalid_quantity: "Khối lượng phải từ 0,001 đến 100 ETH",
  too_many_orders: "Tối đa 20 lệnh đang mở",
  no_liquidity: "Không có lệnh đối ứng trên sổ lệnh",
  unknown_order: "Lệnh không còn mở",
  market_unavailable: "Thị trường đang tạm dừng, vui lòng thử lại sau",
  rate_limited: "Thao tác quá nhanh, vui lòng thử lại sau",
  unauthenticated: "Vui lòng đăng nhập",
  forbidden_origin: "Yêu cầu không hợp lệ",
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return MESSAGES[err.code] ?? err.message
  if (err instanceof TypeError) return "Không kết nối được máy chủ"
  if (err instanceof Error) return err.message
  return "Đã có lỗi xảy ra"
}
