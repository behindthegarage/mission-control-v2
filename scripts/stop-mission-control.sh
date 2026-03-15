#!/bin/bash
# Mission Control v2 Stop Script
# Stops API, Collector, and Web services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$PROJECT_DIR/.pids"

echo "🛑 Stopping Mission Control v2..."

# Function to stop service by PID file
stop_service() {
    local service_name=$1
    local pid_file="$PID_DIR/$2"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            echo "   Stopping $service_name (PID: $pid)..."
            kill "$pid" 2>/dev/null || true
            sleep 1
            # Force kill if still running
            if ps -p "$pid" > /dev/null 2>&1; then
                kill -9 "$pid" 2>/dev/null || true
            fi
        fi
        rm -f "$pid_file"
        echo "   ✅ $service_name stopped"
    else
        echo "   $service_name was not running"
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local name=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "   Stopping $name on port $port..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo "   ✅ $name stopped"
    fi
}

# Stop by PID files
stop_service "API" "api.pid"
stop_service "Collector" "collector.pid"
stop_service "Web" "web.pid"

# Also try killing by port as fallback
kill_port 3001 "API"
kill_port 3000 "Web"

echo ""
echo "✨ Mission Control v2 stopped"
