#!/bin/bash
# Start clone site
cd /app/clone-site && npm run dev -- -H 0.0.0.0 &

# Wait for dev server
echo "Waiting for dev server..."
for i in $(seq 1 30); do
  curl -s http://localhost:3000/api/step > /dev/null && break
  sleep 2
done
echo "Dev server ready"

# Start Python login
cd /app && python3 login_automation.py --auto --keep-open &

# Wait for Chrome CDP
echo "Waiting for Chrome..."
for i in $(seq 1 30); do
  curl -s http://localhost:9222/json > /dev/null && break
  sleep 2
done
echo "Chrome ready"

# Start auto-passkey
cd /app/passkey-vault && node auto-passkey.js
