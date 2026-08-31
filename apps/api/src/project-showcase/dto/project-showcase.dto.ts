import { PartialType } from '@nestjs/mapped-types';
import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ShowcaseProjectStatus, ShowcaseProjectType } from '@prisma/client';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  return value.trim() || null;
};

const toOptionalBoolean = ({ value }: TransformFnParams): unknown => {
  if (value === undefined) return undefined;
  if (typeof value === 'boolean') return value;
  return value === 'true';
};

export class CreateShowcaseProjectDto {
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @Transform(trimString)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug 只能包含小写字母、数字和连字符',
  })
  @MaxLength(80)
  slug: string;

  @IsEnum(ShowcaseProjectType)
  type: ShowcaseProjectType;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(240)
  summary: string;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(2048)
  icon?: string | null;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(2048)
  coverImage?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  platforms?: string[];

  @IsOptional()
  @Transform(trimOptionalString)
  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(2048)
  repositoryUrl?: string | null;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(2048)
  websiteUrl?: string | null;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsUrl({ require_protocol: true, require_tld: false })
  @MaxLength(2048)
  downloadUrl?: string | null;

  @IsOptional()
  @IsEnum(ShowcaseProjectStatus)
  status?: ShowcaseProjectStatus;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(-10000)
  @Max(10000)
  sortOrder?: number;

  @IsOptional()
  @Transform(trimOptionalString)
  @IsString()
  distributedAppId?: string | null;
}

export class UpdateShowcaseProjectDto extends PartialType(
  CreateShowcaseProjectDto,
) {}

export class PublicShowcaseProjectQueryDto {
  @IsOptional()
  @Transform(toOptionalBoolean)
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsEnum(ShowcaseProjectType)
  type?: ShowcaseProjectType;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
