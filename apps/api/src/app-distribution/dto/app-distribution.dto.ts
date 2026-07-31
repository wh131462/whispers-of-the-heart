import { PartialType } from '@nestjs/mapped-types';
import { Transform, TransformFnParams } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const trimString = ({ value }: TransformFnParams): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateDistributedAppDto {
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
}

export class UpdateDistributedAppDto extends PartialType(
  CreateDistributedAppDto,
) {}

export class CreateAppReleaseDto {
  @IsInt()
  @Min(1)
  versionCode: number;

  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  versionName: string;

  @Transform(trimString)
  @IsUrl({
    protocols: ['https'],
    require_protocol: true,
    require_tld: false,
  })
  @MaxLength(2048)
  apkUrl: string;

  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(10000)
  releaseNotes?: string | null;
}

export class UpdateAppReleaseDto extends PartialType(CreateAppReleaseDto) {}
