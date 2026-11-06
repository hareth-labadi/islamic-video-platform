# Admin panel (front end)

The sheikh's back office at `/ar/admin` and `/fr/admin`: videos, series and playlists, TikTok shorts,
the questions inbox (text, voice and video answers), the team and the sheikh's profile.
Feature list for the team, in Darija: [`docs/specs/admin-features.md`](../../../docs/specs/admin-features.md).
Backend contract: [`docs/specs/admin-api.md`](../../../docs/specs/admin-api.md).

## Run it

```bash
npm run dev          # http://localhost:3000/ar/admin — demo data, pick a demo account, any 6 digits
npm test             # unit, API and screen tests (Vitest + Testing Library)
npm run test:watch   # same, re-run on save
```

Without `NEXT_PUBLIC_API_URL` the panel runs on the demo backend in the browser. Set it
(`NEXT_PUBLIC_API_URL=https://api.example.org`) and every call goes to `{API}/admin/…` instead; nothing else changes.

## Layout

```
src/app/(admin)/[locale]/admin/   Routes only: one page.tsx per screen, its own root layout (no public header/footer)
src/features/admin/
  api/
    types.ts         DTOs — same names as src/lib/types.ts, plus admin-only fields
    contract.ts      AdminApi: every call the panel makes
    http.ts          AdminApi over HTTP (the real backend)
    mock/            AdminApi in the browser: one file per area, same rules as the backend
      guards.ts        signed in? has this sheikh? role allows it?
      series-sync.ts   episode order ⇄ video.seriesId / episode
      import-worker.ts the TikTok import, simulated
      seed.ts          demo data; store.ts keeps it in sessionStorage
    client.ts        picks http or mock; screens import `api` from here
    hooks.ts         useQuery / useAction / useNow (no data library)
  rules.ts           limits shared by forms, demo backend and spec
  permissions.ts     role table: owner / admin / editor
  routes.ts          every admin URL
  i18n/              ar.ts (reference), fr.ts (typed against it)
  lib/               pure helpers: dates, durations, YouTube/TikTok/Telegram links
  ui/                admin kit on top of src/components/ui: fields, dialogs, toasts, upload, drag list, voice recorder
  shell/             signed-in frame: sidebar, sheikh switcher, account menu
  screens/<area>/    one folder per screen; form logic in <area>Form.ts (pure, tested)
  test/              test helpers: demo data reset, Next router stand-ins, render inside the shell
```

## Conventions

- **Screens never call `fetch`.** They use `api` from `api/client.ts` and the hooks in `api/hooks.ts`.
  A write goes through `useAction`, which refreshes every open query afterwards.
- **Rules live once.** A number in a form (max length, import limit) comes from `rules.ts`; a "can they?" from
  `permissions.ts`. The UI only hides what the server refuses anyway.
- **Form logic is pure.** `toForm` / `validate` / `toInput` sit next to the screen in `<area>Form.ts` and have their own tests.
- **Strings** are in `i18n/ar.ts`; `fr.ts` must have the same keys (type error otherwise, and `i18n.test.ts` checks
  parameters and leftovers). No shared site file is changed by the panel.
- **Design** reuses the site's tokens (`src/app/globals.css`) and components (`src/components/ui`): ink, paper, colour
  blocks, outlined numerals, pill buttons. The only extra colour is the error red `DANGER` in `ui/form.tsx`.

## Tests

| Where | What it proves |
| --- | --- |
| `api/http.test.ts` | each call's method, path, query and body; error mapping; uploads; **the spec and the client list the same endpoints** |
| `api/mock/*.test.ts` | the business rules, one per test: permissions per role, episode numbering, import states and retry, Q&A consent, team rules |
| `screens/**/*.test.tsx` | real screens on demo data: sign-in, answering (sheikh only), redacting a question, video editor validation, invitations, import, read-only profile |
| `ui/*.test.tsx`, `lib/*.test.ts`, `*Form.test.ts` | the kit's accessibility (labels, errors, focus, keyboard reorder) and the pure helpers |

Screen tests mock `next/navigation` and `next/link` with `test/next.tsx` (two `vi.mock` lines at the top of the file)
and render through `renderPanel(<Screen />, { as: accounts.editor, locale: "fr", path })`.
