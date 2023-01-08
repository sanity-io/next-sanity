declare module '*.png' {
  const value: `data:image/png;base64,${string}` | {default: `data:image/png;base64,${string}`}
  export default value
}

declare module '*.ico' {
  const value:
    | `data:image/vnd.microsoft.icon;base64,${string}`
    | {default: `data:image/vnd.microsoft.icon;base64,${string}`}
  export default value
}

declare module '*.svg' {
  const value: `data:image/svg+xml,${string}` | {default: `data:image/svg+xml,${string}`}
  export default value
}
