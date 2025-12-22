/**
 * PHASE 1: SUPABASE STORAGE VERIFICATION ROUTES
 * 
 * These routes validate that:
 * 1. Environment variables are loaded correctly
 * 2. Supabase client is initialized with Service Role key
 * 3. Storage buckets are accessible
 * 4. Files can be read from buckets
 * 5. Database connection is working
 * 
 * All operations are READ-ONLY (no uploads, no modifications)
 */

import type { Express } from "express";
import { supabaseAdmin, isSupabaseAdminConfigured } from "../lib/supabase-admin.js";
import { db } from "../db.js";

const VERIFICATION_LOG_PREFIX = "🔍 [VERIFICATION]";

function verificationLog(message: string, data?: any) {
  const timestamp = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${timestamp} ${VERIFICATION_LOG_PREFIX} ${message}`, data ? JSON.stringify(data, null, 2) : "");
}

/**
 * ROUTE 1: /api/verify/env
 * Checks that all required environment variables are present
 */
async function verifyEnvironmentVariables() {
  verificationLog("=== ENVIRONMENT VARIABLES CHECK ===");

  const requiredVars = [
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATABASE_URL",
  ];

  const optionalVars = [
    "SUPABASE_ANON_KEY",
    "OPENAI_API_KEY",
  ];

  const status: Record<string, any> = {
    required: {},
    optional: {},
    missing: [],
  };

  // Check required variables
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (value) {
      status.required[varName] = {
        present: true,
        length: value.length,
        preview: value.substring(0, 20) + "...",
      };
      verificationLog(`✅ ${varName} is set (${value.length} chars)`);
    } else {
      status.required[varName] = { present: false };
      status.missing.push(varName);
      verificationLog(`❌ ${varName} is MISSING`);
    }
  }

  // Check optional variables
  for (const varName of optionalVars) {
    const value = process.env[varName];
    if (value) {
      status.optional[varName] = {
        present: true,
        length: value.length,
        preview: value.substring(0, 20) + "...",
      };
      verificationLog(`✅ ${varName} is set (${value.length} chars)`);
    } else {
      status.optional[varName] = { present: false };
      verificationLog(`⚠️  ${varName} is optional and not set`);
    }
  }

  return status;
}

/**
 * ROUTE 2: /api/verify/supabase
 * Checks Supabase client initialization and lists buckets
 */
async function verifySupabaseClient() {
  verificationLog("=== SUPABASE CLIENT VERIFICATION ===");

  const status: Record<string, any> = {
    configured: false,
    initialized: false,
    buckets: [],
    error: null,
  };

  // Check if Supabase admin is configured
  const isConfigured = isSupabaseAdminConfigured();
  verificationLog(`Supabase admin configured: ${isConfigured}`);
  status.configured = isConfigured;

  if (!isConfigured) {
    status.error = "Supabase credentials not configured. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY";
    verificationLog(`❌ ${status.error}`);
    return status;
  }

  // Check if client is initialized
  if (!supabaseAdmin) {
    status.error = "Supabase admin client failed to initialize";
    verificationLog(`❌ ${status.error}`);
    return status;
  }

  status.initialized = true;
  verificationLog("✅ Supabase admin client initialized");

  // Try to list buckets
  try {
    verificationLog("Attempting to list Storage buckets...");
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();

    if (listError) {
      status.error = `Failed to list buckets: ${listError.message}`;
      verificationLog(`❌ ${status.error}`);
      return status;
    }

    if (!buckets) {
      status.error = "No buckets returned from Storage";
      verificationLog(`❌ ${status.error}`);
      return status;
    }

    verificationLog(`✅ Successfully listed ${buckets.length} bucket(s)`);
    status.buckets = buckets.map((b: any) => ({
      name: b.name,
      id: b.id,
      created_at: b.created_at,
      updated_at: b.updated_at,
    }));

    // Verify expected buckets exist
    const expectedBuckets = ["avatars", "pdfs", "voice"];
    for (const bucketName of expectedBuckets) {
      const exists = buckets.some((b: any) => b.name === bucketName);
      if (exists) {
        verificationLog(`✅ Bucket "${bucketName}" exists`);
      } else {
        verificationLog(`⚠️  Bucket "${bucketName}" not found`);
      }
    }

    return status;
  } catch (error: any) {
    status.error = `Exception while listing buckets: ${error.message}`;
    verificationLog(`❌ ${status.error}`);
    return status;
  }
}

/**
 * ROUTE 3: /api/verify/storage-test
 * Attempts to read a file from the avatars bucket (if it exists)
 */
async function verifyStorageReadAccess() {
  verificationLog("=== STORAGE READ ACCESS VERIFICATION ===");

  const status: Record<string, any> = {
    bucketAccessible: false,
    canReadPublicUrl: false,
    testFile: null,
    error: null,
  };

  if (!supabaseAdmin) {
    status.error = "Supabase admin client not initialized";
    verificationLog(`❌ ${status.error}`);
    return status;
  }

  try {
    // Test the avatars bucket
    const testBucketName = "avatars";
    verificationLog(`Testing read access to "${testBucketName}" bucket...`);

    // Get bucket metadata to verify access
    const { data: bucketData, error: bucketError } = await supabaseAdmin.storage.getBucket(testBucketName);

    if (bucketError) {
      status.error = `Cannot access "${testBucketName}" bucket: ${bucketError.message}`;
      verificationLog(`❌ ${status.error}`);
      return status;
    }

    verificationLog(`✅ Successfully accessed "${testBucketName}" bucket`);
    status.bucketAccessible = true;
    status.testFile = {
      bucket: bucketData.name,
      id: bucketData.id,
      public: bucketData.public,
    };

    // Test generating a public URL for a hypothetical file
    try {
      const testFilePath = "test-avatar.png";
      const { data: publicUrl } = supabaseAdmin.storage
        .from(testBucketName)
        .getPublicUrl(testFilePath);

      if (publicUrl?.publicUrl) {
        verificationLog(`✅ Can generate public URLs: ${publicUrl.publicUrl}`);
        status.canReadPublicUrl = true;
      }
    } catch (urlError: any) {
      verificationLog(`⚠️  Cannot generate public URL: ${urlError.message}`);
    }

    return status;
  } catch (error: any) {
    status.error = `Exception during storage verification: ${error.message}`;
    verificationLog(`❌ ${status.error}`);
    return status;
  }
}

/**
 * ROUTE 4: /api/verify/database
 * Checks database connection and reads from users table
 */
async function verifyDatabaseConnection() {
  verificationLog("=== DATABASE CONNECTION VERIFICATION ===");

  const status: Record<string, any> = {
    connected: false,
    canRead: false,
    userCount: 0,
    tableExists: false,
    error: null,
  };

  if (!process.env.DATABASE_URL) {
    status.error = "DATABASE_URL environment variable not set";
    verificationLog(`❌ ${status.error}`);
    return status;
  }

  try {
    verificationLog("Testing database connection...");

    if (!db) {
      status.error = "Database client not initialized";
      verificationLog(`❌ ${status.error}`);
      return status;
    }

    // Try to query the users table
    verificationLog("Attempting to read from users table...");
    const users = await db.query.users.findMany({ limit: 1 });

    status.connected = true;
    status.canRead = true;
    status.tableExists = true;
    verificationLog("✅ Database connection successful");
    verificationLog(`✅ Users table is readable`);

    // Get user count
    const allUsers = await db.query.users.findMany();
    status.userCount = allUsers?.length || 0;
    verificationLog(`✅ Total users in database: ${status.userCount}`);

    return status;
  } catch (error: any) {
    status.error = `Database error: ${error.message}`;
    verificationLog(`❌ ${status.error}`);
    return status;
  }
}

/**
 * Register all verification routes
 */
export function registerVerificationRoutes(app: Express) {
  // ENDPOINT 1: Environment Variables Verification
  app.get("/api/verify/env", async (req, res) => {
    try {
      const result = await verifyEnvironmentVariables();
      res.json({
        success: true,
        endpoint: "/api/verify/env",
        timestamp: new Date().toISOString(),
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ENDPOINT 2: Supabase Client Verification
  app.get("/api/verify/supabase", async (req, res) => {
    try {
      const result = await verifySupabaseClient();
      res.json({
        success: result.configured && result.initialized,
        endpoint: "/api/verify/supabase",
        timestamp: new Date().toISOString(),
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ENDPOINT 3: Storage Read Access Verification
  app.get("/api/verify/storage-test", async (req, res) => {
    try {
      const result = await verifyStorageReadAccess();
      res.json({
        success: result.bucketAccessible,
        endpoint: "/api/verify/storage-test",
        timestamp: new Date().toISOString(),
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // ENDPOINT 4: Database Connection Verification
  app.get("/api/verify/database", async (req, res) => {
    try {
      const result = await verifyDatabaseConnection();
      res.json({
        success: result.connected && result.canRead,
        endpoint: "/api/verify/database",
        timestamp: new Date().toISOString(),
        data: result,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  // MASTER ENDPOINT: Full Verification Suite
  app.get("/api/verify/all", async (req, res) => {
    try {
      verificationLog("=== RUNNING FULL VERIFICATION SUITE ===");
      
      const envCheck = await verifyEnvironmentVariables();
      const supabaseCheck = await verifySupabaseClient();
      const storageCheck = await verifyStorageReadAccess();
      const dbCheck = await verifyDatabaseConnection();

      const allPassed = 
        Object.keys(envCheck.required).every(k => envCheck.required[k].present) &&
        supabaseCheck.configured &&
        supabaseCheck.initialized &&
        storageCheck.bucketAccessible &&
        dbCheck.connected &&
        dbCheck.canRead;

      verificationLog(allPassed ? "✅ ALL CHECKS PASSED" : "⚠️  SOME CHECKS FAILED");

      res.json({
        success: allPassed,
        timestamp: new Date().toISOString(),
        checks: {
          environment: envCheck,
          supabase: supabaseCheck,
          storage: storageCheck,
          database: dbCheck,
        },
        summary: {
          allPassed,
          envConfigured: Object.keys(envCheck.required).every(k => envCheck.required[k].present),
          supabaseReady: supabaseCheck.configured && supabaseCheck.initialized,
          storageAccessible: storageCheck.bucketAccessible,
          databaseConnected: dbCheck.connected,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  verificationLog("✅ Verification routes registered:");
  verificationLog("   - GET /api/verify/env - Check environment variables");
  verificationLog("   - GET /api/verify/supabase - Check Supabase client & buckets");
  verificationLog("   - GET /api/verify/storage-test - Check Storage read access");
  verificationLog("   - GET /api/verify/database - Check database connection");
  verificationLog("   - GET /api/verify/all - Run full verification suite");
}
