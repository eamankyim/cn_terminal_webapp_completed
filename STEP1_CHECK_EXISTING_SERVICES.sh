#!/bin/bash

# CN Terminal Deployment - Step 1: Check Existing Services
# Run this script on your server to identify potential conflicts

echo "=========================================="
echo "CN Terminal Deployment - Step 1"
echo "Checking Existing Services on Server"
echo "=========================================="
echo ""

echo "📋 Step 1.1: Checking Ports in Use"
echo "-----------------------------------"
echo "Checking common ports that CN Terminal uses:"
echo ""

# Check PostgreSQL ports
echo "PostgreSQL ports (5432, 5433, 5434, 5435):"
for port in 5432 5433 5434 5435; do
    if sudo ss -tuln | grep -q ":$port "; then
        echo "  ⚠️  Port $port is IN USE"
        sudo ss -tulpn | grep ":$port " | head -1
    else
        echo "  ✅ Port $port is AVAILABLE"
    fi
done
echo ""

# Check Backend ports
echo "Backend API ports (5000, 5001, 5002, 5003):"
for port in 5000 5001 5002 5003; do
    if sudo ss -tuln | grep -q ":$port "; then
        echo "  ⚠️  Port $port is IN USE"
        sudo ss -tulpn | grep ":$port " | head -1
    else
        echo "  ✅ Port $port is AVAILABLE"
    fi
done
echo ""

# Check Frontend ports
echo "Frontend ports (3000, 3004, 3005, 3006):"
for port in 3000 3004 3005 3006; do
    if sudo ss -tuln | grep -q ":$port "; then
        echo "  ⚠️  Port $port is IN USE"
        sudo ss -tulpn | grep ":$port " | head -1
    else
        echo "  ✅ Port $port is AVAILABLE"
    fi
done
echo ""

# Check HTTP/HTTPS ports
echo "HTTP/HTTPS ports (80, 443):"
for port in 80 443; do
    if sudo ss -tuln | grep -q ":$port "; then
        echo "  ⚠️  Port $port is IN USE"
        sudo ss -tulpn | grep ":$port " | head -1
    else
        echo "  ✅ Port $port is AVAILABLE"
    fi
done
echo ""

echo "📋 Step 1.2: Checking Docker Containers"
echo "---------------------------------------"
echo "Existing Docker containers:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"
echo ""

echo "📋 Step 1.3: Checking Docker Networks"
echo "-------------------------------------"
echo "Existing Docker networks:"
docker network ls
echo ""

# Check for host-network
if docker network ls | grep -q "host-network"; then
    echo "  ✅ Found 'host-network' - You can connect CN Terminal nginx to this"
else
    echo "  ℹ️  'host-network' not found - CN Terminal will use its own network"
fi
echo ""

echo "📋 Step 1.4: Checking Docker Volumes"
echo "-------------------------------------"
echo "Existing Docker volumes:"
docker volume ls
echo ""

echo "📋 Step 1.5: Checking for Container Name Conflicts"
echo "--------------------------------------------------"
conflict_names=("cn_terminal_postgres" "cn_terminal_backend" "cn_terminal_frontend" "cn_terminal-nginx" "postgres" "backend" "frontend")
for name in "${conflict_names[@]}"; do
    if docker ps -a --format "{{.Names}}" | grep -q "^${name}$"; then
        echo "  ⚠️  Container name '$name' is ALREADY IN USE"
    else
        echo "  ✅ Container name '$name' is AVAILABLE"
    fi
done
echo ""

echo "=========================================="
echo "Summary"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo "1. Review the output above"
echo "2. Identify which ports are available"
echo "3. Note any container name conflicts"
echo "4. Check if host-network exists"
echo "5. Proceed to Step 2: Update docker-compose.prod.yml"
echo ""
echo "💡 Tip: Copy the output above for reference when configuring docker-compose.prod.yml"
echo ""

