"use server";

import { headers } from "next/headers";

async function getBaseUrl() {
  const headersList = await headers();
  const host = headersList.get("host") || "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function fetchPendingOrderAction() {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/print/pending`, {
    headers: {
      "x-print-agent-key": process.env.PRINT_AGENT_API_KEY || "",
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}

export async function markOrderPrintedAction(orderId: string, jobId?: string) {
  const baseUrl = await getBaseUrl();
  const res = await fetch(`${baseUrl}/api/print/completed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-print-agent-key": process.env.PRINT_AGENT_API_KEY || "",
    },
    body: JSON.stringify({
      orderId,
      jobId,
      printerName: "Magic POS Kiosk",
      printedBy: "Auto Print Station",
    }),
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  return res.json();
}
