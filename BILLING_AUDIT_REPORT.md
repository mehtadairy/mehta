# BILLING AUDIT & LINE ITEM PRICING FIX REPORT

## Executive Summary
A critical billing representation issue was identified in thermal receipts, order emails, admin order cards, and reorder summaries where line items with quantity > 1 displayed the single unit price in the **AMT (Amount)** column instead of the **Line Total** (`unit_price × quantity`).

While database orders, Razorpay/COD checkout totals, and PDF invoices correctly calculated the mathematical subtotal (`SUM(unit_price × quantity)`), thermal receipt formatting passed `item.price` as the column value, leading to visual mismatches such as:
- **Before**: `Banana Chevdo  1kg × 3  ₹440.00`
- **After**: `Banana Chevdo  1kg × 3  ₹1320.00`

---

## 1. Root Cause Analysis
1. **Thermal Receipt Generator (`print-agent/receipts/items.js`)**:
   When looping over `payload.items`, `Formatter.drawTableRow(item.name, item.qty, item.price, is58mm, item.weight)` was invoked passing `item.price` (unit price ₹440) directly into the third parameter (`amt`). As a result, the receipt printed the unit price in the `AMT` column while printing the overall order subtotal (`₹2120`), creating a visual discrepancy on physical printouts.
2. **Printing Service Payload (`src/lib/services/printing.ts`)**:
   The printer queue payload mapped items with `price: i.price` without explicitly calculating `line_total: i.price * i.quantity`.
3. **Order Notification Emails (`src/emails/OrderConfirmationEmail.tsx` & `AdminOrderNotificationEmail.tsx`)**:
   Email item rows rendered `₹{item.price}` instead of `₹{item.price * item.quantity}`.
4. **Admin Cards & Reorder Views (`OrderCard.tsx`, `WAOrderCard.tsx`, `reorder/page.tsx`)**:
   Item breakdowns printed `₹{item.price} × {item.quantity}` without rendering the resulting line total `₹{item.price * item.quantity}`.

---

## 2. Audit Scope & Verification Matrix

| Component / Layer | Unit Price Saved | Quantity Saved | Line Total Math | Subtotal Math | Audit Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Database (`order_items`)** | `price` | `quantity` | Verified (`price * qty`) | `SUM(line_total)` | PASS |
| **Razorpay / COD Checkout** | `unit_price` | `quantity` | Verified | `serverSubtotal` | PASS |
| **PDF Invoice Generator (`invoices.ts`)** | `item.price` | `item.qty` | `item.price * item.qty` | `SUM(line_total)` | PASS |
| **Web Invoice (`/invoice/[invoiceNumber]`)** | `item.price` | `item.qty` | `item.price * item.qty` | `SUM(line_total)` | PASS |
| **Thermal Receipt (`print-agent`)** | `item.price` | `item.qty` | **FIXED** (`lineTotal`) | Subtotal (`₹2120`) | PASS |
| **Order Confirmation Email** | `item.price` | `item.qty` | **FIXED** (`price * qty`) | Subtotal | PASS |
| **Admin Notification Email** | `item.price` | `item.qty` | **FIXED** (`price * qty`) | Subtotal | PASS |
| **Admin Order Cards** | `item.price` | `item.qty` | **FIXED** (`₹price × qty = ₹total`) | Grand Total | PASS |
| **Customer Reorder Page** | `item.price` | `item.qty` | **FIXED** (`price * qty`) | Grand Total | PASS |
| **WhatsApp Order Service** | `item.price` | `item.quantity` | `item.price * qty` | `SUM(line_total)` | PASS |

---

## 3. Files & Functions Modified

### 1. `print-agent/receipts/items.js`
- **Function**: `render(printer, payload, is58mm)`
- **Change**: Computed `lineTotal = item.line_total ?? (Number(item.price) * qty)` and passed `lineTotal` into `Formatter.drawTableRow(...)`.

### 2. `src/lib/services/printing.ts`
- **Function**: `queueOrderPrints(order, branchId, isReprint)` & Cancellation Slip Formatter
- **Change**: Added explicit `line_total: (Number(i.price) || 0) * (Number(i.quantity || i.qty) || 1)` to formatted item payloads.

### 3. `src/emails/OrderConfirmationEmail.tsx`
- **Component**: `OrderConfirmationEmail`
- **Change**: Updated price column from `₹{item.price}` to `₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}`.

### 4. `src/emails/AdminOrderNotificationEmail.tsx`
- **Component**: `AdminOrderNotificationEmail`
- **Change**: Updated price column from `₹{item.price}` to `₹{(Number(item.price) || 0) * (Number(item.quantity) || 1)}`.

### 5. `src/components/admin/OrderCard.tsx` & `WAOrderCard.tsx`
- **Components**: `OrderCard`, `WAOrderCard`
- **Change**: Updated price breakdown to display `₹{item.price} × {item.quantity} = ₹{item.price * item.quantity}`.

### 6. `src/app/reorder/page.tsx`
- **Component**: `ReorderPage`
- **Change**: Updated item cards to render line totals `₹{item.price * item.quantity}`.

---

## 4. Calculations: Before vs. After

### Example Scenario:
- **Item**: Banana Chevdo (1kg)
- **Unit Price**: ₹440.00
- **Quantity**: 3

| View / Document | Before Fix | After Fix | Math Standard |
| :--- | :--- | :--- | :--- |
| **Thermal Receipt AMT Column** | `Banana Chevdo  1kgx3  440.00` | `Banana Chevdo  1kgx3  1320.00` | `Line Total = 440 × 3` |
| **Receipt Subtotal** | `Rs. 2120.00` | `Rs. 2120.00` | `SUM(Line Totals)` |
| **Email Invoice Line Amount** | `₹440` | `₹1320` | `Line Total = 440 × 3` |
| **Admin Order Card Item Text** | `₹440 × 3` | `₹440 × 3 = ₹1320` | `Explicit Breakdown` |

---

## 5. Verification Results
- **TypeScript Verification**: All modified `.ts` and `.tsx` files pass strict type checking without errors.
- **Next.js Production Build**: `npm run build` compiled 100% cleanly (`124/124 static & dynamic routes`).
- **Git Push**: All fixes committed and pushed to `main` branch.
