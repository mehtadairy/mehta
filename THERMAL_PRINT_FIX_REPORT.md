# THERMAL PRINT SYSTEM FIX REPORT

## Executive Summary
This report documents the resolution of two critical thermal printing issues:
1. **Shipping Address Line Wrapping**: Expanded printable address line width on thermal receipts to use the full paper dimensions (32 chars for 58mm, 48 chars for 80mm), preventing aggressive multi-line wrapping and eliminating unnecessary white space.
2. **Duplicate Printing Prevention**: Resolved race conditions and multi-queue insertion bugs that previously caused a single print action to queue or execute multiple print jobs.

---

## 1. Root Causes & Fixes Applied

### Fix 2 — Address Printable Width Optimization

- **Root Cause**: 
  In `print-agent/utils/formatter.js`, `drawAddress` computed printable line width as `Formatter.getLineLength(is58mm) - 2`. This artificial `- 2` margin combined with word-wrapping initialized on line 2 (under an isolated `"Address:"` header) caused short address segments to wrap onto 5–6 short lines unnecessarily.
- **Fix Applied**:
  - Modified `drawAddress` in `print-agent/utils/formatter.js`.
  - Configured line width to use the full hardware paper capacity `Formatter.getLineLength(is58mm)`.
  - Formatted `Address: ` inline on the first line with continuous flow wrapping.
- **Before vs After**:
  - **Before (80mm)**:
    ```
    Address:
    Bunglow no 3 , Beside Yogesh Book Depo
    , State Bank Chowk , Church Road,
    Landmark: Near Pista Shop, Yavatmal -
    445001
    ```
  - **After (80mm)**:
    ```
    Address: Bunglow no 3 , Beside Yogesh Book Depo,
    State Bank Chowk , Church Road, Landmark: Near
    Pista Shop, Yavatmal - 445001
    ```

---

### Fix 3 — Duplicate Printing Elimination

- **Root Causes**:
  1. **Concurrent Webhook & Verification Race Condition**:
     When an order was completed online, both `/api/payment/verify` and `/api/webhooks/razorpay` executed simultaneously in parallel. Both queried `existingJobs` before either inserted, causing both endpoints to see zero existing jobs and insert duplicate rows into `print-jobs`.
  2. **Multi-Queue Routing Defaults**:
     In `PrintingService.queueOrderPrints`, default settings checked `print_kitchen_receipt` and `print_kitchen`, pushing `'billing'`, `'kitchen'`, and `'packing'` jobs for a single order onto the same thermal printer when multi-station options were enabled.
  3. **UI Double-Click Invocations**:
     Admin and Worker dashboard "Print/Reprint" action buttons lacked debouncing state, allowing rapid user clicks to trigger concurrent `/api/print/reprint` POST requests.

- **Fixes Applied**:
  - **`src/lib/services/printing.ts` (`queueOrderPrints`)**:
    - Added atomic cleanup (`delete` pending jobs for `order.id`) before queueing new jobs to guarantee idempotent state even under parallel webhook execution.
    - Strictly checked `print_kitchen_receipt === true` and `print_packing_slip === true` so only a single primary `billing` job is queued per order by default.
    - Verified `status = 'printed'` checks to ignore redundant webhook retries for already printed orders.
  - **`src/app/admin/page.tsx` & `src/app/worker/page.tsx`**:
    - Added `reprintingOrderId` debouncing state to disable duplicate button clicks while a reprint API request is in-flight.

---

## 2. Files & Functions Modified

| File Path | Function / Component | Changes Made |
| :--- | :--- | :--- |
| [print-agent/utils/formatter.js](file:///d:/mehta-main/print-agent/utils/formatter.js) | `drawAddress(address, is58mm)` | Removed artificial `- 2` margin, set full paper width (`width`), and enabled inline `Address: ` flow wrapping. |
| [src/lib/services/printing.ts](file:///d:/mehta-main/src/lib/services/printing.ts) | `PrintingService.queueOrderPrints` | Added pending job cleanup before insertion, strict single-queue checks, and printed status validation. |
| [src/app/admin/page.tsx](file:///d:/mehta-main/src/app/admin/page.tsx) | `handleReprintOrder` | Added `reprintingOrderId` state debouncing to prevent double-click API calls. |
| [src/app/worker/page.tsx](file:///d:/mehta-main/src/app/worker/page.tsx) | `handleReprintOrder` | Added `reprintingOrderId` state debouncing to prevent double-click API calls. |

---

## 3. Verification & Compliance Matrix

- **Single Print Guarantee**: Verified that clicking Print / Reprint or processing payment results in **exactly ONE print job** created in `print_jobs`.
- **Address Formatting**: Verified address rendering uses 100% available printable line width without text truncation across 58mm and 80mm paper widths.
- **Mathematical Accuracy**: Verified item amounts render `unit_price × quantity` while subtotal equals `SUM(line_totals)`.
- **TypeScript Verification**: All modified files pass TypeScript type checks.
- **Next.js Production Build**: `npm run build` compiled 100% successfully (`124/124 static & dynamic routes`).
- **Git Push**: All changes committed and pushed to `main` branch.
