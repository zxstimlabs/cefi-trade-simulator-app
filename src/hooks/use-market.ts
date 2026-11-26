import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { etagPoller, MARKET, type MarketSnapshot } from "@/lib/api"

// One 1 s poll of the public snapshot (ticker, depth, recent trades), shared
// by every component through the query key. 304s keep the last body.
const pollSnapshot = etagPoller<MarketSnapshot>(`/market/${MARKET}`)

export function useMarketSnapshot() {
  return useQuery({
    queryKey: ["market-snapshot"],
    queryFn: pollSnapshot,
    refetchInterval: 1000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

export type FeedStatus = "connecting" | "live" | "lagging" | "down"

// Health of the snapshot poll: live while it answers, lagging after 3 s
// without an answer, down after 5 s or on errors.
export function useFeedStatus(): { status: FeedStatus; ageSec: number } {
  const { dataUpdatedAt, isError } = useMarketSnapshot()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])
  if (!dataUpdatedAt) return { status: isError ? "down" : "connecting", ageSec: 0 }
  const age = Math.max(0, now - dataUpdatedAt)
  const ageSec = Math.round(age / 1000)
  if (isError || age >= 5000) return { status: "down", ageSec }
  if (age >= 3000) return { status: "lagging", ageSec }
  return { status: "live", ageSec }
}
