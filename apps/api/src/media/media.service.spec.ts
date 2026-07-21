import { ForbiddenException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService resource authorization', () => {
  const prisma = {
    media: { findUnique: jest.fn() },
  };
  const service = new MediaService(prisma as never, {} as never);

  beforeEach(() => jest.clearAllMocks());

  it('rejects access from another non-admin user', async () => {
    prisma.media.findUnique.mockResolvedValue({
      id: 'media-1',
      uploaderId: 'owner-1',
    });

    await expect(
      service.findAccessibleMedia('media-1', 'user-2', false),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows the owner and administrators', async () => {
    const media = { id: 'media-1', uploaderId: 'owner-1' };
    prisma.media.findUnique.mockResolvedValue(media);

    await expect(
      service.findAccessibleMedia('media-1', 'owner-1', false),
    ).resolves.toEqual(media);
    await expect(
      service.findAccessibleMedia('media-1', 'user-2', true),
    ).resolves.toEqual(media);
  });
});
