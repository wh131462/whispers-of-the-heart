const HEX_RADIX = 16;

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const blockSize = 0x8000;

  for (let offset = 0; offset < bytes.length; offset += blockSize) {
    const block = bytes.subarray(
      offset,
      Math.min(offset + blockSize, bytes.length)
    );
    binary += String.fromCharCode(...block);
  }

  return btoa(binary);
}

export function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

export function chunkUtf8Content(
  content: string,
  chunkSize: number
): { bytes: Uint8Array; chunks: string[] } {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError('chunkSize must be a positive integer');
  }

  const bytes = new TextEncoder().encode(content);
  const totalChunks = Math.max(1, Math.ceil(bytes.byteLength / chunkSize));
  const chunks: string[] = [];

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, bytes.byteLength);
    chunks.push(bytesToBase64(bytes.subarray(start, end)));
  }

  return { bytes, chunks };
}

export function findFirstMissingChunk(
  chunks: ReadonlyArray<string | undefined>,
  totalChunks: number
): number {
  for (let index = 0; index < totalChunks; index += 1) {
    if (chunks[index] === undefined) return index;
  }
  return totalChunks;
}

export function countReceivedChunks(
  chunks: ReadonlyArray<string | undefined>
): number {
  return chunks.reduce(
    (count, chunk) => count + (chunk !== undefined ? 1 : 0),
    0
  );
}

export function getChunkByteLength(
  chunkIndex: number,
  totalBytes: number,
  chunkSize: number
): number {
  if (totalBytes === 0) return 0;
  const start = chunkIndex * chunkSize;
  return Math.min(chunkSize, Math.max(0, totalBytes - start));
}

export function assembleChunks(
  chunks: ReadonlyArray<string | undefined>,
  totalBytes: number
): Uint8Array {
  const result = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    if (chunk === undefined) throw new Error('Message chunk is missing');
    const bytes = base64ToBytes(chunk);
    if (offset + bytes.byteLength > result.byteLength) {
      throw new Error('Message chunks exceed declared byte length');
    }
    result.set(bytes, offset);
    offset += bytes.byteLength;
  }

  if (offset !== totalBytes) {
    throw new Error('Message byte length does not match metadata');
  }
  return result;
}

export function decodeUtf8(bytes: Uint8Array): string {
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
}

export async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const data = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(HEX_RADIX).padStart(2, '0')
  ).join('');
}
