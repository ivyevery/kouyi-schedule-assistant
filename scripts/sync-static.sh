#!/usr/bin/env bash
set -euo pipefail

project_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
public_dir="$project_dir/public"

mkdir -p "$public_dir/assets" "$public_dir/design-system"
cp "$project_dir/interpreter-schedule.html" "$public_dir/interpreter-schedule.html"
cp "$project_dir/mobile-schedule.html" "$public_dir/mobile-schedule.html"
cp "$project_dir/cloud-sync.js" "$public_dir/cloud-sync.js"
cp "$project_dir/supabase-config.js" "$public_dir/supabase-config.js"
cp "$project_dir/app.webmanifest" "$public_dir/app.webmanifest"
cp "$project_dir/pwa-register.js" "$public_dir/pwa-register.js"
cp "$project_dir/service-worker.js" "$public_dir/service-worker.js"
cp -R "$project_dir/assets/." "$public_dir/assets/"
cp -R "$project_dir/design-system/." "$public_dir/design-system/"
