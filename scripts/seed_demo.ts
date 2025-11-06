/**
 * Demo seeding script for testing real-time features
 * 
 * Usage:
 *   npm run seed-demo
 * 
 * This script creates fake users to simulate the real-time "People Joined" counter
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Avery', 'Quinn', 'Skyler', 'Cameron'];
const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

function randomName() {
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${first} ${last}`;
}

async function seedUser() {
  const name = randomName();
  const email = `${name.toLowerCase().replace(' ', '.')}${Date.now()}@demo.com`;
  
  const trialExpiresAt = new Date();
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 3);

  // Use crypto.randomUUID() for secure random ID generation
  const secureRandomId = crypto.randomUUID();

  const { data, error } = await supabase
    .from('users')
    .insert({
      email,
      name,
      username: name.toLowerCase().replace(' ', '_'),
      plan: 'trial',
      trial_expires_at: trialExpiresAt.toISOString(),
      supabase_id: `demo_${Date.now()}_${secureRandomId.substring(0, 7)}`,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating demo user:', error);
  } else {
    console.log('✓ Created demo user:', data.name);
  }
}

async function runSeeder() {
  console.log('Starting demo seeder...\n');
  
  let count = 0;
  const maxUsers = 10;

  const interval = setInterval(async () => {
    if (count >= maxUsers) {
      clearInterval(interval);
      console.log(`\n✓ Seeded ${maxUsers} demo users`);
      process.exit(0);
    }

    await seedUser();
    count++;
    // Use crypto for secure random intervals between 2-7 seconds
  }, crypto.randomInt(2000, 7000));
}

runSeeder();
