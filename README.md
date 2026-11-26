# CeFi.vn simulator (web app)

A simulated ETH/VND exchange: candlestick chart, account-number + PIN (or passkey) sign-in, limit and market orders, order and trade history. Everything comes from the CeFi API in [zxstim-api](https://github.com/zxstimlabs/zxstim-api) (its README's "CeFi API" and "Market routes" sections); the market is that API's order book, kept alive by its bot.

## Development

1. Run the CeFi API locally (Redis plus `CEFI_ENABLED=1 … bun run dev` in zxstim-api, see its README) with `CEFI_EXTRA_ORIGINS=http://localhost:5800`, so it accepts this app's origin.
2. `bun install && bun run dev`, then open http://localhost:5800.

`VITE_CEFI_API` sets the API's base URL (see `.env.example`). Without it, dev builds use `http://localhost:8002` and production builds `https://api.cefi.vn`. Cookies need the app and the API on the same site (www.cefi.vn / api.cefi.vn, or both on localhost).

## shadcn/ui

### Adding components

To add components to your app, run the following command:

```bash
npx shadcn@latest add button
```

This will place the ui components in the `src/components` directory.

### Using components

To use the components in your app, import them as follows:

```tsx
import { Button } from "@/components/ui/button"
```
