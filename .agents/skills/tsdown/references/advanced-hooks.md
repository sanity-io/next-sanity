---
name: advanced-hooks
description: tsdown build lifecycle hooks
---

# Hooks

Hooks allow extending the build process at specific lifecycle stages.

## Usage

### Object Syntax

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  hooks: {
    'build:done': async () => {
      await doSomething()
    },
  },
})
```

### Function Syntax

```ts
import { defineConfig } from 'tsdown'

export default defineConfig({
  hooks(hooks) {
    hooks.hook('build:prepare', () => {
      console.log('Build starting...')
    })
  },
})
```

## Available Hooks

### `build:prepare`

Invoked before each tsdown build starts. Use for setup tasks.

```ts
hooks: {
  'build:prepare': (context) => {
    console.log('Preparing build...')
  }
}
```

### `build:before`

Invoked before each Rolldown build. Called for each format in dual-format builds.

```ts
hooks: {
  'build:before': (context, format) => {
    console.log(`Building ${format}...`)
  }
}
```

### `build:done`

Invoked after each tsdown build completes. Use for cleanup or post-processing.

```ts
hooks: {
  'build:done': async (context) => {
    await generateDocs()
    console.log('Build complete!')
  }
}
```

## When to Use Hooks vs Plugins

- **Plugins:** For code transformation, asset handling, virtual modules
- **Hooks:** For build lifecycle tasks (setup, cleanup, notifications)

<!-- 
Source references:
- https://tsdown.dev/advanced/hooks
-->
