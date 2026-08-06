const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const apiDir = path.join(rootDir, 'src', 'app', 'api');

function getRouteFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getRouteFiles(fullPath));
    } else if (file === 'route.ts' || file === 'route.js') {
      results.push(fullPath);
    }
  });
  return results;
}

const routeFiles = getRouteFiles(apiDir);

function getAllFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    if (file === 'node_modules' || file === '.git' || file === '.next') return;
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else {
      fileList.push(filePath);
    }
  });
  return fileList;
}

const allProjectFiles = getAllFiles(rootDir);

const report = [];

routeFiles.forEach(routeFile => {
  const relativeRoute = path.relative(path.join(rootDir, 'src', 'app'), path.dirname(routeFile)).replace(/\\/g, '/');
  const endpoint = '/' + relativeRoute; // e.g. /api/admin/data

  // Search across all files excluding the routeFile itself
  const references = [];
  allProjectFiles.forEach(file => {
    if (file === routeFile) return;
    try {
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes(endpoint) || content.includes(relativeRoute)) {
        const relPath = path.relative(rootDir, file).replace(/\\/g, '/');
        references.push(relPath);
      }
    } catch (e) {}
  });

  report.push({
    endpoint,
    routeFile: path.relative(rootDir, routeFile).replace(/\\/g, '/'),
    refCount: references.length,
    references
  });
});

console.log(JSON.stringify(report, null, 2));
