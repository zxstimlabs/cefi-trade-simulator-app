import { useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { ApiError, etagPoller, type Account } from "@/lib/api"
import { authClient } from "@/lib/auth-client"

// One ETag poller per signed-in user, so switching accounts never reuses
// another account's ETag or body.
const pollers = new Map<string, () => Promise<Account>>()
function pollerFor(userId: string) {
  let p = pollers.get(userId)
  if (!p) {
    p = etagPoller<Account>("/me/account")
    pollers.set(userId, p)
  }
  return p
}

export function useSession() {
  const { data, isPending, refetch } = authClient.useSession()
  return { user: data?.user ?? null, isPending, refetch }
}

// The signed-in user's balances, orders and fills, polled every second (the
// bot fills resting orders at any time).
export function useAccount() {
  const { user, refetch } = useSession()
  const userId = user?.id
  const query = useQuery({
    queryKey: ["account", userId],
    queryFn: () => pollerFor(userId!)(),
    enabled: !!userId,
    refetchInterval: 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 1,
  })
  // The session ended server-side (expired, revoked): refresh it so the UI
  // shows the signed-out state.
  const unauthenticated = query.error instanceof ApiError && query.error.status === 401
  useEffect(() => {
    if (unauthenticated) void refetch()
  }, [unauthenticated, refetch])
  return query
}
