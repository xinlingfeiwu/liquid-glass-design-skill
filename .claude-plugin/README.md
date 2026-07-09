# Claude Code Plugin Scaffold

This directory contains metadata for wrapping this repository as a Claude Code compatible plugin distribution.

Use the release `.skill` packages for direct upload flows:

```bash
npm run package:skill
```

The actual skill source lives in `../skills/liquid-glass-design`. Plugin manifests must point at `./skills/` from the repository root; do not use symlinks or `../` paths in distributable plugin metadata.

Validate and install from a local clone:

```bash
claude plugin validate --strict .
claude plugin validate --strict .claude-plugin/marketplace.json
claude plugin marketplace add "$(pwd)" --scope user
claude plugin install liquid-glass-design@liquid-glass-design-skill
```

CI uses `npm run plugin:claude:install-smoke`, which runs the same marketplace add/install/list flow in an isolated Claude home through `npx @anthropic-ai/claude-code`.
