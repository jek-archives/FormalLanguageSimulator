#!/bin/bash
cd "$(dirname "$0")"

# Define the port
PORT=8000
URL="http://localhost:$PORT/web_gui/public/"

echo "=================================================="
echo "   Formal Language Simulator - Quick Launcher"
echo "=================================================="
echo "Starting local server at port $PORT..."
echo "Opening $URL in your default browser..."
echo "--------------------------------------------------"
echo "Keep this window open while using the simulator."
echo "Close this window to stop the server."
echo "=================================================="

# Open the browser in the background after 1 second
(sleep 1 && open "$URL") &

# Start the Python HTTP server
python3 -m http.server $PORT
