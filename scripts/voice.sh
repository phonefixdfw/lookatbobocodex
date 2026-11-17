#!/bin/sh
set -eu
cd "$(dirname "$0")/.."
voice_temp="$(mktemp -d)"
trap 'rm -rf "$voice_temp"' EXIT
generate() {
  say -v Samantha -r "$2" -o "$voice_temp/$1.aiff" "$3"
  afconvert "$voice_temp/$1.aiff" "$voice_temp/$1.wav" -f WAVE -d LEI16@22050 -c 1
  if [ "$1" = win ]; then
    python3 scripts/mix-breeze.py "$voice_temp/$1.wav" "$voice_temp/win-breeze.wav"
    mv "$voice_temp/win-breeze.wav" "$voice_temp/$1.wav"
  fi
  cp "$voice_temp/$1.wav" "app/assets/$1.wav"
}
generate look 173 'Look at Bobo!'
generate dag 146 'Dag!'
generate win 150 'Your did it! You wihnd.'
