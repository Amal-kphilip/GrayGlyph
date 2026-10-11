$ErrorActionPreference = "Stop"

Write-Host "Upgrading GrayGlyph to security-patched Next.js and Netlify adapter versions..." -ForegroundColor Cyan
npm install "next@15.5.27" "react@19" "react-dom@19" "eslint-config-next@15.5.27" "@netlify/plugin-nextjs@5.16.1"
if ($LASTEXITCODE -ne 0) {
  throw "Dependency upgrade failed. Check network access and the npm output above."
}

Write-Host "Applying safe, semver-compatible audit fixes..." -ForegroundColor Cyan
npm audit fix
if ($LASTEXITCODE -ne 0) {
  Write-Warning "Some vulnerabilities cannot be fixed without a potentially breaking upgrade. They will be listed by the next audit."
}

Write-Host "Re-checking the dependency tree..." -ForegroundColor Cyan
npm audit
if ($LASTEXITCODE -ne 0) {
  Write-Warning "npm audit still reports vulnerabilities. Review each advisory; do not use npm audit fix --force blindly."
}

Write-Host "Running tests, lint, and production build..." -ForegroundColor Cyan
npm test
if ($LASTEXITCODE -ne 0) { throw "Automated tests failed." }
npm run lint
if ($LASTEXITCODE -ne 0) { throw "Lint failed after dependency upgrade." }
npm run build
if ($LASTEXITCODE -ne 0) { throw "Production build failed after dependency upgrade." }

Write-Host "Security upgrade and validation commands completed." -ForegroundColor Green
