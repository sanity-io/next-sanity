---
name: core-cli
description: tsdown command-line interface and options
---

# tsdown CLI

## CLI Flag Patterns

- `--foo` sets `foo: true`
- `--no-foo` sets `foo: false`
- `--foo.bar` sets `foo: { bar: true }`
- `--format esm --format cjs` sets `format: ['esm', 'cjs']`

## Common Commands

```bash
# Build with default settings
tsdown

# Build specific entry files
tsdown src/index.ts src/util.ts

# Build with options
tsdown --format esm --dts --exports

# Watch mode
tsdown --watch
tsdown -w

# Custom output directory
tsdown --out-dir ./build
tsdown -d ./build
```

## Key Options

```bash
# Output format
--format esm|cjs|iife|umd

# Declaration files
--dts

# Target environment
--target es2020
--target node20
--no-target  # Disable transformations

# Platform
--platform node|browser|neutral

# Minification
--minify

# Source maps
--sourcemap

# Tree shaking
--treeshake
--no-treeshake

# Clean output directory (enabled by default)
--clean
--no-clean

# External modules
--external lodash
--external "@my-scope/*"

# Watch mode
--watch [path]
-w [path]

# Log level
--log-level silent|error|warn|info
```

## Environment Variables

```bash
# Define compile-time variables
tsdown --env.NODE_ENV=production

# Load from .env file
tsdown --env-file .env.production

# Custom prefix (default: TSDOWN_)
tsdown --env-file .env --env-prefix APP_
```

## Post-Build Commands

```bash
# Run command after successful build
tsdown --on-success "echo Build finished!"
```

## Copy Static Assets

```bash
# Copy directory to output
tsdown --copy public
```

## Package Exports

```bash
# Auto-generate exports in package.json
tsdown --exports
```

<!-- 
Source references:
- https://tsdown.dev/reference/cli
-->
