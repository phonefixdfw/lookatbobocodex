#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
voice_temp="$(mktemp -d)"
trap 'rm -rf "$voice_temp"' EXIT
generate() {
  say -v Samantha -r "$2" -o "$voice_temp/$1.aiff" "$3"
  afconvert "$voice_temp/$1.aiff" "$voice_temp/$1.wav" -f WAVE -d LEI16@22050 -c 1
  cp "$voice_temp/$1.wav" "app/assets/$1.wav"
}
if [ "${1:-}" != --win-only ]; then
  generate look 173 'Look at Bobo!'
  generate dag 146 'Dag!'
fi

swift -module-cache-path "$voice_temp/swift-cache" scripts/win-voice.swift "$voice_temp/win.caf"
afconvert "$voice_temp/win.caf" "$voice_temp/win.wav" -f WAVE -d LEI16@22050 -c 1
python3 scripts/mix-breeze.py "$voice_temp/win.wav" app/assets/win.wav
