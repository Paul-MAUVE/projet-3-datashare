import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { CreateUserResponseDto } from './dto/create-user-response.dto.js';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Compte utilisateur créé avec succès',
    type: CreateUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de création invalides',
  })
  @ApiResponse({
    status: 409,
    description: 'Cette adresse e-mail est déjà utilisée',
  })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(
      createUserDto.email,
      createUserDto.password,
    );
  }
}