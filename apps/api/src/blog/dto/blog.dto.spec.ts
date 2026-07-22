import { ValidationPipe } from '@nestjs/common';
import { BlogListQueryDto } from './blog.dto';

describe('BlogListQueryDto', () => {
  const pipe = new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  });

  it.each([
    { page: '1', limit: '8', sort: 'createdAt', order: 'desc' },
    { page: '1', limit: '12', sortBy: 'createdAt', sortOrder: 'desc' },
  ])('accepts existing public post list parameters', async (query) => {
    await expect(
      pipe.transform(query, {
        type: 'query',
        metatype: BlogListQueryDto,
      }),
    ).resolves.toBeInstanceOf(BlogListQueryDto);
  });
});
