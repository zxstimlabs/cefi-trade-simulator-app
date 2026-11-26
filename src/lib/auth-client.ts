// Better Auth client for the CeFi API: sign in with account number + PIN
// (the username plugin; the PIN is the "password") or a passkey, session,
// sign-out. Account creation is a plain POST /accounts (api.ts).

import { createAuthClient } from "better-auth/react"
import { usernameClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"
import { API_BASE } from "@/lib/api"

export const authClient = createAuthClient({
  baseURL: `${API_BASE}/auth`,
  plugins: [usernameClient(), passkeyClient()],
  fetchOptions: { credentials: "include" },
})

export const passkeysSupported =
  typeof window !== "undefined" && typeof window.PublicKeyCredential === "function"

// Better Auth errors, in Vietnamese.
export function authErrorMessage(err: { status?: number; message?: string } | null | undefined): string {
  if (!err) return "Đã có lỗi xảy ra"
  const message = err.message ?? ""
  if (err.status === 429) {
    const minutes = /in (\d+) min/.exec(message)?.[1]
    if (minutes) {
      return `Nhập sai mã PIN quá nhiều lần. Thử lại sau ${minutes} phút, hoặc đăng nhập bằng passkey.`
    }
    return "Quá nhiều yêu cầu, vui lòng thử lại sau"
  }
  if (err.status === 401) return "Số tài khoản hoặc mã PIN không đúng"
  if (err.status === 400) return "Số tài khoản hoặc mã PIN không hợp lệ"
  if (/cancel|abort|not allowed/i.test(message)) return "Đã huỷ xác thực passkey"
  return message || "Đã có lỗi xảy ra"
}
