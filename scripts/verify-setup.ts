
#!/usr/bin/env tsx

/**
 * Audnix AI Setup Verification
 * Checks if all required environment variables are set
 */

const REQUIRED = {
  'Core Database': [
    'DATABASE_URL'
  ],
  'Authentication (Choose 1+)': [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ],
  'Security': [
    'SESSION_SECRET',
    'ENCRYPTION_KEY'
  ]
};

const OPTIONAL = {
  'AI Features': ['OPENAI_API_KEY'],
  'Payments': ['STRIPE_SECRET_KEY', 'VITE_STRIPE_PUBLIC_KEY'],
  'WhatsApp OTP': ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN'],
  'Google OAuth': ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'],
  'Voice Cloning': ['ELEVENLABS_API_KEY']
};

console.log('🔍 Audnix AI Setup Verification\n');

let allGood = true;

// Check required
for (const [category, vars] of Object.entries(REQUIRED)) {
  console.log(`\n📋 ${category}:`);
  for (const varName of vars) {
    const isSet = !!process.env[varName];
    console.log(`  ${isSet ? '✅' : '❌'} ${varName}`);
    if (!isSet && category !== 'Authentication (Choose 1+)') {
      allGood = false;
    }
  }
}

// Check if at least one auth method is configured
const hasAuth = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.GOOGLE_CLIENT_ID
);

if (!hasAuth) {
  console.log('\n❌ No authentication method configured!');
  console.log('   Set up either:');
  console.log('   - Supabase (for Email/WhatsApp)');
  console.log('   - Google OAuth');
  allGood = false;
}

// Check optional
console.log('\n\n📦 Optional Features:');
for (const [category, vars] of Object.entries(OPTIONAL)) {
  const configured = vars.some(v => process.env[v]);
  console.log(`  ${configured ? '✅' : '⏭️ '} ${category}`);
}

console.log('\n' + '='.repeat(50));
if (allGood && hasAuth) {
  console.log('✅ All required variables are set!');
  console.log('🚀 Run: npm run dev');
} else {
  console.log('❌ Missing required variables');
  console.log('📝 Check SETUP_INSTRUCTIONS.md');
  process.exit(1);
}
