# GrayGlyph (Next.js + React + Tailwind)

GrayGlyph is now built with Next.js, React, and Tailwind CSS for a smoother, responsive UI while preserving full-resolution grayscale processing in the browser.

## Stack
- Next.js (App Router)
- React
- Tailwind CSS
- Canvas API (client-side image processing)

## Features
- Full-resolution grayscale conversion and export.
- Live before/after split preview with labels.
- Adjustable intensity, contrast, brightness, and film grain.
- Luminance-weighted conversion toggle (Rec. 709).
- Mobile-first responsive layout with adaptive preview sizing.
- Drag-and-drop upload and sample image loader.

## Getting Started
1. Install dependencies:
   `npm install`
2. Start development server:
   `npm run dev`
3. Open:
   `http://localhost:3000`

## Build
- Production build: `npm run build`
- Start production server: `npm run start`

## Project Structure
- `app/layout.js` - metadata and root layout.
- `app/page.js` - React UI + canvas processing logic.
- `app/globals.css` - Tailwind layers and custom styling.
- `public/assets/` - logo and sample image.

## Notes
- Processing happens locally in-browser; no server upload is required.
- Export uses the processed full-resolution output.
