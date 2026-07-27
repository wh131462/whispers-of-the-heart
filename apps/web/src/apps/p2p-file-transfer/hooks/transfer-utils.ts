const HEX_RADIX = 16;

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

export function chunkArrayBuffer(
  arrayBuffer: ArrayBuffer,
  chunkSize: number
): string[] {
  if (!Number.isInteger(chunkSize) || chunkSize <= 0) {
    throw new RangeError('chunkSize must be a positive integer');
  }
  const bytes = new Uint8Array(arrayBuffer);
  const totalChunks = Math.max(1, Math.ceil(bytes.byteLength / chunkSize));
  const chunks: string[] = [];

  for (let index = 0; index < totalChunks; index += 1) {
    const start = index * chunkSize;
    const end = Math.min(start + chunkSize, bytes.byteLength);
    chunks.push(bytesToBase64(bytes.subarray(start, end)));
  }

  return chunks;
}

export async function sha256Hex(data: ArrayBuffer | Blob): Promise<string> {
  const buffer = data instanceof Blob ? await data.arrayBuffer() : data;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest), byte =>
    byte.toString(HEX_RADIX).padStart(2, '0')
  ).join('');
}

export function getChunkByteLength(
  chunkIndex: number,
  totalSize: number,
  chunkSize: number
): number {
  if (totalSize === 0) return 0;
  const start = chunkIndex * chunkSize;
  return Math.min(chunkSize, Math.max(0, totalSize - start));
}
