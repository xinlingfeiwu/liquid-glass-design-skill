# Claude Code Plugin Scaffold

This directory contains metadata for wrapping this repository as a Claude Code compatible plugin distribution.

Use the release `.skill` packages for direct upload flows:

```bash
npm run package:skill
```

The actual skill source lives in `../skills/liquid-glass-design`. Plugin manifests must point at `./skills/` from the repository root; do not use symlinks or `../` paths in distributable plugin metadata.
