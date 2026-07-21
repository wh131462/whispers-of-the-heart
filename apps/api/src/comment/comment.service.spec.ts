import { BadRequestException } from '@nestjs/common';
import { CommentService } from './comment.service';

describe('CommentService reply integrity', () => {
  const prisma = {
    post: { findFirst: jest.fn() },
    user: { findUnique: jest.fn() },
    comment: { findUnique: jest.fn(), create: jest.fn() },
  };
  const service = new CommentService(
    prisma as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.post.findFirst.mockResolvedValue({
      id: 'post-1',
      author: {},
    });
    prisma.user.findUnique.mockResolvedValue({ username: 'user' });
  });

  it('rejects replies targeting a comment from another post', async () => {
    prisma.comment.findUnique.mockResolvedValue({
      id: 'comment-2',
      postId: 'post-2',
      authorId: 'user-2',
      rootId: null,
      author: {},
    });

    await expect(
      service.create({
        postId: 'post-1',
        parentId: 'comment-2',
        authorId: 'user-1',
        content: 'reply',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.comment.create).not.toHaveBeenCalled();
  });
});
