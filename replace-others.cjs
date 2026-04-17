const fs = require('fs');
let file = 'client/src/pages/dashboard/pricing.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('getActivePlanId')) {
  // Try to insert the import
  content = content.replace('import { Button } from "@/components/ui/button";', 'import { Button } from "@/components/ui/button";\nimport { getActivePlanId } from "@shared/plan-utils";');
}

content = content.replace("const currentPlan = user?.subscriptionTier || user?.plan || 'trial';", "const currentPlan = getActivePlanId(user);");

fs.writeFileSync(file, content);
console.log('Replaced pricing.tsx');

file = 'client/src/components/upgrade/FeatureLock.tsx';
content = fs.readFileSync(file, 'utf8');

if (!content.includes('getActivePlanId')) {
  content = content.replace('import { isPaidPlan } from "@shared/plan-utils";', 'import { isPaidPlan, getActivePlanId } from "@shared/plan-utils";');
}

content = content.replace('const isPaid = userData?.user?.subscriptionTier && userData.user.subscriptionTier !== "free";', 'const isPaid = isPaidPlan(getActivePlanId(userData?.user));');

fs.writeFileSync(file, content);
console.log('Replaced FeatureLock.tsx');
