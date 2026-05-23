import { MainClient, WebsocketClient } from "binance"

let ws: WebsocketClient | null = null
let rest: MainClient | null = null

export function getWsClient() {
  if (ws) return ws
  ws = new WebsocketClient({ beautify: true })
  ws.on("exception", (err) => {
    console.error("[binance ws] exception", err)
  })
  return ws
}

export function getRestClient() {
  if (rest) return rest
  rest = new MainClient()
  return rest
}
