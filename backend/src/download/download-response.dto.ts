import { ApiProperty } from '@nestjs/swagger';

export class DownloadResponseDto {
  @ApiProperty({
    example: 'document.pdf',
    description: 'Nom original du fichier',
  })
  fileName: string;

  @ApiProperty({
    example: 'application/pdf',
    description: 'Type MIME du fichier',
  })
  mimeType: string;

  @ApiProperty({
    example: 1048576,
    description: 'Taille du fichier en octets',
  })
  size: number;

  @ApiProperty({
    example: '2026-10-05T12:00:00.000Z',
    description: "Date d'expiration du lien de téléchargement",
  })
  expirationDate: Date;

  @ApiProperty({
    example: 'https://s3.example.com/presigned-download-url',
    description: 'URL présignée permettant de télécharger le fichier',
  })
  downloadUrl: string;

  @ApiProperty({
    example: 900,
    description: "Durée de validité de l'URL présignée, en secondes",
  })
  expiresIn: number;
}
