# GrayGlyph (Next.js + React + Tailwind)

GrayGlyph is a powerful browser-based image processing suite. It features a dedicated Grayscale Converter and a new Advanced Photo Editor for professional-grade color grading and adjustments.

## Stack
- Next.js (App Router)
- React
- Tailwind CSS
- Canvas API & Web Workers (High-performance client-side processing)

## Features

### Grayscale Converter (/)
- **Luminance-Weighted Conversion**: precise black and white transform (Rec. 709).
- **Non-Destructive**: Original image stays untouched.
- **Real-Time Comparison**: "Before / After" split slider.
- **Grain & Contrast**: Adjustable film grain and tonal contrast.

### Advanced Photo Editor (/editor)
- **Professional Color Grading**: Split toning for Shadows, Midtones, and Highlights.
- **Tone Curves**: Master, Red, Green, and Blue channel curve adjustments.
- **Color Mixer**: HSL adjustments for 8 individual color channels.
- **Smart Presets**: Instant, professional looks (Soft, Noir, Steel, etc.).
- **Detail Tools**: Sharpening and Noise Reduction.
- **Geometry**: Crop, Rotate, Flip, and Straighten.
- **Privacy First**: All processing happens in your browser via Web Workers. No uploads.

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

## Site Structure
- `/` - **Home**: Grayscale Converter.
- `/editor` - **Editor**: Advanced Photo Editor.

## Notes
- Performance is optimized using Web Workers and Transferable Objects for zero-latency UI.
- Full-resolution export for both tools.

[Live Demo](https://grayglyph.netlify.app/)
