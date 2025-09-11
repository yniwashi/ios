# Shortcuts Manifest
Dictionary keyed by Shortcut name. Each entry:
- `version`: semantic string (e.g., "3.3")
- `icloud`: stable install URL (will redirect to latest iCloud)
- `notes`: one-paragraph changelog
- `updated`: ISO 8601 UTC (e.g., 2025-09-11T20:30:00Z)

Update process:
1) Bump `version`, `notes`, and `updated`.
2) Commit & push.
