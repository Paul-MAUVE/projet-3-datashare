import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: "Adresse e-mail de l'utilisateur",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mot de passe du compte',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password: string;
}