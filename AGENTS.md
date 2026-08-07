<!-- BEGIN:nextjs-agent-rules -->
# Local Next.js guidance

This project uses Next.js 16. Read the relevant guide in
`node_modules/next/dist/docs/` before changing code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## AI Team pilot

- This repository is managed as `veli-backoffice` by `../aiteam`.
- Preserve local changes and never stash, reset, commit, push, or deploy unless
  explicitly requested.
- Never read `.env`, credentials, tokens, private keys, or production data.
- Validate changes with `npm run lint` and `npm run build`.
- Implementation may edit this repository. QA must not edit source files, and
  review is read-only.

