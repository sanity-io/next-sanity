---
"next-sanity": major
---

feat(visual-editing)!: remove the deprecated `history` prop from `VisualEditingProps`

`<VisualEditing />` from `next-sanity/visual-editing` implements the history adapter for the Next.js App Router itself, and the `history` prop has been typed `never` and marked `@deprecated` for several major versions. The prop is now gone from `VisualEditingProps`.

Before, passing `history` was a type error against `never`:

```tsx
import {VisualEditing} from "next-sanity/visual-editing"

// Type error: `history` is `never`
;<VisualEditing history={myHistoryAdapter} />
```

After, passing `history` is an excess property error, and there is nothing to migrate. Drop the prop if you still spell it out:

```tsx
import {VisualEditing} from "next-sanity/visual-editing"

;<VisualEditing />
```

The runtime behavior is unchanged. `<VisualEditing />` keeps wiring `next/navigation` into the `@sanity/visual-editing` history adapter for you.

This is the only API in `next-sanity` v13 that carried an `@deprecated` marker outside of `next-sanity/studio`, which is removed in a separate change.
