import { IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUploadDto {
  @ApiProperty({
    example: 'document.pdf',
    description: 'Nom original du fichier',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  fileName: string;

  @ApiProperty({
    example: 1048576,
    description: 'Taille du fichier en octets',
    minimum: 1,
    maximum: 1073741824,
  })
  @IsInt()
  @Min(1)
  @Max(1073741824)
  size: number;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Type MIME du fichier',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  mimeType: string;

  @ApiProperty({
    example: 7,
    description: "Durée de conservation du fichier, en jours",
    minimum: 1,
    maximum: 7,
    default: 7,
  })
  @IsInt()
  @Min(1)
  @Max(7)
  expirationDays: number = 7;

  @ApiPropertyOptional({
    example: 'secret123',
    description: 'Mot de passe optionnel associé au fichier',
    minLength: 6,
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;
}