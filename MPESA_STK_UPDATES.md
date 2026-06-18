# M-Pesa STK Push Payment Flow - Updates Complete

## ✅ Issues Fixed

1. **Till Number Spaces** → Fixed by user in PayHero dashboard (removed spaces from till number)
2. **STK Push Initiated Message** → Customer now sees "STK push initiated" message after clicking "Confirm Order"
3. **Payment Confirmation Wait** → Web app polls payment status every 2 seconds (5 min timeout)
4. **Business Name in M-Pesa Prompt** → Added `merchant_name: "NairobiMart"` to PayHero API payload
5. **Success Page Routing** → Only shows after payment confirmed via webhook

---

## 📝 Changes Made

### 1. **New Payment Status Endpoint**
**File**: `app/api/orders/[id]/payment-status/route.ts`

Allows frontend to check if payment has been confirmed:
```typescript
GET /api/orders/{orderId}/payment-status
```

Returns:
```json
{
  "success": true,
  "orderId": "...",
  "paymentStatus": "paid|pending",
  "isPaid": true|false
}
```

---

### 2. **Updated Checkout Page**
**File**: `app/(store)/checkout/page.tsx`

#### New State Variables:
- `showStkInitiated` - Shows/hides STK waiting modal
- `stkOrderId` - Tracks which order is awaiting payment
- `stkPollingSeconds` - Displays elapsed time to user

#### New Behavior:
1. When user clicks "Confirm Order" with M-Pesa payment method:
   - Order is created
   - STK push is initiated
   - Modal appears: "STK Push Initiated - A payment prompt has been sent to your phone"
   - Shows animated loading indicator
   - Displays elapsed time in seconds
   - Includes helpful tip about airplane mode/signal

2. Frontend polls `/api/orders/{orderId}/payment-status` every 2 seconds

3. When `isPaid` returns true:
   - Modal closes
   - Cart is cleared
   - Redirects to success page with order ID
   - Shows "Purchase Successful!" message

4. Timeout after 5 minutes:
   - Modal closes
   - Shows error: "Payment timeout. Please contact support..."
   - Customer can retry

5. User can click "Cancel & Go Back" to abandon payment attempt

---

### 3. **Updated PayHero API Payload**
**File**: `lib/payhero.ts`

#### Added Field:
```typescript
merchant_name: "NairobiMart"
```

This ensures the M-Pesa STK prompt shows:
- **Merchant**: NairobiMart (instead of previous name)
- **Amount**: KES {amount}
- **Prompt**: "Enter your M-Pesa PIN to confirm payment"

#### Updated Logging:
Payload logging now includes `merchant_name` for debugging.

---

## 🔄 Payment Flow Timeline

### Customer Perspective:
1. **Checkout Page** → Select M-Pesa Till payment → Click "Confirm Order"
2. **Order Created** → Backend creates order in DB with status `paymentStatus: "pending"`
3. **STK Initiated** → PayHero sends STK push to customer's phone
4. **Modal Appears** → Shows "STK Push Initiated - Confirm in your phone to enter M-Pesa PIN"
5. **Customer Enters PIN** → Completes payment on their phone
6. **Webhook Received** → PayHero sends callback to `/api/webhook/payhero`
7. **Order Updated** → Backend marks order as `paymentStatus: "paid"`
8. **Frontend Detects** → Polling endpoint returns `isPaid: true`
9. **Success Page** → Redirects to `/order-success?id={orderId}&payment=mpesa_till`
10. **Confirmation** → Shows "Purchase Successful! - Your order is being processed"

### Backend/PayHero Perspective:
- STK request includes: `merchant_name: "NairobiMart"`
- Callback from PayHero includes: `external_reference: orderId`, `mpesa_receipt_number`
- Webhook handler updates order with receipt number and payment status

---

## 🧪 Testing the Flow

### Local Testing (with .env.local):
```bash
# Set environment variables
PAYHERO_API_USERNAME=kRxhllmGz3ZcIufO7ocN
PAYHERO_API_PASSWORD=IMUAeJWklZXb10RzSCN9baPXh91dt3OcgttGBkvo
PAYHERO_ACCOUNT_ID=9897
PAYHERO_CHANNEL_ID=9371
PAYHERO_CALLBACK_URL=https://nairobimart-gwna.vercel.app/api/webhook/payhero

# Start dev server
npm run dev

# Test at http://localhost:3000/checkout
```

### Production Testing:
The app is already configured to work at: `https://nairobimart-gwna.vercel.app`

---

## 📊 What the Customer Now Sees

### Before Payment:
```
[Checkout Page]
Items: [List of products]
Delivery: [Address filled]
Payment Method: [M-Pesa Till selected]
[Confirm Order Button]
```

### After Clicking Confirm Order:
```
[Modal appears]
📱 STK Push Initiated

A payment prompt has been sent to your phone.
Enter your M-Pesa PIN to confirm the payment of KES 1,226

[Loading dots animation]
Waiting for payment confirmation...
(45s elapsed)

Tip: If you don't see the prompt, check that your phone is 
not in airplane mode and has enough signal.

[Cancel & Go Back]
```

### On Customer's Phone (M-Pesa STK):
```
┌─────────────────────┐
│ Lipa na M-Pesa STK  │
│                     │
│ Merchant: NairobiMart
│ Amount: KES 1,226   │
│                     │
│ Enter PIN: [****]   │
│                     │
│ [OK]  [Cancel]      │
└─────────────────────┘
```

### After Payment Success:
```
[Modal closes]
[Page redirects]

[Success Page]
✓ Purchase Successful!
Thank you for shopping with NairobiMart. 
Your order is being processed.

Paid via M-Pesa ✓

Order Information:
Order ID: 6a3437281d83fc33e6898e28

Confirmation Sent: Check your inbox for receipt
International Shipping: Delivery takes 15-30 business days

[Continue Shopping]  [Track Order]
```

---

## 🔐 Security Notes

- Order is created before payment (allows for layby/commitment later)
- Payment status check is atomic via database
- Callback from PayHero is the source of truth
- Webhook validates payment before updating order
- Frontend polling is just for UX, backend is authoritative

---

## 🐛 Troubleshooting

**Customer doesn't see STK prompt:**
- Check phone has signal
- Check not in airplane mode
- Check PayHero account has SMS/STK permissions enabled

**Stuck on "Waiting for payment confirmation":**
- Browser timeout after 5 minutes shows error message
- Customer can retry by clicking "Cancel & Go Back"
- Order remains in "pending" status until payment received

**Payment received but success page not showing:**
- Webhook may be delayed (usually < 5 seconds)
- Polling will continue to check for 5 minutes
- Manual refresh of page will check status

---

## 📱 Responsive Design

The STK initiated modal is:
- Mobile-optimized with large text
- Centered on screen with semi-transparent backdrop
- Touch-friendly "Cancel" button
- Visible loading animation

---

## ✨ User Experience Improvements

1. **Clear feedback** - "STK push initiated" removes ambiguity
2. **Real-time updates** - Automatic redirect on payment (no manual refresh)
3. **Timeout protection** - 5-minute limit prevents infinite waiting
4. **Helpful tips** - Guidance about airplane mode/signal
5. **Correct branding** - M-Pesa prompt shows "NairobiMart" not generic name
6. **Cart cleared** - Automatic cart clear on success prevents duplicate orders

---

## 🚀 Production Ready

- ✅ Code compiles without errors
- ✅ All environment variables configured
- ✅ Build completes successfully
- ✅ Vercel deployment compatible
- ✅ MongoDB integration working
- ✅ Webhook endpoint functional
- ✅ Payment polling implemented
- ✅ Success page routing correct

Ready to deploy to production!
