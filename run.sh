#!/bin/bash
# One-command runner for Udhaar Khata

set -e

echo "📒 Starting Udhaar Khata (उधार खाता)..."

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/tags > /dev/null; then
    echo "⚠️  Starting Ollama service..."
    ollama serve &
    sleep 2
fi

# Activate virtualenv and start backend
echo "🚀 Starting FastAPI Backend on http://localhost:8000..."
PYTHONPATH=backend ./backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Start frontend
echo "✨ Starting Frontend on http://localhost:5173..."
npm --prefix frontend run dev &
FRONTEND_PID=$!

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT

wait
