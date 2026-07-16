#!/bin/bash
# ============================================================
# Hunar Asaan CRM - Quick Start Script
# ============================================================

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 Starting Hunar Asaan CRM..."
echo ""

# Check if XAMPP MySQL is running
if ! pgrep -x "mysqld" > /dev/null 2>&1; then
    echo "⚠️  MySQL is NOT running!"
    echo "   Please start XAMPP and enable MySQL first."
    echo "   Then run this script again."
    echo ""
    # Try to start XAMPP MySQL automatically
    if [ -f "/Applications/XAMPP/xamppfiles/bin/mysqld_safe" ]; then
        echo "   Attempting to start MySQL via XAMPP..."
        sudo /Applications/XAMPP/xamppfiles/bin/mysql.server start
    fi
    echo ""
fi

echo "📦 Step 1: Installing server dependencies (if needed)..."
cd "$PROJECT_DIR/server" && npm install --silent

echo ""
echo "📦 Step 2: Installing frontend dependencies (if needed)..."
cd "$PROJECT_DIR" && npm install --silent

echo ""
echo "✅ Dependencies ready!"
echo ""
echo "🔵 Opening Backend Terminal (port 5001)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR/server' && echo '=== BACKEND ===' && node index.js\""

sleep 2

echo "🟢 Opening Frontend Terminal (port 5173)..."
osascript -e "tell application \"Terminal\" to do script \"cd '$PROJECT_DIR' && echo '=== FRONTEND ===' && npm run dev\""

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "   Backend  → http://localhost:5001"
echo "   Frontend → http://localhost:5173"
echo ""
echo "   Open http://localhost:5173 in your browser."
echo ""
