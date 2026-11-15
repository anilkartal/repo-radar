---
description: Refresh repo data from GitHub and summarize new repos
---

Refresh the site data:

1. Check `.env` has `GITHUB_TOKEN` and `ANTHROPIC_API_KEY` (don't print their values).
2. Run `npm run fetch -- --dry-run` and show per-list counts. Flag any list with fewer than 20 repos or obvious noise in the top 10.
3. If it looks fine, run `npm run fetch` (pass through any args: $ARGUMENTS).
4. Report: new repos added, repos that dropped out, cache hits vs LLM calls, tokens and estimated cost.
5. Spot-check 3 newly generated summaries (one per category) against their READMEs for invented commands. Fix by re-running just that repo with `--resummarize owner/repo` (comma-separate several) if needed.
6. Do not commit; show `git diff --stat public/data` and let me decide.
