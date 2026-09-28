import { ApiProperty } from '@nestjs/swagger';

export class CreateUserResponseDto {
  @ApiProperty({
    example: 42,
    description: 'Identifiant du compte créé',
  })
  id: number;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Adresse e-mail du compte',
  })
  email: string;

  @ApiProperty({
    example: '2026-09-28T12:00:00.000Z',
    description: "Date de création du compte",
  })
  createdAt: Date;
}
