import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateVideoDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @IsNumber()
  @IsOptional()
  duration?: number;
}
