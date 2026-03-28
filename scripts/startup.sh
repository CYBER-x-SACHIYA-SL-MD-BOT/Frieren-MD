#!/bin/bash
echo "Memulai Dabi-Ai untuk Panel..."

# Ensure dependencies are installed if node_modules is missing
if [ ! -d "node_modules" ]; then
    echo "Node modules tidak ditemukan. Menginstall..."
    npm install
fi

# Start the bot
npm start
