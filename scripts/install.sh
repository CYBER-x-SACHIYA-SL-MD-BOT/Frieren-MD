#!/bin/bash
#rrykarlsefni

INFO='\033[1;34m'
SUCCESS='\033[1;32m'
ERROR='\033[1;31m'
RESET='\033[0m'

clear
echo -e "${INFO}Memulai setup lingkungan untuk Termux...${RESET}"

if command -v pkg >/dev/null 2>&1; then
  echo -e "${INFO}Terdeteksi Termux...${RESET}"
  pkg install -y nodejs-lts git ffmpeg
elif command -v apt >/dev/null 2>&1; then
  echo -e "${INFO}Terdeteksi Debian/Ubuntu...${RESET}"
  sudo apt update && sudo apt install -y nodejs git ffmpeg
elif command -v apk >/dev/null 2>&1; then
  echo -e "${INFO}Terdeteksi Alpine Linux...${RESET}"
  apk add --no-cache nodejs npm git ffmpeg
else
  echo -e "${ERROR}Package manager tidak dikenali. Pastikan Node.js, Git, dan FFmpeg sudah terinstall manual.${RESET}"
fi

echo -e "${INFO}Menginstal package...${RESET}"
npm install

echo -e "${SUCCESS}Setup selesai. Jalankan dengan: npm start${RESET}"
