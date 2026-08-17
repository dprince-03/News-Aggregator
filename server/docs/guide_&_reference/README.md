# Guide & Reference

Development-notes-style docs written while building this project - deep
dives on specific topics, not the canonical reference (that's
[`docs/API.md`](../../../docs/API.md), [`docs/ARCHITECTURE.md`](../../../docs/ARCHITECTURE.md),
[`docs/SECURITY.md`](../../../docs/SECURITY.md), and [`docs/SETUP.md`](../../../docs/SETUP.md)
at the repo root - check those first).

| File | Topic |
|---|---|
| `passport_explanation.md` | How the Passport.js strategies (JWT/local/OAuth) work |
| `secrets_integration.md` | The `secrets.utils.js` CLI (`npm run secrets:gen`, etc.) |
| `testing_guide.md` | Background on the Jest test suite structure |
| `db_comparison_doc.md` | Why Sequelize over raw SQL - design rationale |
| `logging_comparison.md` | Winston file logging vs the `ApiLog` DB table |
| `api_stats_usage_guide.md` | How to read `/api/admin/api-logs/stats` |
| `logs_gitkeep_guide.md` | Why `server/logs/.gitkeep` exists |
| `services_setup_guide.md` | Background on the external news API service layer |
| `complete_setup_checklist.md` | An earlier, longer-form setup walkthrough |
| `setup.md` | OAuth provider console setup steps only (Google/Facebook/Twitter) |

`complete_setup_checklist.md` and `setup.md` predate and overlap with
`docs/SETUP.md` at the repo root - if you're setting up the project for the
first time, start there instead. These haven't been individually
fact-checked against the current codebase in this pass (see `docs/TODO.md`)
- treat them as historical context, and prefer the root `docs/` files or the
code itself when they disagree.
