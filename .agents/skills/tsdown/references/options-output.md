---
name: options-output
description: tsdown output format, directory, target, and platform configuration
---

# Output Configuration

## Output Format

Default is ESM. Available formats:

- `esm` - ECMAScript Modules (modern, recommended)
- `cjs` - CommonJS (Node.js legacy)
- `iife` - Immediately Invoked Function Expression (browsers)
- `umd` - Universal Module Definition

```bash
tsdown --format esm           # Default
tsdown --format esm --format cjs  # Multiple formats
```

### Format-Specific Config

```ts
export default defineConfig({
  entry: ['./src/index.js'],
  format: {
    esm: {
      target: ['es2015'],
    },
    cjs: {
      target: ['node20'],
    },
  },
})
```

## Output Directory

Default is `dist`:

```bash
tsdown -d ./build
tsdown --out-dir ./custom-output
```

## Target

Controls JavaScript/CSS syntax downleveling. **Does not include polyfills**.

```bash
tsdown --target es2020
tsdown --target chrome100
tsdown --target node20
tsdown --no-target  # Preserve modern syntax
```

**Default behavior:** Reads `engines.node` from `package.json`:

```json
{
  "engines": {
    "node": ">=18.0.0"
  }
}
```

Results in `target: 'node18.0.0'`.

### CSS Targeting

Requires `unplugin-lightningcss`:

```bash
pnpm add -D unplugin-lightningcss
```

Then set browser targets to enable CSS downleveling.

## Platform

```bash
tsdown --platform node     # Default, Node.js built-ins resolved
tsdown --platform browser  # Web browsers
tsdown --platform neutral  # Platform-agnostic
```

### Module Resolution by Platform

- **node:** `mainFields: ['main', 'module']`
- **browser:** `mainFields: ['browser', 'module', 'main']`
- **neutral:** `mainFields: []` (relies on `exports` field only)

For `neutral` platform with legacy packages:

```ts
export default defineConfig({
  platform: 'neutral',
  inputOptions: {
    resolve: {
      mainFields: ['module', 'main'],
    },
  },
})
```

> **Note:** For CJS format, platform is always `'node'`.

## Cleaning

Output directory is cleaned by default:

```bash
tsdown --no-clean  # Keep existing files
```

<!-- 
Source references:
- https://tsdown.dev/options/output-format
- https://tsdown.dev/options/output-directory
- https://tsdown.dev/options/target
- https://tsdown.dev/options/platform
- https://tsdown.dev/options/cleaning
-->
