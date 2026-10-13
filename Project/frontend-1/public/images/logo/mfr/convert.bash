#!/usr/bin/env bash

set -euo pipefail

SOURCE="${1:-logo.png}"
OUTPUT_DIR="${2:-dist}"

mkdir -p "$OUTPUT_DIR/logo"
mkdir -p "$OUTPUT_DIR/icon"

LOGO_WIDTHS=(100 150 200 300 400 600 800)
ICON_SIZES=(16 32 48 72 96 128 144 152 180 192 256 384 512)

echo "Generating responsive logos..."

for WIDTH in "${LOGO_WIDTHS[@]}"; do
    convert "$SOURCE" \
        -resize "${WIDTH}x" \
        -strip \
        -interlace PNG \
        "PNG32:${OUTPUT_DIR}/logo/${WIDTH}w.png"

    convert "$SOURCE" \
        -resize "${WIDTH}x" \
        -strip \
        -quality 90 \
        "${OUTPUT_DIR}/logo/${WIDTH}w.webp"
done

echo "Generating square icons..."

for SIZE in "${ICON_SIZES[@]}"; do
    convert "$SOURCE" \
        -resize "${SIZE}x${SIZE}" \
        -background none \
        -gravity center \
        -extent "${SIZE}x${SIZE}" \
        -strip \
        -interlace PNG \
        "PNG32:${OUTPUT_DIR}/icon/${SIZE}.png"

    convert "$SOURCE" \
        -resize "${SIZE}x${SIZE}" \
        -background none \
        -gravity center \
        -extent "${SIZE}x${SIZE}" \
        -strip \
        -quality 90 \
        "${OUTPUT_DIR}/icon/${SIZE}.webp"
done

echo "Generating favicon.ico..."

convert "$SOURCE" \
    -background none \
    -define icon:auto-resize=16,32,48 \
    "${OUTPUT_DIR}/favicon.ico"

echo "Done!"
