import { IsInt, Max, Min } from 'class-validator';

export class RateVideoDto {
  @IsInt()
  @Min(1)
  @Max(10)
  value: number;
}
