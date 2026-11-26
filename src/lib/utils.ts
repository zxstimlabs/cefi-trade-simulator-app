import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const COLORS = {
  green: "#2ebd85",
  red: "#f6465d",
}

// Vietnamese number conventions: "." groups thousands, "," is the decimal point.
const vndFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 })
const ethFormat = new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 4 })
const pctFormat = new Intl.NumberFormat("vi-VN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const timeFormat = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
})
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
})

export const formatVnd = (v: number) => vndFormat.format(v)
export const formatEth = (v: number) => ethFormat.format(v)
export const formatPct = (v: number) => `${v > 0 ? "+" : ""}${pctFormat.format(v)}%`
export const formatTime = (ms: number) => timeFormat.format(ms)
export const formatDateTime = (ms: number) =>
  `${dateFormat.format(ms)} ${timeFormat.format(ms)}`

const vnGroup = new Intl.NumberFormat("vi-VN")

// Parse what's typed into a plain numeric string ("." decimal). For decimal
// amounts (ETH) the LAST separator typed — "." or "," — is the decimal point and
// anything before it is grouping, so a phone's "." key works even though "," is
// shown. Whole amounts (VND) drop every separator.
export function normalizeAmount(raw: string, allowDecimal: boolean, maxDecimals = 4): string {
  const s = raw.replace(/[^\d.,]/g, "")
  if (!allowDecimal) return s.replace(/[.,]/g, "")
  const lastSep = Math.max(s.lastIndexOf("."), s.lastIndexOf(","))
  if (lastSep === -1) return s
  const intPart = s.slice(0, lastSep).replace(/[.,]/g, "")
  const fracPart = s
    .slice(lastSep + 1)
    .replace(/[.,]/g, "")
    .slice(0, maxDecimals)
  return `${intPart}.${fracPart}`
}

// Show a normalized numeric string the Vietnamese way: "," for decimals, and
// "." thousands grouping on the whole part.
export function formatAmount(normalized: string): string {
  if (!normalized) return ""
  const [intRaw, decRaw] = normalized.split(".")
  const intDigits = intRaw.replace(/^0+(?=\d)/, "") || "0"
  const intOut = vnGroup.format(BigInt(intDigits))
  return normalized.includes(".") ? `${intOut},${decRaw ?? ""}` : intOut
}

// Account numbers: 16 Crockford base32 characters, shown as XXXX-XXXX-XXXX-XXXX.
export function formatAccountInput(raw: string): string {
  const s = raw
    .toUpperCase()
    .replace(/[^0-9A-Z]/g, "")
    .slice(0, 16)
  return s.match(/.{1,4}/g)?.join("-") ?? ""
}

export function maskAccountNumber(n: string): string {
  const s = formatAccountInput(n)
  return s.length === 19 ? `${s.slice(0, 4)}-••••-••••-${s.slice(-4)}` : s
}
