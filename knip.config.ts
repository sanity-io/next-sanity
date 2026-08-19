import type {KnipConfig} from 'knip'

const config: KnipConfig = {
  workspaces: {
    '.': {
      ignoreBinaries: [
        // From @sanity/ailf (devDep of @repo/ailf); invoked via `pnpm exec ailf` in the ailf-eval workflow
        'ailf',
      ],
    },
    'packages/ailf': {
      entry: ['.ailf/ailf.config.ts', '.ailf/tasks/*.task.ts'],
      project: ['.ailf/**/*.ts'],
      // Reference solutions are graded artefacts with multi-file content, not compiled code
      ignore: ['.ailf/tasks/*.reference.tsx'],
      ignoreDependencies: [
        // Internal workspace config package used via tsconfig extends
        '@repo/typescript-config',
      ],
    },
    'packages/next-sanity': {
      entry: ['src/**/index.ts', 'src/**/index.default.ts'],
      project: ['src/**/*.{ts,tsx}'],
      ignoreDependencies: [
        // Peer dependencies provided by consumers
        'styled-components',
      ],
    },
    'packages/sanity-config': {
      project: ['src/**/*.{ts,tsx}'],
      ignoreDependencies: [
        // Peer dependency listed as devDependency for type resolution
        'styled-components',
        // Internal workspace config package used via tsconfig extends
        '@repo/typescript-config',
      ],
    },
    'packages/typescript-config': {
      entry: ['base.json'],
    },
    'packages/typedoc': {
      ignoreDependencies: [
        // Used by the typedoc CLI, pinned to 6.x since typedoc doesn't support TypeScript 7 yet
        'typescript',
      ],
    },
    'apps/mvp': {
      entry: ['app/**/*.{ts,tsx}'],
      project: ['**/*.{ts,tsx}'],
      ignore: ['sanity.types.ts'],
      ignoreDependencies: [
        // Sanity Studio peer deps that are used at runtime
        '@sanity/vision',
        'styled-components',
        // CSS framework referenced via PostCSS config
        'tailwindcss',
        // Internal workspace config package used via tsconfig extends
        '@repo/typescript-config',
      ],
      paths: {'@/*': ['./*']},
    },
    'apps/static': {
      entry: ['app/**/*.{ts,tsx}'],
      project: ['**/*.{ts,tsx}'],
      ignore: ['sanity.types.ts'],
      ignoreDependencies: [
        // Sanity Studio peer deps that are used at runtime
        '@sanity/vision',
        'styled-components',
        // CSS framework referenced via PostCSS config
        'tailwindcss',
        // Internal workspace config package used via tsconfig extends
        '@repo/typescript-config',
      ],
      paths: {'@/*': ['./*']},
    },
  },
  // Ignore fixture directories
  ignore: ['fixtures/**'],
}

export default config
