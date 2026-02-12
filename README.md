# GrayGlyph

Professional privacy-first image editing in the browser.

GrayGlyph is a privacy-first, browser-based image toolkit for creators who need fast results without compromising control. Every operation runs locally in your browser with no uploads, no server-side image processing, and no tracking.

## Features

- Online Grayscale Converter
- Free Photo Editor for Light, Color, Geometry, and Curves
- 3D LUT Color Grade Transfer
- Before/After Comparison
- Non-destructive editing workflow
- 100% client-side processing

## Why GrayGlyph?

- No uploads
- No servers
- No tracking
- Fast and private processing
- Works offline after initial load

## Tech Stack

- React
- Tailwind CSS
- HTML Canvas
- Web Workers
- Pure client-side processing

## How It Works

GrayGlyph uses a canvas-based rendering and processing pipeline with Web Workers for responsive UI and background computation. Color operations use LAB and LUT-based transforms where appropriate, and edits are applied through a non-destructive pipeline so the original image data remains intact while you iterate.

If you are searching for an online grayscale converter, a browser photo editor, a 3D LUT color grading tool, or a privacy-first image editor, GrayGlyph is designed for that exact workflow.

## Demo

Live Demo: https://grayglyph.netlify.app/

## Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push to your branch: `git push origin feature/your-feature`
5. Open a pull request

For major changes, open an issue first to discuss scope and implementation details.

## License

MIT
