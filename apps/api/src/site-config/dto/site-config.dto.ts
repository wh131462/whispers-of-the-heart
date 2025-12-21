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
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerAvatar?: string;

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
  commentSettings?: {
    autoModeration?: boolean;
    bannedWords?: string[];
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
  ownerName?: string;

  @IsOptional()
  @IsString()
  ownerAvatar?: string;

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
  commentSettings?: {
    autoModeration?: boolean;
    bannedWords?: string[];
  };
}
