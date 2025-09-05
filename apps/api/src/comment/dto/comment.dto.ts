import { IsString, IsOptional, IsEmail, IsBoolean, IsNotEmpty, MaxLength, IsArray, ArrayMinSize } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @IsNotEmpty()
  authorId: string;

  @IsString()
  @IsNotEmpty()
  postId: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateCommentDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  content?: string;

  @IsBoolean()
  @IsOptional()
  isApproved?: boolean;
}

export class BatchCommentDto {
  @IsArray()
  @ArrayMinSize(1, { message: '至少需要选择一个评论' })
  @IsString({ each: true, message: '每个评论ID必须是字符串' })
  commentIds: string[];
}
