# Release Handoff Package

This package is for transferring NEXORA DIGITAL to Claude Code with access to the owner's GitHub repository.

## Start here
1. `CLAUDE.md`
2. `docs/CLAUDE_HANDOFF_PROMPT.md`
3. `PROJECT_STATUS.md`
4. `docs/SUPABASE_LIVE_STATE_AND_RECONCILIATION.md`
5. `docs/OWNER_INPUT_CHECKLIST.md`

## Repository
https://github.com/ibnumuklis/nexora-digital.git

## Supabase
- Project: nexora-digital
- Ref: ijkazeukjooauwsvwtiq
- URL: https://ijkazeukjooauwsvwtiq.supabase.co
- Region: Tokyo / ap-northeast-1

## Important
The included source code is a handoff baseline. The GitHub repository may contain later changes and must be inspected first. The remote Supabase database has already been modified and is known to differ from the clean-project migration files included in the repository. Do not blindly apply local migrations to the remote database.

No service-role key, AI API key, Redis URL, GitHub token, or hosting secret is included. Configure secrets privately in local environment files and hosting settings.
