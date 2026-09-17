import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  const authService = {
    login: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login a user with valid credentials', async () => {
    // GIVEN : AuthService retourne un JWT
    authService.login.mockResolvedValue({
      accessToken: 'jwt-token',
    });

    const loginDto = {
      email: 'test@example.com',
      password: 'testPass123',
    };

    // WHEN : le contrôleur reçoit une demande de connexion
    const result = await controller.login(loginDto);

    // THEN : AuthService doit être appelé avec les identifiants
    expect(authService.login).toHaveBeenCalledWith(
      'test@example.com',
      'testPass123',
    );

    // THEN : le JWT doit être retourné au client
    expect(result).toEqual({
      accessToken: 'jwt-token',
    });
  });

  it('should propagate authentication errors', async () => {
    // GIVEN : AuthService refuse la connexion
    authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
    );

    const loginDto = {
        email: 'test@example.com',
        password: 'wrongPassword',
    };

    // WHEN : le contrôleur reçoit une demande de connexion
    const login = () => controller.login(loginDto);

    // THEN : l'erreur d'authentification doit être propagée
    await expect(login()).rejects.toThrow(UnauthorizedException);
  });
});