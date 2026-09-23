## ADDED Requirements

### Requirement: Shared media upload contract

The system SHALL expose one typed client contract for listing media, uploading one or multiple files, and returning the created media record. Multipart requests SHALL use the existing authenticated API client and SHALL NOT require callers to set the multipart content type manually.

#### Scenario: Upload a file through the shared client

- **WHEN** an authenticated caller uploads a supported file with an optional purpose
- **THEN** the client sends `POST /media/upload` as multipart form data and returns the media record or a normalized error

#### Scenario: Upload multiple files through the shared client

- **WHEN** an authenticated caller uploads multiple supported files
- **THEN** the client sends the existing batch endpoint and returns the successful media records while preserving per-request error handling

### Requirement: Consistent media filtering

The media list endpoint SHALL accept the canonical `type` filter values `all`, `image`, `video`, `audio`, and `file`, and SHALL continue accepting the legacy `mimeType` parameter during migration. The filter SHALL be applied server-side before pagination.

#### Scenario: Filter image media

- **WHEN** a caller requests `/media?type=image`
- **THEN** only image MIME types are returned and pagination totals describe the filtered set

#### Scenario: Legacy filter compatibility

- **WHEN** a caller sends the legacy `mimeType=image/` parameter
- **THEN** the endpoint applies the same image filter instead of silently ignoring it

### Requirement: Purpose-aware upload validation

The upload endpoint SHALL validate MIME type and file size on the server. `avatar` and `logo` uploads SHALL accept image files up to 5 MB; `cover` uploads SHALL accept image files up to 10 MB; `editor` and `library` uploads SHALL use the existing supported MIME whitelist and 50 MB limit. Missing purpose SHALL retain the library default.

#### Scenario: Reject an oversized avatar

- **WHEN** an avatar upload is larger than 5 MB
- **THEN** the API rejects it with the standard error envelope and does not create a media record

#### Scenario: Reject a non-image avatar

- **WHEN** an avatar upload has a non-image MIME type or an SVG MIME type
- **THEN** the API rejects it before media creation

#### Scenario: Accept an editor image

- **WHEN** an authenticated editor uploads a supported image below 50 MB with purpose `editor`
- **THEN** the API stores the file using the existing storage path and returns a media record

### Requirement: Single responsive media picker

The Web application SHALL provide one media picker for server-backed media selection. It SHALL support type filtering, search, pagination, upload, preview, keyboard-close behavior, and a mobile-safe layout, and SHALL return a complete media item to its caller.

#### Scenario: Select an existing image

- **WHEN** a user opens the picker with image filtering and confirms a listed image
- **THEN** the caller receives that media item and the picker closes

#### Scenario: Upload and select a new file

- **WHEN** a user uploads a file from the picker
- **THEN** the file is uploaded through the shared media client, the list refreshes, and the new media item is selected or made immediately selectable

#### Scenario: Close the picker on mobile

- **WHEN** a user presses Escape or activates the close control on a narrow viewport
- **THEN** the picker closes without changing the caller's current value

### Requirement: All server-backed media entry points use the shared flow

Avatar, logo, owner avatar, post cover, project image, friend-link avatar, comment editor, post editor, and media-library uploads SHALL use the shared media client and the single media picker. P2P transfer and local-only file processing SHALL remain independent.

#### Scenario: Change a profile avatar

- **WHEN** a user chooses or uploads an image in the profile avatar field
- **THEN** the field receives the selected media URL and no page-local multipart upload implementation is used

#### Scenario: Insert editor media

- **WHEN** an editor chooses a media item or pastes an image
- **THEN** the editor uses the injected upload function or picker callback and inserts the returned URL without directly constructing the API endpoint

#### Scenario: Keep local-only tools independent

- **WHEN** a user selects a file in P2P transfer or a Base64/audio/video local tool
- **THEN** the file remains in the local/P2P flow and is not added to the server media library
