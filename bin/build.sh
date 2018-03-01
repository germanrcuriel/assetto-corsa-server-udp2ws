#!/usr/bin/env bash

PACKAGE_VERSION=$(cat package.json \
  | grep version \
  | head -1 \
  | awk -F: '{ print $2 }' \
  | sed 's/[",\t ]//g')

rm -rf lib build
babel src --out-dir lib
pkg lib/udp2ws.js -t latest-linux-x64,latest-win-x64 --out-path build
rm -rf lib
cd build
mkdir -p {win_x64,linux_x64}
mv udp2ws-win.exe win_x64/udp2ws.exe
mv udp2ws-linux linux_x64/udp2ws
cp ../src/udp2ws.ini win_x64
cp ../src/udp2ws.ini linux_x64
zip -r udp2ws-v$PACKAGE_VERSION.zip .
cd ..
