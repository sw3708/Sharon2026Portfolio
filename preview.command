#!/bin/bash
cd "$(dirname "$0")" || exit 1
printf 'Open http://localhost:8000 in your browser. Press Control-C to stop.\n'
python3 -m http.server 8000
