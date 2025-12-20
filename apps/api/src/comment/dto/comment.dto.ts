import { IsString, IsOptional, IsBoolean, IsNotEmpty, MaxLength, IsArray, ArrayMinSize, IsIn } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  content: string;

  @IsString()
  @IsOptional()
  authorId?: string;

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

// 用户编辑评论 DTO
export class UserEditCommentDto {
  @IsString()
  @IsNotEmpty({ message: '评论内容不能为空' })
  @MaxLength(1000, { message: '评论内容不能超过1000字' })
  content: string;
}

// 举报评论 DTO
export class ReportCommentDto {
  @IsString()
  @IsNotEmpty({ message: '请选择举报原因' })
  @IsIn(['spam', 'abuse', 'harassment', 'other'], { message: '无效的举报原因' })
  reason: string;

  @IsString()
  @IsOptional()
  @MaxLength(500, { message: '详细说明不能超过500字' })
  details?: string;
}

// 处理举报 DTO
export class ResolveReportDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['resolve', 'dismiss'], { message: '操作必须是 resolve 或 dismiss' })
  action: 'resolve' | 'dismiss';

  @IsBoolean()
  @IsOptional()
  deleteComment?: boolean;
}
