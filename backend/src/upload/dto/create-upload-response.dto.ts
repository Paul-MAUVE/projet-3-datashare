import { ApiProperty } from '@nestjs/swagger';

export class CreateUploadResponseDto {
  @ApiProperty({
    example: 42,
    description: "Identifiant de la session d'upload",
  })
  uploadId: number;

  @ApiProperty({
    example: 'uploads/550e8400-e29b-41d4-a716-446655440000-document.pdf',
    description: 'Clé du fichier dans le stockage objet',
  })
  storageKey: string;

  @ApiProperty({
    example: '2026-09-28T12:15:00.000Z',
    description: "Date d'expiration de la session d'upload",
  })
  expiresAt: Date;

  @ApiProperty({
    example: 'https://s3.example.com/presigned-upload-url',
    description: "URL présignée permettant d'envoyer le fichier",
  })
  uploadUrl: string;

  @ApiProperty({
    example: 900,
    description: "Durée de validité de l'URL présignée, en secondes",
  })
  expiresIn: number;
}
