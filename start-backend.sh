#!/bin/bash

# Start Backend
cd /Users/ta/Desktop/Diwan-Hackathon/webrtc-meeting-app/backend
nohup node server.js > backend.log 2>&1 &
echo "✅ Backend started on port 3001"

# Wait for backend to be ready
sleep 3

# Start ngrok
nohup ngrok http 3001 --log=stdout > /tmp/ngrok.log 2>&1 &
echo "⏳ Starting ngrok..."

# Wait for ngrok
sleep 5

# Get ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | python3 -c "import sys, json; data = json.load(sys.stdin); print(data['tunnels'][0]['public_url'] if data.get('tunnels') else 'Error')" 2>/dev/null)

echo ""
echo "╔════════════════════════════════════════╗"
echo "║     🚀 Backend + ngrok Ready          ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "🌐 ngrok URL:"
echo "$NGROK_URL"
echo ""
echo "📋 Update this URL in Cranl:"
echo "   1. Frontend: VITE_API_BASE_URL"
echo "   2. Static Site: VITE_API_BASE_URL"
echo ""
echo "✅ Done! Backend is running."
