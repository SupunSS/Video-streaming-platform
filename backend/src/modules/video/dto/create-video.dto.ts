import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  videoUrl: string;

  @IsString()
  @IsNotEmpty()
  thumbnailUrl: string;

  @IsNumber()
  @IsOptional()
  duration?: number;
}
