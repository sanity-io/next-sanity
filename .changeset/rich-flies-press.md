---
'next-sanity': major
---

Removed the deprecated `useDraftModeEnvironment` hook

Use the `useVisualEditingEnvironment` hook instead. The values map as follows:

| `useDraftModeEnvironment` | `useVisualEditingEnvironment` |
| ------------------------- | ----------------------------- |
| `"presentation-iframe"`   | `"presentation-iframe"`       |
| `"presentation-window"`   | `"presentation-window"`       |
| `"live"`                  | `"standalone"`                |
| `"checking"`              | `null`                        |
| `"static"`                | `null`                        |
| `"unknown"`               | `null`                        |
