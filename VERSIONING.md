# Versioning

When bumping the version, update all four files — they must stay in sync:

| File                        | Field                                       |
| --------------------------- | ------------------------------------------- |
| `src-tauri/tauri.conf.json` | `"version"`                                 |
| `src-tauri/Cargo.toml`      | `version = "..."` (line 3)                  |
| `package.json`              | `"version"`                                 |
| `src/lib/patchnotes.ts`     | Add a new entry at the top of `PATCH_NOTES` |

`Cargo.lock` updates automatically on the next build — no manual edit needed.

## Release flow

```bash
git add -A && git commit -m "chore: bump version to X.Y.Z"
git tag vX.Y.Z
git push && git push origin vX.Y.Z
```

The CI pipeline picks up the tag and handles build, sign, and `latest.json`.
See `RELEASING.md` for full details.
