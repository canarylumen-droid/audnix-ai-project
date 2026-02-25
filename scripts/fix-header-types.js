import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const routesDir = path.join(__dirname, '../server/routes');

// Find all TypeScript route files
const files = fs.readdirSync(routesDir)
  .filter(f => f.endsWith('.ts') && !f.includes('.test.'))
  .map(f => path.join(routesDir, f));

console.log(`[v0] Found ${files.length} route files to check`);

let fixedCount = 0;
let filesModified = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8');
  let originalContent = content;

  // Add header utility function if it doesn't exist
  if (!content.includes('function getHeaderValue')) {
    // Find the first function or router definition
    const match = content.match(/^(import[\s\S]*?)\n\n(const router|function|export)/m);
    if (match) {
      const insertPoint = match[0].lastIndexOf('\n');
      const headerUtil = `\n// Utility to safely extract header value as string\nfunction getHeaderValue(value) {\n  if (Array.isArray(value)) return value[0] || '';\n  return value || '';\n}\n`;
      content = content.slice(0, insertPoint) + headerUtil + content.slice(insertPoint);
      fixedCount++;
    }
  }

  // Replace header() calls with getHeaderValue wrapper
  const headerPattern = /(\w+)\.header\('([^']+)'\)/g;
  content = content.replace(headerPattern, (match, obj, headerName) => {
    fixedCount++;
    return `getHeaderValue(${obj}.get('${headerName}'))`;
  });

  // Replace req.headers[] with getHeaderValue wrapper
  const headersPattern = /(\w+)\.headers\['([^\]]+)'\]/g;
  content = content.replace(headersPattern, (match, obj, headerName) => {
    fixedCount++;
    return `getHeaderValue(${obj}.get('${headerName}'))`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    filesModified++;
    console.log(`[v0] Fixed ${file}`);
  }
}

console.log(`[v0] Fixed ${fixedCount} header references in ${filesModified} files`);
process.exit(0);
