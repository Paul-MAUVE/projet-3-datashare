import { ApiProperty } from '@nestjs/swagger';

export class FileListItemDto {
  @ApiProperty({
    example: 42,
    description: 'Identifiant du fichier',
  })
  id: number;

  @ApiProperty({
    example: 'document.pdf',
    description: 'Nom original du fichier',
  })
  fileName: string;

  @ApiProperty({
    example: 1048576,
    description: 'Taille du fichier en octets',
  })
  size: number;

  @ApiProperty({
    example: '2026-09-28T10:00:00.000Z',
    description: "Date d'envoi du fichier",
  })
  uploadDate: Date;

  @ApiProperty({
    example: '2026-10-05T10:00:00.000Z',
    description: "Date d'expiration du fichier",
  })
  expirationDate: Date;

  @ApiProperty({
    example: '/api/download/550e8400-e29b-41d4-a716-446655440000',
    description: 'URL permettant d’obtenir le lien de téléchargement',
  })
  downloadUrl: string;
}
