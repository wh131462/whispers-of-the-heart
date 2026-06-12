import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class KnowledgeSearchDto {
  @ApiProperty({ description: '检索查询关键词', example: 'Prisma 索引优化' })
  @IsString()
  @MinLength(1)
  query: string;

  @ApiProperty({
    description: '返回条数，默认 5，最大 10',
    required: false,
    example: 5,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10)
  limit?: number;
}
