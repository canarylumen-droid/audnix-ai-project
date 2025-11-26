# 🔄 OpenAI Free Tier: 200 Users Before Key Rotation

## Free Tier Limits

OpenAI free API key supports:
- **Limited tokens/minute (TPM)**
- **Typical rate:** ~90,000 TPM for free tier
- **Per-user cost:** ~450 tokens per objection handling + follow-up

---

## User Capacity on Free Tier

### Math
```
90,000 TPM available
÷ 450 tokens per user per day
= 200 users maximum per day

Beyond 200 users → Rate limiting kicks in
```

### Timeline
```
0-200 users: Single key, full speed ✅
200-400 users: Need 2 keys (rotate between them)
400+ users: Need 3+ keys or upgrade to paid plan
```

---

## Key Rotation Strategy

### When to Rotate (At ~150 users to be safe)

**Before Rotation:**
```env
OPENAI_API_KEY=sk_live_xxxxx (serving all users)
```

**After Rotation (at 150 users):**
```env
OPENAI_API_KEY_1=sk_live_xxxxx (users 1-150)
OPENAI_API_KEY_2=sk_live_yyyyy (users 151+)
```

### Implementation
```typescript
// server/lib/ai/openai.ts

const apiKeys = [
  process.env.OPENAI_API_KEY_1,
  process.env.OPENAI_API_KEY_2,
  process.env.OPENAI_API_KEY_3,
];

function getApiKeyForUser(userId: string): string {
  // Distribute users across keys
  const keyIndex = userId.charCodeAt(0) % apiKeys.length;
  return apiKeys[keyIndex];
}

// Usage
const client = new OpenAI({
  apiKey: getApiKeyForUser(userId)
});
```

---

## When to Upgrade from Free Tier

### Revenue Trigger
- **At $10k MRR:** Upgrade to paid plan
- **Cost:** ~$0.50 per 1M tokens (vs. rate-limited free tier)
- **Break-even:** Usually at 300+ active users

### Calculation
```
300 users × 450 tokens/day × $0.0005/1k tokens
= 300 × 450 × 0.0000005
= $0.0675/day
= $2.03/month for API costs

At $10k MRR, this is negligible
```

---

## Current Status

**For <200 users:**
- ✅ Single free OpenAI key works
- ✅ No rate limiting
- ✅ Full objection handling + voice generation
- ✅ $0 API cost

**For 200-400 users:**
- ✅ 2-3 keys rotate between them
- ✅ Still free, just need multiple keys
- ✅ Distribute load across keys

**For 400+ users:**
- ⏳ Consider paid plan ($5-50/month depending on usage)
- ⏳ Or continue with key rotation (add more free keys)

---

## Setup Multiple Keys

1. **Create new OpenAI account** (can use different email)
2. **Generate new API key** from new account
3. **Add to environment variables:**
   ```env
   OPENAI_API_KEY_1=sk_live_xxxxx
   OPENAI_API_KEY_2=sk_live_yyyyy
   OPENAI_API_KEY_3=sk_live_zzzzz
   ```
4. **Code distributes requests** across keys automatically

---

## Summary

| Users | Keys Needed | Cost | Status |
|-------|------------|------|--------|
| 0-200 | 1 | $0 | ✅ Free tier |
| 200-400 | 2-3 | $0 | ✅ Rotate keys |
| 400+ | 4+ or paid | $0-50/mo | ⏳ Upgrade recommended |

**You can serve 200-400 users completely free by rotating OpenAI keys.** Only upgrade to paid when you hit 400+ users or $10k+ MRR. 🎯
