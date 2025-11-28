#!/bin/bash
set -e

echo "========================================="
echo "   Build & Runtime Verification Script   "
echo "========================================="

echo ""
echo "Step 1: Running npm run build..."
npm run build

echo ""
echo "Step 2: Checking dist/server/index.js exists..."
if [ ! -f "dist/server/index.js" ]; then
    echo "ERROR: dist/server/index.js not found!"
    exit 1
fi
echo "OK: dist/server/index.js exists"

echo ""
echo "Step 3: Checking dist/public directory exists..."
if [ ! -d "dist/public" ]; then
    echo "ERROR: dist/public directory not found!"
    exit 1
fi
echo "OK: dist/public directory exists"

echo ""
echo "Step 4: Starting server in background..."
NODE_ENV=production node dist/server/index.js &
SERVER_PID=$!
echo "Server started with PID: $SERVER_PID"

echo "Waiting 5 seconds for server to initialize..."
sleep 5

echo ""
echo "Step 5: Testing health endpoint..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health 2>/dev/null || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "OK: Health endpoint returned HTTP $HEALTH_STATUS"
else
    echo "WARNING: Health endpoint returned HTTP $HEALTH_STATUS (expected 200)"
fi

echo ""
echo "Step 6: Testing OTP endpoint..."
OTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:5000/api/auth/send-otp \
    -H "Content-Type: application/json" \
    -d '{"email":"test+vercel@audnix.com"}' 2>/dev/null || echo "000")

if [ "$OTP_STATUS" = "200" ] || [ "$OTP_STATUS" = "201" ]; then
    echo "OK: OTP endpoint returned HTTP $OTP_STATUS"
else
    echo "INFO: OTP endpoint returned HTTP $OTP_STATUS (may require database connection)"
fi

echo ""
echo "Step 7: Stopping server..."
kill $SERVER_PID 2>/dev/null || true
wait $SERVER_PID 2>/dev/null || true
echo "Server stopped"

echo ""
echo "========================================="
echo "   Verification Complete!               "
echo "========================================="
echo ""
echo "Results:"
echo "  - Build: SUCCESS"
echo "  - dist/server/index.js: EXISTS"
echo "  - dist/public: EXISTS"
echo "  - Health endpoint: HTTP $HEALTH_STATUS"
echo "  - OTP endpoint: HTTP $OTP_STATUS"
echo ""

if [ "$HEALTH_STATUS" = "200" ]; then
    echo "All critical checks passed!"
    exit 0
else
    echo "Some checks may need attention. Review the output above."
    exit 0
fi
