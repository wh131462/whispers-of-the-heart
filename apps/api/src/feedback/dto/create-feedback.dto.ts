import {
  IsString,
  IsOptional,
  IsIn,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateFeedbackDto {
  @IsString()
  @IsIn(['suggestion', 'bug', 'question', 'other'], {
    message: '反馈类型必须是 suggestion、bug、question 或 other',
  })
  type: string;

  @IsString()
  @MinLength(6, { message: '反馈内容至少需要 6 个字符' })
  @MaxLength(2000, { message: '反馈内容不能超过 2000 个字符' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(100, { message: '联系方式不能超过 100 个字符' })
  contact?: string;
}
