
import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/audit_report.json", "utf8"));

let total = data.length;
let active = 0;
let internal = 0;
let external = 0;
let legacy = 0;
let unused = 0;
let duplicates = [];
let safeToDelete = [];

// Basic duplicate detection by base path grouping or similar names
const seenRoutes = new Set();
const duplicateCandidates = [];

data.forEach(api => {
  if (api.category === "ACTIVE") active++;
  if (api.category === "INTERNAL") internal++;
  if (api.category === "EXTERNAL") external++;
  
  if (api.category === "UNUSED") {
    // Check if it looks like a legacy route
    if (api.route.includes("old") || api.route.includes("test")) {
      api.category = "LEGACY";
      legacy++;
    } else {
      unused++;
      safeToDelete.push(api);
    }
  }

  // Duplicate detection - simple fuzzy match or common substrings
  let baseName = api.route.split("/").pop();
  if (seenRoutes.has(baseName) && baseName !== "route" && baseName !== "send" && baseName !== "verify") {
     duplicateCandidates.push(api.route);
  }
  seenRoutes.add(baseName);
});

let md = `# UNUSED API DETECTION & CLEANUP REPORT

## Summary
- **Total API routes:** ${total}
- **Active APIs:** ${active}
- **Internal APIs:** ${internal}
- **External APIs:** ${external}
- **Legacy APIs:** ${legacy}
- **Unused APIs:** ${unused}
- **Safe-to-delete APIs:** ${safeToDelete.length}
- **Duplicate candidates:** ${duplicateCandidates.length}

## Estimated Impact
- Estimated reduction in codebase: ~${safeToDelete.length * 50} lines of dead code
- Estimated maintenance reduction: Moderate (removes confusion for developers)
- Estimated bundle reduction: Minimal (APIs are not bundled to client, but reduces server bundle size slightly)
- Estimated API surface reduction: ~${Math.round((safeToDelete.length / total) * 100)}%

## Safe To Delete APIs (Unused)
| Route | Reason | Risk Level |
|---|---|---|
${safeToDelete.map(api => `| \`${api.route}\` | No references found in codebase, not a webhook, not a cron | LOW |`).join("\n")}

## Phase 2 Plan (Deletion)
1. Double-check any external dependencies (e.g. mobile app or third-party webhooks) for the routes listed above.
2. Delete the folders for the safe-to-delete APIs.
3. Remove any unused utility functions that were exclusively imported by these routes.
`;

fs.writeFileSync("C:/Users/LENOVO/.gemini/antigravity-ide/brain/0f197f6c-1a3c-4c74-ad63-66bd555b71e5/cleanup_plan.md", md);
console.log("Report generated.");

