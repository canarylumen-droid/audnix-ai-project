import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to safely get string from string | string[]
const typeGuardHelper = `
// Type guard for Express params/query which can be string | string[]
const ensureString = (val) => Array.isArray(val) ? val[0] : val;
`;

const routesDir = path.join(__dirname, '../server/routes');
const filesToFix = [
  'ai-routes.ts',
  'calendar-routes.ts',
  'deals-routes.ts',
  'integrations-routes.ts',
  'messages-routes.ts',
  'notification-routes.ts',
  'objections-routes.ts',
  'organization-routes.ts',
  'payment-approval.ts',
  'prospecting.ts',
  'user-auth.ts',
  'video-automation-routes.ts',
  'voice-routes.ts',
  'worker.ts',
  'automation-rules-routes.ts',
  'outreach.ts'
];

let fixedCount = 0;

for (const fileName of filesToFix) {
  const filePath = path.join(routesDir, fileName);
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf-8');
  const originalContent = content;

  // Add type guard helper if not present
  if (!content.includes('ensureString') && !content.includes('getHeaderValue')) {
    // Find imports section
    const importEnd = content.lastIndexOf('import ');
    if (importEnd !== -1) {
      const nextNewline = content.indexOf('\n', importEnd);
      content = content.slice(0, nextNewline + 1) + typeGuardHelper + '\n' + content.slice(nextNewline + 1);
      fixedCount++;
    }
  }

  // Replace problematic patterns with type assertions
  // Pattern 1: const { paramName } = req.params; where paramName is string | string[]
  content = content.replace(
    /const\s+{\s*(\w+)\s*}\s*=\s*req\.params/g,
    (match, paramName) => {
      fixedCount++;
      return `const { ${paramName}: _${paramName} } = req.params; const ${paramName} = ensureString(_${paramName})`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`[v0] Fixed ${fileName}`);
  }
}

console.log(`[v0] Fixed ${fixedCount} type issues`);
process.exit(0);
