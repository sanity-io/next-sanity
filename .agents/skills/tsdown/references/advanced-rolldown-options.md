---
name: advanced-rolldown-options
description: Customizing Rolldown inputOptions and outputOptions in tsdown
---

# Customizing Rolldown Options

tsdown exposes Rolldown's `inputOptions` and `outputOptions` for fine-grained control.

## Overriding inputOptions

### Object Syntax

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  inputOptions: {
    cwd: './custom-directory',
  },
})
```

### Function Syntax

Dynamically modify based on format:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  inputOptions(inputOptions, format) {
    inputOptions.cwd = './custom-directory'
    return inputOptions
  },
})
```

## Overriding outputOptions

### Object Syntax

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  outputOptions: {
    legalComments: 'inline',
  },
})
```

### Function Syntax

Format-specific output options:

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  outputOptions(outputOptions, format) {
    if (format === 'esm') {
      outputOptions.legalComments = 'inline'
    }
    return outputOptions
  },
})
```

## Common Use Cases

### Custom Resolve Configuration

```ts
export default defineConfig({
  inputOptions: {
    resolve: {
      mainFields: ['module', 'main'],
      alias: {
        '@': './src',
      },
    },
  },
})
```

### JSX Configuration

```ts
export default defineConfig({
  inputOptions: {
    transform: {
      jsx: 'react', // Classic JSX transformation
    },
  },
})
```

### Legal Comments

```ts
export default defineConfig({
  outputOptions: {
    legalComments: 'inline', // Preserve license headers
  },
})
```

> **Warning:** Understand Rolldown options before overriding. Refer to [Rolldown documentation](https://rolldown.rs/options/input).

<!-- 
Source references:
- https://tsdown.dev/advanced/rolldown-options
-->
