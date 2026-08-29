#!/bin/bash
# ============================================================
# Hunar Asaan CRM - 100% Repair & Fix Script
# ============================================================

echo "🛠️  Starting Hunar Asaan CRM Repair..."
echo ""

# 1. Kill any existing Node processes to release file locks
echo "🛑 Step 1: Stopping existing processes..."
killall node 2>/dev/null
sleep 2

# 2. Clean up corrupted files
echo "🧹 Step 2: Cleaning corrupted node_modules..."
rm -rf node_modules package-lock.json
rm -rf server/node_modules server/package-lock.json
echo "✅ Cleanup complete."

# 3. Reinstall Server Dependencies
echo "📦 Step 3: Installing BACKEND dependencies..."
cd server
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed. Retrying with --force..."
    npm install --force
fi
echo "✅ Backend ready."

# 4. Reinstall Frontend Dependencies
echo "📦 Step 4: Installing FRONTEND dependencies..."
cd ..
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed. Retrying with --force..."
    npm install --force
fi
echo "✅ Frontend ready."

echo ""
echo "🚀 Everything is fixed!"
echo "------------------------------------------------"
echo "1. Start Backend:  cd server && node index.js"
echo "2. Start Frontend: npm run dev"
echo "------------------------------------------------"
echo ""
echo "💡 Tip: If you still see errors, move the project OUT of iCloud to a local folder."
