import { IsString, IsNotEmpty, IsInt, Min, Max, MaxLength, MinLength } from 'class-validator';

export class CreateReviewDto {
  @IsString()
  @IsNotEmpty()
  schoolId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  comment: string;
}
