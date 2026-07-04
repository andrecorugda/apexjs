<!-- Target `develop` (only hotfix/* targets main). See BRANCHING_STRATEGY.md. -->

## What & why

<!-- What does this change, and why? Link the issue: Closes #123 -->

## Type

- [ ] feat  - [ ] fix  - [ ] docs  - [ ] refactor  - [ ] test  - [ ] chore  - [ ] perf  - [ ] ci

## Checklist

- [ ] One logical change, targeting `develop`
- [ ] `pnpm lint && pnpm typecheck && pnpm build && pnpm test` all pass
- [ ] Tests added/updated for new behaviour or bug fixes
- [ ] Added a changeset (`pnpm changeset`) if a published package changed
- [ ] Conventional Commit title (`feat(scope): …`)
