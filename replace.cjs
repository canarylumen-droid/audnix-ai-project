const fs = require('fs');
const file = 'client/src/pages/dashboard/integrations.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace('import { getPlanCapabilities } from "@shared/plan-utils";', 'import { getPlanCapabilities, getActivePlanId } from "@shared/plan-utils";');

content = content.replaceAll("userData?.subscriptionTier === 'enterprise'", "getActivePlanId(userData) === 'enterprise'");
content = content.replaceAll("userData?.subscriptionTier !== 'enterprise'", "getActivePlanId(userData) !== 'enterprise'");

content = content.replace("(userData?.subscriptionTier || userData?.plan || 'starter').toLowerCase()", "getActivePlanId(userData)");
content = content.replace("(userData?.subscriptionTier || (userData as any)?.plan || 'starter').toLowerCase()", "getActivePlanId(userData)");

content = content.replace("userData?.subscriptionTier || 'Starter'", "getActivePlanId(userData)");

fs.writeFileSync(file, content);
console.log('Replaced successfully');
