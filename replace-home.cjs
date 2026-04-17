const fs = require('fs');
const file = 'client/src/pages/dashboard/home.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getActivePlanId')) {
  content = content.replace('import { getPlanCapabilities } from "@shared/plan-utils";', 'import { getPlanCapabilities, getActivePlanId } from "@shared/plan-utils";');
}

content = content.replace("(userData?.subscriptionTier || (userData as any)?.plan || 'starter').toLowerCase()", "getActivePlanId(userData)");

fs.writeFileSync(file, content);
console.log('Replaced home.tsx successfully');
