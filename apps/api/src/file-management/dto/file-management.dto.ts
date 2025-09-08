import { IsString, IsOptional, IsBoolean, IsArray, IsNotEmpty } from 'class-validator';

export class CreateFolderDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UploadFileDto {
  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

// 用于处理FormData的原始DTO，不进行验证
export class UploadFileRawDto {
  folderId?: any;
  description?: any;
  tags?: any;
  isPublic?: any;
}

export class UpdateFileDto {
  @IsOptional()
  @IsString()
  originalName?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @IsOptional()
  @IsString()
  alt?: string;
}

export class GetFilesQueryDto {
  @IsOptional()
  @IsString()
  folderId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  page?: number;

  @IsOptional()
  limit?: number;
}
