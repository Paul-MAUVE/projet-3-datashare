import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateUploadDto {
  @IsString()
  @MaxLength(255)
  fileName: string;

  @IsInt()
  @Min(1)
  @Max(1073741824)
  size: number;

  @IsString()
  @MaxLength(255)
  mimeType: string;

  @IsInt()
  @Min(1)
  @Max(7)
  expirationDays: number = 7;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}