import { IsOptional, IsString, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinksDto {
  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  twitter?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;
}

class SeoSettingsDto {
  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @IsString()
  keywords?: string;
}

class OssConfigDto {
  @IsOptional()
  @IsString()
  provider?: 'local' | 'aliyun' | 'aws' | 'qiniu';

  @IsOptional()
  @IsString()
  accessKeyId?: string;

  @IsOptional()
  @IsString()
  accessKeySecret?: string;

  @IsOptional()
  @IsString()
  bucket?: string;

  @IsOptional()
  @IsString()
  region?: string;

  @IsOptional()
  @IsString()
  endpoint?: string;

  @IsOptional()
  @IsString()
  cdnDomain?: string;
}

export class UpdateSiteConfigDto {
  @IsOptional()
  @IsString()
  siteName?: string;

  @IsOptional()
  @IsString()
  siteDescription?: string;

  @IsOptional()
  @IsString()
  siteLogo?: string;

  @IsOptional()
  @IsString()
  siteIcon?: string;

  @IsOptional()
  @IsString()
  aboutMe?: string;

  @IsOptional()
  @IsString()
  contactEmail?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SeoSettingsDto)
  seoSettings?: SeoSettingsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => OssConfigDto)
  ossConfig?: OssConfigDto;
}
