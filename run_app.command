#!/bin/bash

# Navigate to the correct directory
cd "$(dirname "$0")/web_gui/public"

# Kill any existing process on port 8000
lsof -ti:8000 | xargs kill -9 2>/dev/null

# Open the browser
open http://localhost:8000

# Start the server
echo "Starting server at http://localhost:8000"
echo "Press Ctrl+C to stop"
python3 -m http.server 8000
