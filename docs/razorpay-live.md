# VC MART Razorpay checkout

The COD callable remains `createCodCheckout`. Online checkout uses separate
`createRazorpayCheckout`, `verifyRazorpayPayment`,
`markRazorpayCheckoutFailed`, and `razorpayPaymentWebhook` Functions.
The Functions calculate INR totals from Firestore products, the coupon, and
the current delivery rule. The browser does not submit an amount. A pending
Firestore order is created before Razorpay Standard Checkout opens.

Only a valid checkout signature **and** a Razorpay API response with matching
order ID, captured status, INR currency, and exact paise amount can mark the
order paid. The webhook verifies its HMAC over the raw request body and runs
the same captured-payment finalizer. The Firestore transaction makes duplicate
callbacks idempotent and adjusts inventory and coupon counts once. If stock
becomes unavailable between payment start and capture, the order is recorded
as paid with `fulfillmentReview: true` for manual fulfillment or refund;
stock is never reduced below zero. No Firestore rule changes are required.

## Configure without putting credentials in source

From the repository root, select the intended Firebase project, then enter
the values interactively. Do not place values in Git, chat, frontend `.env`,
or deployment command arguments:

```sh
firebase functions:secrets:set RAZORPAY_KEY_ID
firebase functions:secrets:set RAZORPAY_KEY_SECRET
firebase functions:secrets:set RAZORPAY_WEBHOOK_SECRET
```

Production Functions accept only a `rzp_live_` Key ID. The Key ID is sent to
Standard Checkout; the API secret and webhook secret never leave Functions.
For local Firebase emulators only, test keys are accepted. Node 20's built-in
`fetch` and `crypto` plus Razorpay's official `checkout.js` are used, so
there is no Razorpay npm dependency to install.

## Razorpay Dashboard

1. Activate the account for Live Mode and generate a Live Key ID and Secret.
2. Set payment capture to **automatic**. VC MART marks an order paid only
   after Razorpay reports `captured`.
3. Register `https://vcmart.shop/` as the website/domain for checkout.
4. Create a Live webhook for `payment.captured` at
   `https://asia-south1-PROJECT_ID.cloudfunctions.net/razorpayPaymentWebhook`.
   Set the Dashboard webhook secret to the same value saved as
   `RAZORPAY_WEBHOOK_SECRET` in Secret Manager.
5. Enable the desired UPI/card/netbanking methods for the account.

## Build and release

```sh
cd functions
npm install
npm test
cd ..
npm run build
firebase deploy --only functions:createRazorpayCheckout,functions:verifyRazorpayPayment,functions:markRazorpayCheckoutFailed,functions:razorpayPaymentWebhook
firebase deploy --only functions:updateOrderStatus
firebase deploy --only hosting
```

The final two commands release the online-order status guard and checkout UI.
Deploy the Functions before hosting. These are instructions only; this
implementation does not deploy anything.

## Local/test payment

Use a disposable Firebase emulator project and Razorpay **Test Mode** keys.
Put test secret values in `functions/.secret.local` (Git-ignored), using the
three secret names above. Set `VITE_USE_FIREBASE_EMULATORS=true` in local
`.env.local` along with the disposable Firebase web configuration. Start
`firebase emulators:start --only auth,firestore,functions`, seed at least
one active product and a customer account, then run `npm run dev`.
Checkout uses the Auth emulator on 9099, Firestore on 8080 and Functions on
5001. Complete a Razorpay Test Mode payment; inspect the Firestore emulator
order for `paymentStatus: "paid"`, `orderStatus: "pending"`, correct amount
and shipping, and one stock reduction. Try cancel and failure paths as well.
The webhook requires a public test endpoint to receive provider calls, while
the signed checkout callback can be tested locally.

Before a Live payment, verify Function invocation permissions, Dashboard
auto-capture, the webhook delivery, and a small authorized live transaction.
Captured payments with insufficient stock require an admin fulfillment/refund
decision. Unpaid online attempts remain in Firestore for audit.
