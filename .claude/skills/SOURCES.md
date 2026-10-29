# Installed skills

Vendored from upstream so every session (local or cloud) picks them up automatically.
Re-sync by re-copying from the pinned commit's folder (or with `npx skills add <repo>`).

| Skill folder(s) | Upstream | Commit | License |
| --- | --- | --- | --- |
| `taste-skill` (name: `design-taste-frontend`) | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | `12af471` | MIT |
| `impeccable` | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | `5e745ac` | Apache-2.0 |
| `emil-design-eng`, `animate`, `improve-animations`, `review-animations`, `find-animation-opportunities`, `animation-performance`, `animation-vocabulary` | [emilkowalski/skill](https://github.com/emilkowalski/skill) | `a81dbca` | MIT |
| `baseline-ui`, `improve-ui`, `fixing-accessibility`, `fixing-metadata`, `fixing-motion-performance` | [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | `59193a7` | MIT |
| `find-skills` | [vercel-labs/skills](https://github.com/vercel-labs/skills) | `92a9a34` | MIT |

Left out on purpose (not relevant to a web storefront): Emil's iOS/Swift/Expo/mobile-native and
Sonner skills, and ui-skills' canvas/DESIGN.md/CLI-router skills.

Note: `impeccable`'s helper CLI downloads its engine binary from GitHub on first use and verifies it
against `scripts/engine-checksums.txt`. The skill's guidance works without it.
