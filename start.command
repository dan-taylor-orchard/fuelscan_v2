#!/bin/bash

# ── FuelScan NSW — One-click launcher ──────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo ""
echo -e "${CYAN}${BOLD}  ⛽  FuelScan NSW${NC}"
echo -e "${CYAN}  ─────────────────────────────${NC}"
echo ""

# ── Check Node.js is installed ─────────────────────────────────────────────
if ! command -v node &> /dev/null; then
  echo -e "${RED}  ✗ Node.js is not installed.${NC}"
  echo ""
  echo "  Please install it from: https://nodejs.org"
  echo "  Download the LTS version, install it, then run this script again."
  echo ""
  # Try to open the URL on Mac
  if command -v open &> /dev/null; then
    open "https://nodejs.org"
  fi
  read -p "  Press Enter to exit..."
  exit 1
fi

NODE_VER=$(node --version)
echo -e "  ${GREEN}✓ Node.js${NC} $NODE_VER found"

# ── Install dependencies if node_modules missing ───────────────────────────
if [ ! -d "node_modules" ]; then
  echo ""
  echo -e "  ${YELLOW}→ Installing dependencies (first run only, ~30 seconds)...${NC}"
  npm install --silent
  if [ $? -ne 0 ]; then
    echo -e "  ${RED}✗ npm install failed. Check your internet connection and try again.${NC}"
    read -p "  Press Enter to exit..."
    exit 1
  fi
  echo -e "  ${GREEN}✓ Dependencies installed${NC}"
fi

# ── Kill any existing process on port 3000 ────────────────────────────────
if lsof -Pi :3000 -sTCP:LISTEN -t &>/dev/null; then
  echo -e "  ${YELLOW}→ Port 3000 in use — stopping previous instance...${NC}"
  kill $(lsof -Pi :3000 -sTCP:LISTEN -t) 2>/dev/null
  sleep 1
fi

# ── Start the server ───────────────────────────────────────────────────────
echo ""
echo -e "  ${YELLOW}→ Starting FuelScan...${NC}"
echo ""

# Start Next.js in background
npm run dev -- --port 3000 &>/tmp/fuelscan.log &
SERVER_PID=$!

# Wait for server to be ready
echo -ne "  Waiting for server"
for i in {1..30}; do
  if curl -s http://localhost:3000 &>/dev/null; then
    break
  fi
  echo -ne "."
  sleep 1
done
echo ""

# Check it actually started
if ! kill -0 $SERVER_PID 2>/dev/null; then
  echo -e "  ${RED}✗ Server failed to start. Check /tmp/fuelscan.log for details.${NC}"
  read -p "  Press Enter to exit..."
  exit 1
fi

# ── Open browser ───────────────────────────────────────────────────────────
echo ""
echo -e "  ${GREEN}${BOLD}✓ FuelScan is running!${NC}"
echo ""
echo -e "  ${BOLD}  → http://localhost:3000${NC}"
echo ""
echo -e "  ${CYAN}  Opening in your browser...${NC}"
echo ""
echo -e "  (Press Ctrl+C in this window to stop the server)"
echo ""

# Open browser (Mac or Linux)
if command -v open &> /dev/null; then
  open "http://localhost:3000"          # macOS
elif command -v xdg-open &> /dev/null; then
  xdg-open "http://localhost:3000"      # Linux
fi

# Keep script alive so Ctrl+C kills the server cleanly
trap "echo ''; echo '  Stopping FuelScan...'; kill $SERVER_PID 2>/dev/null; echo '  Done. Goodbye!'; exit 0" SIGINT SIGTERM
wait $SERVER_PID
