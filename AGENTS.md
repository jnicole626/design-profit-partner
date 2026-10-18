<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Catalog data is private per signed-in owner, accessed through the generated browser Cloud client with RLS; no shared anonymous catalog writes.
- Cloud image rows store durable storage references and resolve private signed URLs on reads, so expiring links are never persisted.
- Keep browser catalog storage read-only for explicit legacy imports; new edits save to Cloud, and successful writes must precede dialog dismissal.
