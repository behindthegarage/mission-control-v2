#!/bin/bash
# Mission Control v2 Start Script
# Starts API, Collector, and Web services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PID_DIR="$PROJECT_DIR/.pids"
LOG_DIR="$PROJECT_DIR/logs"

# Create necessary directories
mkdir -p "$PID_DIR" "$LOG_DIR"

echo "🚀 Starting Mission Control v2..."
echo "Project directory: $PROJECT_DIR"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    if check_port $port; then
        echo "   Port $port is in use, stopping existing process..."
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        sleep 1
    fi
}

# Kill existing processes on our ports
echo "   Checking for existing processes..."
kill_port 3000  # Web
kill_port 3001  # API

# Start API
echo "📡 Starting API on port 3001..."
cd "$PROJECT_DIR/api"
if [ ! -d "node_modules" ]; then
    echo "   Installing API dependencies..."
    npm install
fi
nohup npm run dev > "$LOG_DIR/api.log" 2>&1 &
echo $! > "$PID_DIR/api.pid"
sleep 2

# Verify API started
if ! check_port 3001; then
    echo "❌ API failed to start! Check logs: $LOG_DIR/api.log"
    exit 1
fi
echo "   ✅ API is running (PID: $(cat $PID_DIR/api.pid))"

# Start Collector
echo "🔄 Starting Collector..."
cd "$PROJECT_DIR/collector"
if [ ! -d "node_modules" ]; then
    echo "   Installing Collector dependencies..."
    npm install
fi
nohup npm start > "$LOG_DIR/collector.log" 2>&1 &
echo $! > "$PID_DIR/collector.pid"
sleep 1
echo "   ✅ Collector is running (PID: $(cat $PID_DIR/collector.pid))"

# Start Web
echo "🌐 Starting Web on port 3000..."
cd "$PROJECT_DIR/web"
if [ ! -d "node_modules" ]; then
    echo "   Installing Web dependencies..."
    npm install
fi
nohup npm run dev > "$LOG_DIR/web.log" 2>&1 &
echo $! > "$PID_DIR/web.pid"
sleep 3

# Verify Web started
if ! check_port 3000; then
    echo "❌ Web failed to start! Check logs: $LOG_DIR/web.log"
    exit 1
fi
echo "   ✅ Web is running (PID: $(cat $PID_DIR/web.pid))"

echo ""
echo "✨ Mission Control v2 is now running!"
echo ""
echo "   🌐 Web UI:   http://localhost:3000"
echo "   📡 API:      http://localhost:3001"
echo ""
echo "   Logs: $LOG_DIR/"
echo "   Stop: $SCRIPT_DIR/stop-mission-control.sh"
echo ""
