## 1. Protocol types and integrity helpers

- [x] 1.1 Extend file transfer types with protocol version, checksum, chunk size, finalize/progress/verification payloads, paused/verifying statuses, and explicit error metadata.
- [x] 1.2 Add browser-safe SHA-256 and Base64/chunk utility functions with exact byte-size handling, including zero-byte files.

## 2. Reliable transfer state machine

- [x] 2.1 Replace last-chunk completion with receiver checkpoint ACKs, idempotent sparse chunk storage, and periodic progress synchronization.
- [x] 2.2 Implement finalize/verification handshake; only expose a Blob and completed state after size and SHA-256 validation.
- [x] 2.3 Implement bounded checksum retry, rejection/timeout errors, target-peer binding, and queue cleanup without losing resumable sessions.
- [x] 2.4 Add DataChannel backpressure waits and resume sending from the receiver-reported first missing chunk.

## 3. Reconnection and UI

- [x] 3.1 Make `useTrysteroRoom` rebuild PeerConnections/DataChannels for all returned room members on initial connect and Socket.IO reconnect.
- [x] 3.2 Pause active transfers while the target is unavailable, re-send metadata on peer recovery, and resume from the persisted in-memory checkpoint.
- [x] 3.3 Update transfer list labels/progress/error rendering for paused and verifying states and make completion messaging reflect receiver verification.

## 4. Verification and project memory

- [x] 4.1 Add focused protocol/state tests or deterministic test helpers for missing chunks, duplicate chunks, checksum mismatch, and reconnect resume.
- [x] 4.2 Run web/hooks type-check, lint, build, and relevant tests; fix regressions.
- [x] 4.3 Update `.ai/5-MEMORY.md` with the protocol decision and verification results (and update other `.ai/` docs only if stable structure/stack changes).
