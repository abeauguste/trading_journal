#!/usr/bin/env bash
set -e

echo "=== ES Trading Dashboard ==="

# Change to project root
cd "$(dirname "$0")"

# Seed database if it doesn't exist
if [ ! -f backend/trading.db ]; then
  echo "Seeding database..."
  python3 -m backend.seed
fi

# Install frontend deps if needed
if [ ! -d frontend/node_modules ]; then
  echo "Installing frontend dependencies..."
  cd frontend && npm install && cd ..
fi

# Start FastAPI backend
echo "Starting FastAPI backend on http://localhost:8000..."
python3 -m uvicorn backend.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!

sleep 2

# Start Vite frontend
echo "Starting React frontend on http://localhost:5173..."
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd frontend && npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"
echo "API docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM
wait
