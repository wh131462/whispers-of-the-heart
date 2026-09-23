import { BadRequestException } from '@nestjs/common';
import {
  MediaController,
  fileFilter,
  normalizeMimeFilter,
  normalizeUploadPurpose,
  validateUploadedFile,
} from './media.controller';

describe('MediaController upload contract', () => {
  it('normalizes canonical and legacy filters', () => {
    expect(normalizeMimeFilter('image')).toBe('image/');
    expect(normalizeMimeFilter('image/')).toBe('image/');
    expect(normalizeMimeFilter('file')).toBe('file');
    expect(normalizeMimeFilter(undefined)).toBeUndefined();
  });

  it('falls back to the library purpose for unknown values', () => {
    expect(normalizeUploadPurpose('avatar')).toBe('avatar');
    expect(normalizeUploadPurpose('unknown')).toBe('library');
  });

  it('rejects non-image avatar uploads', () => {
    const file = {
      mimetype: 'application/pdf',
      size: 100,
      path: '/definitely-missing-upload',
    } as Express.Multer.File;

    expect(() => validateUploadedFile(file, 'avatar')).toThrow(
      BadRequestException,
    );
  });

  it('rejects oversized cover uploads', () => {
    const file = {
      mimetype: 'image/png',
      size: 11 * 1024 * 1024,
      path: '/definitely-missing-upload',
    } as Express.Multer.File;

    expect(() => validateUploadedFile(file, 'cover')).toThrow(
      BadRequestException,
    );
  });

  it('rejects unsupported MIME types as a bad request', () => {
    let error: unknown;
    fileFilter(
      {} as Parameters<typeof fileFilter>[0],
      { mimetype: 'application/json' } as Express.Multer.File,
      (callbackError) => {
        error = callbackError;
      },
    );

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as Error).message).toBe('不支持的文件类型');
  });

  it('returns an empty unauthenticated media list without querying storage', async () => {
    const service = { findAll: jest.fn() };
    const controller = new MediaController(service as never);
    const result = await controller.findAll(
      1,
      20,
      'image',
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );

    expect(result.data.items).toEqual([]);
    expect(service.findAll).not.toHaveBeenCalled();
  });
});
