## 1. Protocol and deterministic utilities

- [x] 1.1 Extend P2P chat types with protocol metadata, chunk/progress/finalization/verification payloads, per-peer delivery state, and aggregate message status.
- [x] 1.2 Add UTF-8/Base64 chunking, byte-length validation, missing-chunk lookup, byte assembly, and SHA-256 helpers.

## 2. Reliable transfer state machine

- [x] 2.1 Replace the broadcast-only chat sender with targeted metadata negotiation, bounded send queues, DataChannel-only actions, and bufferedAmount backpressure.
- [x] 2.2 Implement peer-bound receive buffers with strict metadata/chunk validation, idempotent progress responses, final byte/hash verification, and duplicate-delivery prevention.
- [x] 2.3 Resume unfinished per-peer sessions after DataChannel recovery, handle verification timeouts and bounded checksum retries, and clean stale receive buffers.

## 3. Delivery UI and interaction

- [x] 3.1 Update chat state management to create stable local/remote message IDs and apply delivery status updates without dropping message content.
- [x] 3.2 Show sending, delivered, partial, and failed states with peer counts; expose retry for failed targets.
- [x] 3.3 Preserve messages during automatic reconnect, disable sending until a peer DataChannel is ready, and keep explicit leave/reset behavior.

## 4. Verification and project memory

- [x] 4.1 Run hooks and web type checks, targeted ESLint, and production builds; resolve all findings caused by this change.
- [x] 4.2 Update `.ai/5-MEMORY.md` with protocol decisions, affected paths, validation results, and remaining limitations.
