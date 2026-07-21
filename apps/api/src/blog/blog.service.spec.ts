import { NotFoundException } from '@nestjs/common';
import { BlogService } from './blog.service';

describe('BlogService public post access', () => {
  const prisma = {
    post: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const mediaUsageService = {};
  const service = new BlogService(prisma as never, mediaUsageService as never);

  beforeEach(() => jest.clearAllMocks());

  it('queries public post details with published=true', async () => {
    prisma.post.findFirst.mockResolvedValue({ id: 'post-1', published: true });
    prisma.post.update.mockResolvedValue({});

    await service.findPublishedPostById('post-1');

    expect(prisma.post.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'post-1', published: true } }),
    );
  });

  it('does not expose a missing or draft post', async () => {
    prisma.post.findFirst.mockResolvedValue(null);

    await expect(
      service.findPublishedPostById('draft-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.post.update).not.toHaveBeenCalled();
  });
});
