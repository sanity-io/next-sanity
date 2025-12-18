type VisualEditingEnvironment =
  | null
  | 'unknown'
  | 'presentation-iframe'
  | 'presentation-window'
  | 'standalone'

export function useVisualEditingEnvironment(): VisualEditingEnvironment {
  // oxlint-disable-next-line no-console
  console.log('TODO: Implement useVisualEditingEnvironment')

  return null
}
