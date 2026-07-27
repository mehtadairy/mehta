# Vercel Hobby Cron Migration Guide

This document explains the updates made to resolve Vercel Hobby plan limitations regarding sub-daily cron jobs, and guides the configuration of an external scheduler to trigger the application's cron API endpoints.

## 1. Context and Problem Statement
Vercel Hobby accounts are limited to daily cron schedules. Sub-daily cron jobs (such as running a job every 5 minutes, 15 minutes, or hourly) trigger a deployment failure with the error:
> `Hobby accounts are limited to daily cron jobs. This cron expression would run more than once per day.`

To ensure successful deployments without sacrificing application features, we have refactored the scheduler architecture.

---

## 2. Removed Cron Jobs from `vercel.json`
The following cron schedules were removed from [vercel.json](file:///p:/mehta1/vercel.json) to comply with Vercel Hobby limits:

| Endpoint Path | Purpose | Original Vercel Schedule | Recommended External Schedule |
| :--- | :--- | :--- | :--- |
| `/api/cron/payment-recovery` | Recovers failed online payments | `*/5 * * * *` (Every 5 mins) | **Every 5 minutes** |
| `/api/cron/retry-whatsapp` | Retries failed WhatsApp notifications | `*/5 * * * *` (Every 5 mins) | **Every 5 minutes** |
| `/api/cron/abandoned-cart` | Sends WhatsApp abandoned cart reminders | `*/15 * * * *` (Every 15 mins) | **Every 15 minutes** |
| `/api/cron/feedback` | Requests feedback 2 hours post-delivery | `0 * * * *` (Hourly) | **Every 30 minutes** or **Hourly** |

*Note: The daily cron jobs `/api/cron/reorder` (runs once daily at 10:00 AM) and `/api/cron/birthday` (runs once daily at 9:00 AM) remain in `vercel.json` as they are fully supported on Vercel Hobby.*

---

## 3. Security and Authentication Abstraction
All cron endpoints are secured using a Bearer Token model verified in the centralized Next.js NextRequest middleware:

* **Centralized Gatekeeper**: [middleware.ts](file:///p:/mehta1/src/middleware.ts#L78-L86) intercepts all requests matching `/api/cron/*`.
* **Required Variable**: The server checks for the environment variable `CRON_SECRET` (configured in Vercel and your external scheduler).
* **Required Header**: Rejects unauthorized requests with a `401 Unauthorized` response unless they supply:
  ```http
  Authorization: Bearer <your_cron_secret>
  ```
* **Vercel Compatability**: Vercel Cron automatically appends the `Authorization: Bearer <CRON_SECRET>` header, so the remaining daily Vercel crons function seamlessly.

---

## 4. Idempotency (Safe Execution)
To prevent duplicate messages/triggers when external schedulers execute the endpoints multiple times, all cron endpoints are designed to be **idempotent**:

* **Payment Recovery**: Processes only rows in the `payment_recovery` table with `status = 'pending'`. Once successfully completed, the row is updated to `status = 'recovered'` and will not be re-processed.
* **Retry WhatsApp**: Selects logs with `status = 'failed'` and increments the retry count. It updates the processed log status to `retried`, preventing duplicate triggers.
* **Abandoned Cart**: Targets carts with status `'abandoned'` within a specific window and marks them as `'reminded'` immediately upon notification dispatch.
* **Feedback Requests**: Queries the database to verify if a `feedback_request` notification has already been sent to the customer's phone number within [feedback/route.ts](file:///p:/mehta1/src/app/api/cron/feedback/route.ts#L29-L44).
* **Reorder Reminders**: Verifies against `notification_logs` to ensure no `reorder_reminder` was previously dispatched for the order items.
* **Birthday Wishes**: Checks `notification_logs` to guarantee that `birthday_wishes` are sent to a customer at most once per calendar day.
