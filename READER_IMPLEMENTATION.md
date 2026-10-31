# Variant X reader implementation

Article routes use `ReaderLayout` outside the application sidebar and global mobile navigation. `ArticleDetailPage` owns the article query and article mutations. `ReaderSurface`, `ReaderNotebook`, `ReaderMarkdown`, `useReaderAppearance`, and `useReaderProgress` provide the supporting workflows.

The prose column remains centered and never changes tracks when a panel opens. Contents docks only when both side gutters can accommodate its 230px width; Notebook uses the same calculation with 350px. Otherwise the established focus trap and scroll lock are used, with an inert application background. Notebook stays mounted while closed to retain drafts, AI responses and flashcard state.

Heading IDs and the outline use the same Markdown AST traversal. Unicode and duplicate headings, formatted headings, setext headings and all six depths are supported. Fenced code is excluded. Passage anchors contain rendered-text offsets, quote context and an optional article revision. Ambiguous legacy quotes do not resolve to an arbitrary occurrence. CSS Custom Highlights renders saved passages without modifying article HTML; Notebook remains the fallback for browsers without that API.

Private drafts are stored in session storage under article and account keys. They survive panel/tab changes and navigation in that browser session. A sign-in intent explicitly transfers the guest draft/quotation for that article; changing accounts does not expose another account's notes, highlights or learning sets. Saving succeeds only after the API mutation succeeds.

Reading appearance uses existing account settings and theme state, with device storage for guests and failed account synchronization. Line spacing extends the existing appearance schema. Reading Focus is independent of writing focus. Progress stores a passage anchor, body-relative position and legacy pixel position; writes are throttled, serialized and timestamped to reject older requests. Hashes take precedence over remembered history positions, which take precedence over explicit Continue reading. Ordinary visits offer Resume.

## Backend compatibility

No mandatory database migration or backfill is required. New fields are optional:

- Highlight: prefix, suffix and revision (existing offset fields retained).
- ReadingProgress: anchor, bodyPosition and clientUpdatedAt (legacy pixel position retained).
- User.appearanceSettings: lineSpacing, default 1.7.

Reader inputs are validated. Article visibility and highlight ownership are checked before note creation. Note updates cannot change ownership, article or linked highlight. Removing a highlight retains its private notes. Saving a flashcard set checks article access. Deleted/unpublished articles no longer receive public view increments.

## Verification

Run `npm run test:reader` in client and server, then their existing build/typecheck scripts. Tests use Node's built-in runner and installed tooling; controller tests stub model boundaries and do not contact a database. They cover heading generation, repeated/revision-aware passages, panel transitions, draft isolation, restoration precedence, progress bounds, flashcard validation, forged ownership, unpublished articles and stale progress races.

`cd client; node tests/reader-preview.mjs` starts an isolated local fixture preview on port 5174. It uses a separate test API path and does not read or write production accounts. Fixture article paths are `/articles/reader-fixture/variant-x-fixture`, `/articles/reader-fixture/short` and `/articles/reader-fixture/failed-cover`.

Visual/mobile/keyboard/assistive-technology checks and real MongoDB/AI-provider integration are not represented by these unit tests. The available browser failed to reach the local preview and native-app discovery timed out in this environment. Neither package currently provides a lint script.
