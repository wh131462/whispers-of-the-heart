import { IsString, IsOptional, IsInt, IsUrl, IsEnum } from 'class-validator';
import { FriendLinkStatus } from '@prisma/client';

export class CreateFriendLinkDto {
  @IsString()
  name: string;

  @IsUrl()
  url: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(FriendLinkStatus)
  status?: FriendLinkStatus;
}

export class UpdateFriendLinkDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsUrl()
  url?: string;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsEnum(FriendLinkStatus)
  status?: FriendLinkStatus;
}
