import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Eye, EyeOff, KeyRound, LoaderCircle, LogOut, TriangleAlert } from "lucide-react"
import { REGEXP_ONLY_DIGITS } from "input-otp"
import { toast } from "sonner"

import { CopyButton } from "@/components/copy-button"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAccount, useSession } from "@/hooks/use-account"
import { api, errorMessage } from "@/lib/api"
import { authClient, authErrorMessage, passkeysSupported } from "@/lib/auth-client"
import { cn, formatAccountInput, formatEth, formatVnd, maskAccountNumber } from "@/lib/utils"

function PinInput({
  id,
  value,
  onChange,
  disabled,
  onComplete,
}: {
  id?: string
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  onComplete?: () => void
}) {
  return (
    <InputOTP
      id={id}
      maxLength={6}
      pattern={REGEXP_ONLY_DIGITS}
      value={value}
      onChange={onChange}
      onComplete={onComplete}
      disabled={disabled}
      inputMode="numeric"
    >
      <InputOTPGroup>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <InputOTPSlot key={i} index={i} />
        ))}
      </InputOTPGroup>
    </InputOTP>
  )
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return <p className="text-xs break-words text-[#f6465d]">{children}</p>
}

function PasskeyButton({ label, onDone }: { label: string; onDone?: () => void }) {
  const [busy, setBusy] = useState(false)
  if (!passkeysSupported) return null

  async function signIn() {
    setBusy(true)
    const { error } = await authClient.signIn.passkey()
    setBusy(false)
    if (error) toast.error(authErrorMessage(error))
    else onDone?.()
  }

  return (
    <Button type="button" variant="outline" className="w-full" disabled={busy} onClick={signIn}>
      {busy ? <LoaderCircle className="animate-spin" /> : <KeyRound data-icon="inline-start" />}
      {label}
    </Button>
  )
}

function SignInForm() {
  const [number, setNumber] = useState("")
  const [pin, setPin] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const ready = number.length === 19 && pin.length === 6

  async function submit() {
    if (!ready || busy) return
    setBusy(true)
    setError(undefined)
    const { error } = await authClient.signIn.username({ username: number, password: pin })
    setBusy(false)
    if (error) {
      setError(authErrorMessage(error))
      setPin("")
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="account-number" className="text-xs text-muted-foreground">
          Số tài khoản
        </Label>
        <Input
          id="account-number"
          value={number}
          onChange={(e) => setNumber(formatAccountInput(e.target.value))}
          placeholder="XXXX-XXXX-XXXX-XXXX"
          autoComplete="username"
          autoCapitalize="characters"
          spellCheck={false}
          className="h-9 font-mono text-sm tracking-wider"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="sign-in-pin" className="text-xs text-muted-foreground">
          Mã PIN
        </Label>
        <PinInput id="sign-in-pin" value={pin} onChange={setPin} disabled={busy} />
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" className="w-full" disabled={!ready || busy}>
        {busy && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
        Đăng nhập
      </Button>
      {passkeysSupported && (
        <>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            hoặc
            <span className="h-px flex-1 bg-border" />
          </div>
          <PasskeyButton label="Đăng nhập bằng passkey" />
        </>
      )}
    </form>
  )
}

function CreateAccountForm({ onCreated }: { onCreated: (accountNumber: string) => void }) {
  const { refetch } = useSession()
  const [pin, setPin] = useState("")
  const [confirm, setConfirm] = useState("")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const mismatch = confirm.length === 6 && confirm !== pin
  const ready = pin.length === 6 && confirm === pin

  async function submit() {
    if (!ready || busy) return
    setBusy(true)
    setError(undefined)
    try {
      const { accountNumber } = await api.createAccount(pin)
      onCreated(accountNumber)
      await refetch()
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault()
        void submit()
      }}
    >
      <p className="text-xs text-muted-foreground">
        Tài khoản mô phỏng bắt đầu với 50.000.000 VND và 1 ETH. Không cần email: bạn sẽ nhận số tài khoản
        và đăng nhập bằng mã PIN 6 số.
      </p>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="new-pin" className="text-xs text-muted-foreground">
          Chọn mã PIN
        </Label>
        <PinInput id="new-pin" value={pin} onChange={setPin} disabled={busy} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirm-pin" className="text-xs text-muted-foreground">
          Nhập lại mã PIN
        </Label>
        <PinInput id="confirm-pin" value={confirm} onChange={setConfirm} disabled={busy} />
      </div>
      {mismatch && <ErrorText>Mã PIN nhập lại không khớp</ErrorText>}
      {error && <ErrorText>{error}</ErrorText>}
      <Button type="submit" className="w-full" disabled={!ready || busy}>
        {busy && <LoaderCircle className="animate-spin" data-icon="inline-start" />}
        Mở tài khoản
      </Button>
    </form>
  )
}

// Shown once, right after the account is created: the number is the only way
// back in (with the PIN), so make sure it's saved.
function NewAccountDialog({ accountNumber, onClose }: { accountNumber: string | null; onClose: () => void }) {
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  async function addPasskey() {
    setAdding(true)
    const { error } = await authClient.passkey.addPasskey({ name: "CeFi.vn" })
    setAdding(false)
    if (error) toast.error(authErrorMessage(error))
    else {
      setAdded(true)
      toast.success("Đã thêm passkey")
    }
  }

  return (
    <Dialog open={accountNumber !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Lưu số tài khoản của bạn</DialogTitle>
          <DialogDescription>
            Bạn cần số tài khoản và mã PIN để đăng nhập lại. Không có email hay cách khôi phục nào khác.
          </DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-between border px-3 py-3">
          <span className="font-mono text-base tracking-wider">{accountNumber}</span>
          {accountNumber && <CopyButton text={accountNumber} label="Sao chép số tài khoản" />}
        </div>
        <div className="flex gap-2 text-xs text-yellow-500">
          <TriangleAlert className="size-4 shrink-0" />
          <span>Giữ bí mật số tài khoản như mật khẩu. Đừng chia sẻ nó công khai.</span>
        </div>
        <DialogFooter>
          <div className="flex w-full flex-col gap-2">
            {passkeysSupported && (
              <Button type="button" variant="outline" disabled={adding || added} onClick={addPasskey}>
                {adding ? <LoaderCircle className="animate-spin" /> : <KeyRound data-icon="inline-start" />}
                {added ? "Đã thêm passkey" : "Thêm passkey để đăng nhập nhanh"}
              </Button>
            )}
            <Button type="button" onClick={onClose}>
              Tôi đã lưu
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function BalanceRow({ asset, available, locked, format }: {
  asset: string
  available?: number
  locked?: number
  format: (v: number) => string
}) {
  return (
    <div className="grid grid-cols-[3rem_1fr_1fr] items-baseline gap-2 text-xs">
      <span className="font-medium">{asset}</span>
      <span className="text-right tabular-nums">
        {available === undefined ? <Skeleton className="ml-auto h-3 w-20" /> : format(available)}
      </span>
      <span className="text-right text-muted-foreground tabular-nums">
        {locked === undefined ? <Skeleton className="ml-auto h-3 w-12" /> : format(locked)}
      </span>
    </div>
  )
}

function SignedIn({ accountNumber }: { accountNumber: string }) {
  const queryClient = useQueryClient()
  const { data: account } = useAccount()
  const [shown, setShown] = useState(false)
  const [adding, setAdding] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  async function addPasskey() {
    setAdding(true)
    const { error } = await authClient.passkey.addPasskey({ name: "CeFi.vn" })
    setAdding(false)
    if (error) toast.error(authErrorMessage(error))
    else toast.success("Đã thêm passkey")
  }

  async function signOut() {
    setSigningOut(true)
    await authClient.signOut()
    queryClient.removeQueries({ queryKey: ["account"] })
    setSigningOut(false)
  }

  const b = account?.balances
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold">Tài khoản</h2>
        <div className="flex items-center">
          <span className="font-mono text-xs tracking-wide text-muted-foreground">
            {shown ? formatAccountInput(accountNumber) : maskAccountNumber(accountNumber)}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            aria-label={shown ? "Ẩn số tài khoản" : "Hiện số tài khoản"}
            className="text-muted-foreground hover:text-foreground"
            onClick={() => setShown((s) => !s)}
          >
            {shown ? <EyeOff /> : <Eye />}
          </Button>
          <CopyButton text={formatAccountInput(accountNumber)} label="Sao chép số tài khoản" />
        </div>
      </div>
      <div className="w-12 border-b-2 border-primary" />

      <div className="flex flex-col gap-1.5">
        <div className="grid grid-cols-[3rem_1fr_1fr] gap-2 text-[10px] text-muted-foreground">
          <span>Tài sản</span>
          <span className="text-right">Khả dụng</span>
          <span className="text-right">Đang khoá</span>
        </div>
        <BalanceRow asset="VND" available={b?.vnd.available} locked={b?.vnd.locked} format={formatVnd} />
        <BalanceRow asset="ETH" available={b?.eth.available} locked={b?.eth.locked} format={formatEth} />
      </div>

      <div className={cn("grid gap-2", passkeysSupported ? "grid-cols-2" : "grid-cols-1")}>
        {passkeysSupported && (
          <Button type="button" variant="outline" size="sm" disabled={adding} onClick={addPasskey}>
            {adding ? <LoaderCircle className="animate-spin" /> : <KeyRound data-icon="inline-start" />}
            Thêm passkey
          </Button>
        )}
        <Button type="button" variant="outline" size="sm" disabled={signingOut} onClick={signOut}>
          {signingOut ? <LoaderCircle className="animate-spin" /> : <LogOut data-icon="inline-start" />}
          Đăng xuất
        </Button>
      </div>
    </div>
  )
}

export function AccountPanel() {
  const { user, isPending } = useSession()
  const [created, setCreated] = useState<string | null>(null)
  const [tab, setTab] = useState("sign-in")

  let body: React.ReactNode
  if (isPending) {
    body = (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    )
  } else if (user) {
    body = <SignedIn accountNumber={(user as { username?: string }).username ?? user.name} />
  } else {
    body = (
      <Tabs value={tab} onValueChange={(v) => setTab(v as string)}>
        <TabsList variant="line" className="gap-4">
          <TabsTrigger value="sign-in" className="px-1 text-sm data-active:text-foreground after:bg-yellow-500!">
            Đăng nhập
          </TabsTrigger>
          <TabsTrigger value="create" className="px-1 text-sm data-active:text-foreground after:bg-yellow-500!">
            Mở tài khoản
          </TabsTrigger>
        </TabsList>
        <TabsContent value="sign-in" className="pt-2">
          <SignInForm />
        </TabsContent>
        <TabsContent value="create" className="pt-2">
          <CreateAccountForm
            onCreated={(n) => {
              setCreated(n)
              setTab("sign-in") // what they'll want after signing out
            }}
          />
        </TabsContent>
      </Tabs>
    )
  }

  return (
    <section className="border border-muted-foreground/10 p-3">
      {body}
      <NewAccountDialog accountNumber={created} onClose={() => setCreated(null)} />
    </section>
  )
}

export default AccountPanel
