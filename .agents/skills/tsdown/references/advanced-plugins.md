---
name: advanced-plugins
description: tsdown plugin ecosystem - Rolldown, Unplugin, Rollup, Vite plugins
---

# Plugins

tsdown uses Rolldown and supports multiple plugin ecosystems.

## Supported Plugin Types

### Rolldown Plugins

Native support for all Rolldown plugins.

### Unplugin

Most `unplugin-*` plugins work seamlessly:

```ts
import UnpluginVue from 'unplugin-vue/rolldown'
import { defineConfig } from 'tsdown'

export default defineConfig({
  plugins: [UnpluginVue({ isProduction: true })],
})
```

### Rollup Plugins

Most Rollup plugins work without modification:

```ts
import SomeRollupPlugin from 'some-rollup-plugin'
import { defineConfig } from 'tsdown'

export default defineConfig({
  plugins: [SomeRollupPlugin() as any], // Cast to any for type compatibility
})
```

> **Note:** Use `// @ts-expect-error` or `as any` for Rollup plugins with type errors.

### Vite Plugins

May work if they don't rely on Vite-specific internals:

```ts
import SomeVitePlugin from 'some-vite-plugin'
import { defineConfig } from 'tsdown'

export default defineConfig({
  plugins: [SomeVitePlugin() as any],
})
```

## Using Plugins

Add to the `plugins` array in config (not available via CLI):

```ts
import SomePlugin from 'some-plugin'
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts'],
  plugins: [SomePlugin()],
})
```

## Writing Custom Plugins

Follow Rolldown's plugin API (similar to Rollup):

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  plugins: [
    {
      name: 'my-plugin',
      transform(code, id) {
        if (id.endsWith('.txt')) {
          return `export default ${JSON.stringify(code)}`
        }
      },
    },
  ],
})
```

See [Rolldown Plugin Development Guide](https://rolldown.rs/guide/plugin-development) for details.

<!-- 
Source references:
- https://tsdown.dev/advanced/plugins
-->
