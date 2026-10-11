# GrayGlyph dependency security upgrade

The current package manifest targets Next.js `^15.5.27`, React 19, `eslint-config-next` `^15.5.27`, and `@netlify/plugin-nextjs` `^5.16.1`. Next.js/Netlify security guidance published on September 30, 2026 recommends at least Next.js 15.5.27 (or 16.3.8) and, when the Netlify adapter is manually pinned, `@netlify/plugin-nextjs` 5.16.1.

This ZIP intentionally omits the old lockfile, which was created for Next.js 14 / React 18. The build environment could not resolve `registry.npmjs.org`, so it was not possible to generate a consistent lockfile locally. Run the setup script once on a machine with npm registry access; npm will create a fresh `package-lock.json`. Do **not** run `npm ci` until then, and do **not** edit lockfile metadata by hand.

On a machine with npm registry access, from the project root run this in PowerShell:

```powershell
.\scripts\upgrade-security.ps1
```

The script updates the package manifest and lockfile through npm, audits the resulting dependency tree, then runs the unit tests, lint, and production build. If `npm audit` still reports issues, inspect the advisories and apply the minimum compatible updates. Avoid `npm audit fix --force` without checking the major-version changes.

Sources:
- Next.js 15 upgrade guide: https://nextjs.org/docs/app/guides/upgrading/version-15
- Netlify's September 30, 2026 Next.js security update: https://www.netlify.com/changelog/2026-09-30-nextjs-react-security-vulnerabilities/
