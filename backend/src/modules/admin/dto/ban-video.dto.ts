import { IsOptional, IsString, MaxLength } from 'class-validator';

export class BanVideoDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
