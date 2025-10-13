Antom (Alipay Global AMS) Integration Setup

This project now includes a minimal Antom (Alipay Global AMS) payment flow for package/credit orders, with sandbox support.

Environment variables (.env.local)
- `ANTOM_GATEWAY_URL` — AMS base URL. Sandbox/prod host, default `https://open-na.alipay.com`.
- `ANTOM_CLIENT_ID` — Your AMS client-id. Use `SANDBOX_...` for sandbox.
- `ANTOM_MERCHANT_PRIVATE_KEY` — Your merchant private key (PEM or base64 body).
- `ANTOM_ALIPAY_PUBLIC_KEY` — AMS public key (PEM or base64 body) used to verify webhooks.
- `ANTOM_KEY_VERSION` — Key version in Signature header. Default `1`.
- `PUBLIC_BASE_URL` — Public base URL of your app (for AMS notify/redirect callbacks), e.g. `https://abc.ngrok.io`.
- Optional: `ANTOM_PAYMENT_METHOD` (default `ALIPAY_CN`), `ANTOM_SETTLEMENT_CURRENCY` (default equals order currency).

Server endpoints
- `POST /api/orders/pay/antom` — Creates an AMS payment and returns a `redirectUrl`.
- `POST /api/orders/pay/antom/notify` — AMS webhook for payment result. Verifies signature and completes the order.

Flow (Sandbox)
1) Create order
   - `POST /api/orders/create` with body `{ orderType: 'package', packageId: '<id>' }`.
   - Save `data.order.orderNo` from the response.
2) Create AMS payment
   - `POST /api/orders/pay/antom` with body `{ orderNo: '<orderNo>' }`.
   - Response includes `data.redirectUrl`; open it in browser to pay (sandbox).
3) Webhook
   - AMS sends `POST` to `PUBLIC_BASE_URL/api/orders/pay/antom/notify`.
   - App verifies signature and invokes internal order fulfillment.
4) Confirm
   - Check `/dashboard` or database to verify order status and package activation.

Notes
- If `ANTOM_CLIENT_ID` starts with `SANDBOX_`, requests go to `/ams/sandbox/...` paths automatically.
- Keys can be PEM (`-----BEGIN ... KEY-----`) or base64 body; both are accepted.
- Webhook signature verify requires `ANTOM_ALIPAY_PUBLIC_KEY`. Without it, verification fails (401).
- Ensure `PUBLIC_BASE_URL` is reachable from the internet (e.g. via tunneling) during sandbox testing.

JKOPay specifics
- JKOPay requires amount minor unit to end with `00` (integer major units). When invoking with `paymentMethodType='JKOPAY'`, the server converts order amount to TWD and rounds up to an integer to satisfy this rule.
- Configure an exchange rate via `ANTOM_USD_TWD_RATE` (e.g., `32.0`). If not set, the server uses a sensible default.
- For JKOPay, the route avoids forcing `settlementCurrency` to reduce contract mismatches.

Return vs Notify base URLs (local dev)
- To keep NextAuth session after redirect, separate user-app base from webhook base:
  - `PUBLIC_NOTIFY_URL` — Public webhook base (e.g., your ngrok URL). Used for `paymentNotifyUrl`.
  - `PUBLIC_APP_URL` — User app base (e.g., `http://localhost:3000`). Used for `paymentRedirectUrl`.
- If not set, notify uses `PUBLIC_BASE_URL` (or request origin), and return uses request referer/origin.
