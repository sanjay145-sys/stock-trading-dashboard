#!/usr/bin/env bash
# Start the StockPulse AI backend
# Usage: ./start.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

export PATH="/Users/Trading/anaconda3/bin:$PATH"

if [ ! -f .env ]; then
  echo "⚠️  No .env file found. Copying from .env.example..."
  cp .env.example .env
  echo "   Set ANTHROPIC_API_KEY in .env to enable AI features."
fi

echo "🚀 Starting StockPulse AI backend on http://localhost:8000"
echo "   AI enabled: $(grep -m1 ANTHROPIC_API_KEY .env | grep -v 'your_' | wc -l | tr -d ' ') (1=yes)"
echo ""

uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
