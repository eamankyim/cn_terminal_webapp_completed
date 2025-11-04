#!/bin/bash

echo "🔍 Checking Port Availability on Server"
echo "========================================"
echo ""

# Function to check if a port is in use
check_port() {
    local port=$1
    if ss -tuln | grep -q ":${port} "; then
        echo "❌ Port $port: IN USE"
        ss -tuln | grep ":${port} " | head -1
        return 1
    else
        echo "✅ Port $port: AVAILABLE"
        return 0
    fi
}

echo "📊 Frontend Ports (3000-3010):"
for port in {3000..3010}; do
    check_port $port
done

echo ""
echo "📊 Backend Ports (5000-5010):"
for port in {5000..5010}; do
    check_port $port
done

echo ""
echo "📊 Database Ports (5432-5440):"
for port in {5432..5440}; do
    check_port $port
done

echo ""
echo "💡 Recommendation:"
echo "Choose 3 consecutive available ports for Frontend, Backend, and Database"
echo ""
echo "Current configured ports:"
echo "  Frontend: 3004"
echo "  Backend: 5001"
echo "  Database: 5434"
