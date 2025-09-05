import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateSiteConfigDto {
  @IsString()
  siteName: string;

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
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };

  @IsOptional()
  @IsObject()
  seoSettings?: {
    title?: string;
    description?: string;
    keywords?: string;
  };

  @IsOptional()
  @IsObject()
  ossConfig?: {
    provider?: string;
    endpoint?: string;
    accessKey?: string;
    secretKey?: string;
    bucketName?: string;
    cdnDomain?: string;
  };
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
  socialLinks?: {
    github?: string;
    twitter?: string;
    linkedin?: string;
  };

  @IsOptional()
  @IsObject()
  seoSettings?: {
    title?: string;
    description?: string;
    keywords?: string;
  };

  @IsOptional()
  @IsObject()
  ossConfig?: {
    provider?: string;
    endpoint?: string;
    accessKey?: string;
    secretKey?: string;
    bucketName?: string;
    cdnDomain?: string;
  };
}
