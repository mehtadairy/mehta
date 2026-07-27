# External Cron Setup Guide

This guide shows how to configure different external scheduling services to trigger the sub-daily API endpoints on your deployed Next.js application securely.

All requests must contain the `Authorization: Bearer <CRON_SECRET>` header, where `<CRON_SECRET>` matches the environment variable configured in your Vercel project settings.

---

## 1. cron-job.org (Recommended - Free & Easy)
[cron-job.org](https://cron-job.org/) is a free service that allows you to trigger HTTP endpoints at granular intervals.

### How to Configure:
1. Sign up/Log in to [cron-job.org](https://cron-job.org/).
2. Navigate to the **Cronjobs** tab and click **Create Cronjob**.
3. Fill in the configuration:
   * **Title**: `Mehta Sweet Mart - Payment Recovery`
   * **Address**: `https://your-vercel-domain.vercel.app/api/cron/payment-recovery` (Replace with your actual Vercel domain)
   * **Schedule**: Under **Execution interval**, select **Every 5 minutes**.
4. Go to **Advanced** ➜ **Request headers** and add:
   * **Key**: `Authorization`
   * **Value**: `Bearer <YOUR_CRON_SECRET>` (Replace with your actual `CRON_SECRET` value)
5. Click **Create**.
6. Repeat the process for:
   * `/api/cron/retry-whatsapp` (Every 5 minutes)
   * `/api/cron/abandoned-cart` (Every 15 minutes)
   * `/api/cron/feedback` (Every 30 minutes)

---

## 2. GitHub Actions (Free - Built-in)
You can use GitHub Actions to run a workflow on a schedule that calls your endpoints using `curl`.

### How to Configure:
Create a file named `.github/workflows/cron-scheduler.yml` in your repository:

```yaml
name: External Cron Scheduler

on:
  schedule:
    # Run every 5 minutes
    - cron: '*/5 * * * *'

jobs:
  trigger_endpoints:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Payment Recovery
        run: |
          curl -X GET "https://your-vercel-domain.vercel.app/api/cron/payment-recovery" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
            
      - name: Trigger WhatsApp Retry Queue
        run: |
          curl -X GET "https://your-vercel-domain.vercel.app/api/cron/retry-whatsapp" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"

      # Triggered only on specific minutes to match 15-minute / hourly intervals
      - name: Trigger Abandoned Cart (Every 15m)
        if: github.event.schedule == '*/15 * * * *' || github.run_number % 3 == 0
        run: |
          curl -X GET "https://your-vercel-domain.vercel.app/api/cron/abandoned-cart" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

> ⚠️ **Note**: Go to your GitHub Repository Settings ➜ **Secrets and variables** ➜ **Actions** and add a secret named `CRON_SECRET` with your secret value.

---

## 3. Better Stack (Premium / Free Tier Monitoring)
Better Stack can run scheduled heartbeat calls that double as secure API pings.

### How to Configure:
1. Log in to [Better Stack](https://betterstack.com/).
2. Navigate to **Uptime** ➜ **Monitors** ➜ **Create Monitor**.
3. Set the fields:
   * **Alert us when URL**: `https://your-vercel-domain.vercel.app/api/cron/payment-recovery`
   * **Check frequency**: `5 minutes`
4. Under **Advanced settings**:
   * Click **Add request headers**.
   * Add Header: `Authorization: Bearer <YOUR_CRON_SECRET>`
5. Click **Create monitor**.

---

## 4. UptimeRobot (Free HTTP Pings)
UptimeRobot's custom port/header features allow it to trigger authenticated endpoints as monitor pings.

### How to Configure:
1. Log in to [UptimeRobot](https://uptimerobot.com/).
2. Click **Add New Monitor**.
3. Configure the monitor details:
   * **Monitor Type**: `HTTP(s)`
   * **Friendly Name**: `Payment Recovery Cron`
   * **URL (or IP)**: `https://your-vercel-domain.vercel.app/api/cron/payment-recovery`
   * **Monitoring Interval**: `5 minutes`
4. Click **Advanced settings** ➜ **Custom HTTP Headers**:
   * **Header**: `Authorization`
   * **Value**: `Bearer <YOUR_CRON_SECRET>`
5. Click **Create Monitor**.
