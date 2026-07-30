import fs from "fs";
import path from "path";

const allFiles: string[] = [];

function walkSync(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    const stat = fs.statSync(filepath);
    if (stat.isDirectory()) {
      if (file !== "node_modules" && file !== ".next" && file !== ".git") {
        walkSync(filepath);
      }
    } else if (/route\.(ts|js)$/.test(file) && filepath.includes("src\\app\\api")) {
      allFiles.push(filepath);
    }
  }
}
walkSync("src/app/api");

const routes = allFiles.map(file => {
  const dirPath = path.dirname(file).replace(/\\/g, "/");
  return "/" + dirPath.replace(/^src\/app\//, "");
}).sort();

const md = `# All Current API Routes

We currently have **${routes.length}** API endpoints in the project:

${routes.map(r => `- \`${r}\``).join("\n")}
`;

const meta = {
  RequestFeedback: false,
  Summary: "Complete list of all API endpoints",
  UserFacing: true
};

const fileData = {
  ArtifactMetadata: meta,
  CodeContent: md,
  Description: "Listing all APIs",
  Overwrite: true,
  TargetFile: "C:/Users/LENOVO/.gemini/antigravity-ide/brain/0f197f6c-1a3c-4c74-ad63-66bd555b71e5/all_apis.md"
};

// I'll actually just write it straight using the write_to_file tool instead of a script to generate it, but since I already have this script open, I'll execute it.
fs.writeFileSync("C:/Users/LENOVO/.gemini/antigravity-ide/brain/0f197f6c-1a3c-4c74-ad63-66bd555b71e5/all_apis.md", md);
console.log("Done");
