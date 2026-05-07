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

type CreateVideoTypeTarget = {
  type?: 'movie' | 'tv_show';
};

const isTvShow = (dto: CreateVideoTypeTarget): boolean =>
  dto.type === 'tv_show';

export class CreateVideoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  posterUrl?: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  tags?: string[];

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
  @IsInt()
  @Min(0)
  duration?: number;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ValidateIf(isTvShow)
  @IsString()
  @IsNotEmpty()
  seriesTitle?: string;

  @ValidateIf(isTvShow)
  @IsInt()
  @Min(1)
  seasonNumber?: number;

  @ValidateIf(isTvShow)
  @IsInt()
  @Min(1)
  episodeNumber?: number;

  @ValidateIf(isTvShow)
  @IsString()
  @IsNotEmpty()
  episodeTitle?: string;
}
