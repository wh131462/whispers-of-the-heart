import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class BlogListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;

  @IsOptional()
  @IsString()
  search?: string;

  // 兼容现有首页使用的排序参数。公开列表目前固定按创建时间倒序，
  // 但严格白名单校验不应因此拒绝旧客户端的请求。
  @IsOptional()
  @IsIn(['createdAt', 'views', 'publishedAt'])
  sort?: 'createdAt' | 'views' | 'publishedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc';

  // 文章列表页使用的新参数名，同样保留在公开列表契约中。
  @IsOptional()
  @IsIn(['createdAt', 'views', 'publishedAt'])
  sortBy?: 'createdAt' | 'views' | 'publishedAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}

export class SearchPostsQueryDto extends BlogListQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  tag?: string;
}

export class CreatePostDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isRepost?: boolean;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceAuthor?: string;

  @IsOptional()
  @IsString()
  sourceName?: string;
}

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isRepost?: boolean;

  @IsOptional()
  @IsString()
  sourceUrl?: string;

  @IsOptional()
  @IsString()
  sourceAuthor?: string;

  @IsOptional()
  @IsString()
  sourceName?: string;
}

export class CreateTagDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  slug?: string; // 可选，后端会自动生成

  @IsOptional()
  @IsString()
  color?: string;
}

export class UpdateTagDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string; // 可选，后端会自动生成

  @IsOptional()
  @IsString()
  color?: string;
}
