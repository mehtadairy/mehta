import fs from "fs";
import path from "path";

// Recursively find files
function walkSync(dir: string, filelist: string[] = [], pattern?: RegExp) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walkSync(filepath, filelist, pattern);
      }
    } else {
      if (!pattern || pattern.test(file)) {
        filelist.push(filepath);
      }
    }
  }
  return filelist;
}

const apiRoutes = walkSync("src/app/api", [], /^route\.(ts|js)$/);
const allFiles = walkSync("src", [], /\.(ts|tsx|js|jsx)$/);

const results: any[] = [];

for (const routeFile of apiRoutes) {
  const dirPath = path.dirname(routeFile).replace(/\\/g, "/");
  const urlPath = "/" + dirPath.replace(/^src\/app\//, "");
  
  // Clean dynamic params for searching (e.g. /api/policy/[slug] -> /api/policy)
  const basePath = urlPath.replace(/\/\[.*?\]/g, "");

  const usages: string[] = [];
  let isWebhook = urlPath.includes("webhook");
  let isCron = urlPath.includes("cron");
  
  for (const file of allFiles) {
    if (file === routeFile) continue;
    const content = fs.readFileSync(file, "utf8");
    
    // Check if path is referenced
    if (content.includes(basePath)) {
        usages.push(file.replace(/\\/g, "/"));
    }
  }

  // Determine category
  let category = "UNUSED";
  let purpose = "Unknown";
  
  if (isWebhook) {
      category = "EXTERNAL";
      purpose = "Webhook handler";
  } else if (isCron) {
      category = "INTERNAL";
      purpose = "Cron job endpoint";
  } else if (usages.length > 0) {
      // Check if used by frontend components
      const usedByFrontend = usages.some(f => f.includes("components/") || f.includes("app/") && !f.includes("api/"));
      if (usedByFrontend) {
          category = "ACTIVE";
          purpose = "Frontend data/action endpoint";
      } else {
          category = "INTERNAL";
          purpose = "Server-to-server or internal integration";
      }
  } else {
      category = "UNUSED";
  }

  results.push({
    route: urlPath,
    file: routeFile,
    basePath,
    usagesCount: usages.length,
    usages,
    category,
    purpose,
    isWebhook,
    isCron
  });
}

fs.writeFileSync("scratch/audit_report.json", JSON.stringify(results, null, 2));
console.log(`Found ${results.length} API routes.`);
