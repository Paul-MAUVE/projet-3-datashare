import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { Request } from 'express';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LoginResponseDto } from './dto/login-response.dto.js';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Authentifier un utilisateur' })
  @ApiResponse({
    status: 201,
    description: 'Authentification réussie',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(
      loginDto.email,
      loginDto.password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Post('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Récupérer l'utilisateur authentifié" })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur authentifié',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT absent ou invalide',
  })
  me(@Req() request: Request) {
    return request.user;
  }
}