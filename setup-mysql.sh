#!/bin/bash

echo "========================================="
echo "  MySQL Setup for Hunar Asaan CRM"
echo "========================================="
echo ""

# Step 1: Kill all MySQL processes
echo "📌 Step 1: Stopping all MySQL processes..."
killall -9 mysqld mysqld_safe 2>/dev/null
sleep 3
# Verify no MySQL processes are running
if pgrep -x mysqld > /dev/null; then
    echo "⚠️  MySQL still running, forcing stop..."
    killall -9 mysqld 2>/dev/null
    sleep 2
fi
echo "✅ All MySQL processes stopped"
echo ""

# Step 2: Start MySQL in safe mode (no password)
echo "📌 Step 2: Starting MySQL in safe mode..."
/opt/homebrew/opt/mysql/bin/mysqld_safe --skip-grant-tables --skip-networking --datadir=/opt/homebrew/var/mysql &
MYSQL_PID=$!
sleep 8
# Verify MySQL is running in safe mode
if ! pgrep -x mysqld > /dev/null; then
    echo "❌ Failed to start MySQL in safe mode!"
    exit 1
fi
echo "✅ MySQL safe mode started (PID: $MYSQL_PID)"
echo ""

# Step 3: Reset root password to empty
echo "📌 Step 3: Resetting root password..."
/opt/homebrew/opt/mysql/bin/mysql -u root << 'MYSQL'
FLUSH PRIVILEGES;
ALTER USER 'root'@'localhost' IDENTIFIED BY '';
FLUSH PRIVILEGES;
MYSQL

if [ $? -eq 0 ]; then
    echo "✅ Password reset successful!"
else
    echo "❌ Password reset failed!"
    exit 1
fi
echo ""

# Step 4: Stop safe mode
echo "📌 Step 4: Stopping safe mode..."
kill $MYSQL_PID 2>/dev/null
killall -9 mysqld mysqld_safe 2>/dev/null
sleep 3
echo "✅ Safe mode stopped"
echo ""

# Step 5: Start MySQL normally
echo "📌 Step 5: Starting MySQL normally..."
/opt/homebrew/opt/mysql/bin/mysqld_safe --datadir=/opt/homebrew/var/mysql &
sleep 5
echo "✅ MySQL started"
echo ""

# Step 6: Test connection
echo "📌 Step 6: Testing connection..."
/opt/homebrew/opt/mysql/bin/mysql -u root -e "SELECT 'SUCCESS! MySQL is working!' AS status;"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "  ✅ MySQL Setup Complete!"
    echo "========================================="
    echo ""
    echo "📌 Next step: Start your CRM server"
    echo "   cd server"
    echo "   npm run dev"
    echo ""
else
    echo ""
    echo "========================================="
    echo "  ❌ Setup Failed!"
    echo "========================================="
    echo ""
    echo "Please share the error message above"
    echo ""
fi
