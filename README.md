# GrayGlyph

GrayGlyph is a privacy-first browser image toolkit with two focused workflows: grayscale conversion and cinematic color grade transfer.

## Features

- Grayscale converter with intensity, contrast, brightness and deterministic film-grain controls
- Live before/after comparison
- Cinematic color grade transfer using 3D LUT mapping
- Image processing and exports handled locally in the browser
- Full-resolution pixel processing runs in Web Workers so exports do not block the interface
- Image validation to avoid oversized files or canvas allocations that can exhaust memory
- PNG, JPEG and WebP exports where supported by the browser

## Run locally

First, from PowerShell on a machine with npm registry access, regenerate the dependency lockfile with the security-patched framework versions and run the checks:

```powershell
.\scripts\upgrade-security.ps1
```

If PowerShell blocks script execution, run the same dependency update manually:

```powershell
npm install "next@15.5.27" "react@19" "react-dom@19" "eslint-config-next@15.5.27" "@netlify/plugin-nextjs@5.16.1"
npm audit fix
npm audit
npm test
npm run lint
npm run build
```

Then start the development server:

```powershell
npm run dev
```

Open `http://localhost:3000`. Do **not** run `npm ci` before the first install/update command; it will create a fresh `package-lock.json`.

## Quality checks

```powershell
npm test
npm run lint
npm run build
```

The image tools accept image files up to 40 MB and a decoded size of 20 megapixels / 12,000 pixels per side. This cap is intentionally conservative because full-resolution canvas processing requires several buffers in memory. An image over the limit is rejected before full-size canvases are allocated.

## Dependency security

The dependency manifest now targets security-patched Next.js 15 and the compatible Netlify adapter. This ZIP intentionally omits the old lockfile because it was created for the previous Next.js 14 / React 18 dependency tree and the build environment could not reach the npm registry to regenerate it safely. On a machine with npm registry access, run the PowerShell setup script first; it creates a fresh lockfile through npm:

```powershell
.\scripts\upgrade-security.ps1
```

See [SECURITY-UPGRADE.md](./SECURITY-UPGRADE.md) for context. Review any remaining `npm audit` results; do not use `npm audit fix --force` blindly.

## Privacy

The tools read selected files using local object URLs and browser canvas APIs. The tool source contains no app API endpoint or upload request for source images. External resources may still be requested by the surrounding browser/app ecosystem; verify the browser Network panel before making deployment-specific privacy guarantees.

## Live demo

https://grayglyph.netlify.app/

## License

MIT
