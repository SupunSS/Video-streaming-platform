import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(['movie', 'tv_show'])
  type: 'movie' | 'tv_show';

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(6)
  @IsString({ each: true })
  genres?: string[];

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(8)
  @IsString({ each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  ageRating?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(3000)
  releaseYear?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ValidateIf((dto) => dto.type === 'tv_show')
  @IsString()
  @IsNotEmpty()
  seriesTitle?: string;

  @ValidateIf((dto) => dto.type === 'tv_show')
  @IsInt()
  @Min(1)
  seasonNumber?: number;

  @ValidateIf((dto) => dto.type === 'tv_show')
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @ValidateIf((dto) => dto.type === 'tv_show')
  @IsString()
  @IsNotEmpty()
  episodeTitle?: string;
}
