# Localization, BS dates, and relative times

## Sources of truth

| Concern | Source |
|---|---|
| Language | `user.preferences.language` (`en`, `ne`) |
| Calendar mode | `user.preferences.calendarMode` (`auto`, `bs`, `ad`, `both`) |
| Workspace timezone | Server `REPORTING_TIMEZONE` via `GET /api/config` |
| Timestamps | UTC instants in MongoDB and API responses |

The client never stores a timestamps conversion. It converts UTC instants to the
workspace timezone for display only.

## Server contract

- `GET /api/config` → `{ reportingTimeZone }` (public).
- `GET /api/auth/me` → `PublicUser` including `preferences`.
- `PATCH /api/auth/me/preferences` → updates the current user's language and
  calendar mode. Available to every authenticated role; it deliberately does
  **not** live under `/users`, which is restricted to owners and pharmacists.
- Missing preference fields are normalized to `{ language: "en",
  calendarMode: "auto" }` in `toPublicUser`, so legacy documents need no
  migration.

## Client rules

### Calendar modes

| Mode | Behaviour |
|---|---|
| `auto` | BS primary + AD secondary when the workspace timezone is Nepal; AD otherwise |
| `bs` | BS primary with AD secondary |
| `ad` | AD only |
| `both` | BS and AD together |

`auto` is decided by the **workspace** timezone, not the device timezone. A user
travelling abroad still sees the pharmacy's dates.

### Date-only vs instant

- Date-only strings (`YYYY-MM-DD`) are formatted without constructing a
  UTC-midnight `Date`. This avoids off-by-one-day bugs in negative-offset
  timezones.
- Instants (`createdAt`, `lastLogin`, `paidAt`, …) are formatted in the
  workspace timezone with `Intl.DateTimeFormat`.

### Components and helpers

- `useDateFormat()` — bound formatters for components.
- `<AppDate>` — BS/AD date display with `time` semantics and an exact tooltip.
- `<RelativeTime>` — “2 hours ago” display with the exact BS/AD timestamp in
  `title` and `aria-label`.
- `formatDate` / `formatDateTime` in `client/src/lib/format.ts` remain for legacy
  call sites and use the active configuration.

### Relative time policy

- Use relative time for activity streams, notifications, sessions, last-login,
  movement timestamps, stocktake list timestamps, generated reorder timestamps,
  and system-health job timestamps.
- Keep supplier ledgers, payment dates, audit-primary dates, and expiry dates
  absolute. Audit rows may show relative text as secondary context.
- Thresholds: under 45 seconds → “just now”; minutes; hours; yesterday; 2–7 days;
  older than 7 days → absolute date.
- Calendar-day differences use the workspace timezone.
- One `NowProvider` clock updates relative labels every 60 seconds and on tab
  focus/visibility, not one timer per row.

### Translation

- Resources live in `client/src/lib/i18n/locales/en.json` and `ne.json`.
- Keys follow feature namespaces (`nav.*`, `topbar.*`, `preferences.*`, …).
- Missing keys fall back to English.
- The selected language is persisted on the server and mirrored to
  `localStorage` only as a first-paint hint.
- Add the Noto Sans Devanagari fallback (already loaded in `index.css`) before
  shipping a new Nepali screen.

## Adding a new date field

1. Decide whether it is a date-only value or an instant.
2. For tables/details use `<AppDate value={...} kind="date-only|instant" />`.
3. For activity-like timestamps use `<RelativeTime value={...} />`.
4. Add a test with an explicit timezone; never rely on the test machine's locale.

## Adding a new language

1. Add the code to the server `LANGUAGES` constant and the client
   `LANGUAGES` constant.
2. Add a resource file and register it in `client/src/lib/i18n/index.ts`.
3. Add the option to `LanguageSwitcher` and `PreferencesPage`.
4. Verify fonts, plural forms, and long-label layout.
