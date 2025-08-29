# Sanity Live Deep Dive

## Constraints

- no `cacheTag` based on fetch response yet (causes double fetching).
- `syncTags` change based on data fidelity (a post without an author reference have different tags than a post with an author reference when `author->`).

## Why the default experience uses a Server Function

## Ways to customize it

## Future plans
