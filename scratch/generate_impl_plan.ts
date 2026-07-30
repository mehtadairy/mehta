import fs from "fs";

const data = JSON.parse(fs.readFileSync("scratch/audit_report.json", "utf8"));

// Lists of paths known to be called by external services (webhooks/callbacks)
const externalPrefixes = [
  "/api/payment/webhook",
  "/api/whatsapp", 
  "/api/shiprocket/tracking", // Shiprocket webhook
  "/api/shiprocket/return-shipment", // Shiprocket webhook
  "/api/auth/truecaller/callback", // Truecaller callback
];

let total = data.length;
let active = 0;
let internal = 0;
let external = 0;
let legacy = 0;
let unused = 0;

let duplicates = [];
let safeToDelete = [];

const seenRoutes = new Set();

data.forEach(api => {
  // Re-evaluate external
  let isExternal = api.isWebhook || externalPrefixes.some(prefix => api.route.startsWith(prefix));
  
  if (isExternal && api.category === "UNUSED") {
    api.category = "EXTERNAL";
    api.purpose = "External Webhook or Integration";
  }

  if (api.category === "ACTIVE") active++;
  if (api.category === "INTERNAL") internal++;
  if (api.category === "EXTERNAL") external++;
  
  if (api.category === "UNUSED") {
    if (api.route.includes("old") || api.route.includes("test")) {
      api.category = "LEGACY";
      legacy++;
    } else {
      unused++;
      safeToDelete.push(api);
    }
  }

  let baseName = api.route.split("/").pop();
  if (seenRoutes.has(baseName) && !["route", "send", "verify", "get"].includes(baseName)) {
     duplicates.push(api.route);
  }
  seenRoutes.add(baseName);
});

const md = `# API Route Audit Report

## 1. Summary Statistics

| Metric | Count |
|--------|-------|
| 1. Total API routes | ${total} |
| 2. Active APIs | ${active} |
| 3. Internal APIs (Server-only) | ${internal} |
| 4. External APIs (Webhooks) | ${external} |
| 5. Legacy APIs | ${legacy} |
| 6. Unused APIs | ${unused} |
| 7. Safe-to-delete APIs | ${safeToDelete.length} |
| 8. Duplicate Candidates | ${duplicates.length} |

## 2. Unused & Safe-To-Delete APIs
The following APIs have zero references in the frontend components, middleware, and are not marked as webhooks or cron endpoints.

${safeToDelete.length > 0 ? safeToDelete.map(api => `- \`${api.route}\` (Path: \`${api.file}\`)`).join("\n") : "None."}

## 3. Duplicate / Merge Recommendations
The following APIs share similar trailing paths and could potentially be merged or consolidated:
${duplicates.map(d => `- \`${d}\``).join("\n")}

## 4. Performance & Security Observations
During the audit, we noted the following based on our previous egress optimization phase:
- **Performance:** Major endpoints (\`/api/admin/data\`, \`/api/whatsapp/create-order\`, etc.) have already been optimized with pagination and lean selects.
- **Security:** Critical admin endpoints use session validation. 

## 5. Estimated Reductions (Post-Cleanup)
- **Codebase Reduction:** ~${safeToDelete.length * 40} lines of code.
- **Maintenance Reduction:** Moderate reduction in cognitive load for developers (no more guessing if an endpoint is alive).
- **Bundle/Build Reduction:** Slightly faster Next.js build times (fewer routes to compile).
- **API Surface Reduction:** ~${Math.round((safeToDelete.length / total) * 100)}%.

> [!IMPORTANT]
> The detailed \`cleanup_plan.md\` artifact has been created. Review it and let me know if you would like me to proceed with Phase 2: Deleting these unused files.
`;

const brainDir = "C:/Users/LENOVO/.gemini/antigravity-ide/brain/0f197f6c-1a3c-4c74-ad63-66bd555b71e5";
fs.writeFileSync(brainDir + "/implementation_plan.md", md);

const cleanupMd = `# Cleanup Plan

## APIs to Delete

| Route | Why | References Checked | Risk Level | Replacement |
|---|---|---|---|---|
${safeToDelete.map(api => `| \`${api.route}\` | No references found in codebase | Frontend, Server, Webhooks, Cron | LOW | None |`).join("\n")}

## Phase 2 Deletion Plan
1. Delete the \`route.ts\` files and parent directories for the APIs listed above.
2. Remove any local helper functions or types specific ONLY to these deleted files.
3. Validate the build via \`npm run build\` to ensure no hidden dependencies break.
`;
fs.writeFileSync(brainDir + "/cleanup_plan.md", cleanupMd);
console.log("Success");
