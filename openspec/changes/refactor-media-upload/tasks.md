## 1. Shared contract and backend compatibility

- [x] 1.1 Add typed media item, filter, upload options, and API helpers to `@whispers/utils`; preserve existing response envelopes and FormData boundary handling.
- [x] 1.2 Normalize `GET /media` filtering around canonical `type` values while accepting legacy `mimeType`; cap pagination inputs safely and keep authorization behavior unchanged.
- [x] 1.3 Add purpose-aware backend MIME and size validation for avatar, logo, cover, editor, and library uploads; return unified errors and clean up rejected files.
- [x] 1.4 Add or update API tests covering canonical/legacy filters, purpose limits, rejected types, successful upload metadata, and batch upload behavior.

## 2. Single Web media picker

- [x] 2.1 Move/adapt the admin media picker into `apps/web/src/components/media/MediaPickerDialog.tsx` with the shared media API, complete media-item callback, filter/search/pagination, upload refresh, Escape close, and responsive preview.
- [x] 2.2 Replace all imports/usages of the old admin picker and `packages/ui` picker with the single Web picker; preserve editor callback adaptation and remove the duplicate picker export after migration.
- [x] 2.3 Add a small reusable upload/selection adapter only if needed by migrated callers; keep toast and field state in page components rather than introducing global media state.

## 3. Migrate server-backed upload entry points

- [x] 3.1 Migrate Profile avatar, Settings logo/owner avatar, FriendLinks avatar, Project Showcase icon/cover, and Post cover to the shared picker/client with purpose-specific validation.
- [x] 3.2 Migrate CommentForm, PostEditPage editor, BlockNoteEditor, and CommentEditor to injected shared upload functions; remove direct upload endpoint/fetch logic while preserving paste and block insertion.
- [x] 3.3 Migrate admin MediaPage single/batch uploads to shared helpers, including audio/video duration metadata and refresh behavior.
- [x] 3.4 Search the repository and remove all remaining page-local `/media/upload` requests, duplicate FormData upload implementations, and obsolete media picker types/imports; explicitly leave P2P/local-only flows untouched.

## 4. Verification and documentation

- [x] 4.1 Run package builds/type checks, Web/API type checks, targeted ESLint, and repository `git diff --check`; fix all new errors.
- [x] 4.2 Run API unit/integration tests and build the API and Web production bundles.
- [x] 4.3 Execute an authenticated multipart upload smoke test plus list/filter/select/delete or reference-protection checks against the local API; if browser automation is available, verify avatar, cover, editor, and picker flows.
- [x] 4.4 Update `.ai/5-MEMORY.md` with the final architecture, validation results, and any unresolved environment limitation; update `.ai/1-PROJECT-CONTEXT.md` only if stable paths or commands changed.
