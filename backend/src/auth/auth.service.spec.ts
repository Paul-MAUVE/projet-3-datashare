import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { UserService } from '../user/user.service.js';
import { PasswordService } from '../user/password.service.js';
import { JwtService } from '@nestjs/jwt';

describe('AuthService', () => {
  let service: AuthService;

  const userService = {
    findByEmail: vi.fn(),
  };

  const passwordService = {
    verify: vi.fn(),
  };

  const jwtService = {
    sign: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: userService,
        },
        {
          provide: PasswordService,
          useValue: passwordService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should login a user with valid credentials', async () => {
    // GIVEN
    const user = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
    };

    userService.findByEmail.mockResolvedValue(user);

    // GIVEN : le mot de passe fourni correspond au hash
    passwordService.verify.mockResolvedValue(true);

    // GIVEN : JwtService génère un token
    jwtService.sign.mockReturnValue('jwt-token');

    // WHEN : l'utilisateur se connecte
    const result = await service.login('test@example.com', 'testPass123');

    // THEN : l'utilisateur doit être recherché par son email
    expect(userService.findByEmail).toHaveBeenCalledWith('test@example.com');

    // THEN : le mot de passe doit être vérifié contre le hash
    expect(passwordService.verify).toHaveBeenCalledWith(
        'testPass123',
        'hashed-password',
    );

    // THEN : un JWT doit être généré
    expect(jwtService.sign).toHaveBeenCalled();

    // THEN : le token doit être retourné
    expect(result).toEqual({
        accessToken: 'jwt-token',
    });
  });

  it('should reject login when user does not exist', async () => {
    // GIVEN : aucun utilisateur ne correspond à l'email
    userService.findByEmail.mockResolvedValue(null);

    // WHEN : on tente de se connecter
    const login = () => service.login('unknown@example.com', 'testPass123');

    // THEN : la connexion doit être refusée
    await expect(login()).rejects.toThrow(UnauthorizedException);

    // THEN : le mot de passe ne doit jamais être vérifié
    expect(passwordService.verify).not.toHaveBeenCalled();

    // THEN : aucun JWT ne doit être généré
    expect(jwtService.sign).not.toHaveBeenCalled();
  });
  
  it('should reject login when password is incorrect', async () => {
    // GIVEN
    const user = {
        id: 1,
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        createdAt: new Date(),
    };

    userService.findByEmail.mockResolvedValue(user);

    // GIVEN : le mot de passe fourni est incorrect
    passwordService.verify.mockResolvedValue(false);

    // WHEN : on tente de se connecter
    const login = () => service.login('test@example.com', 'wrongPassword');

    // THEN : la connexion doit être refusée
    await expect(login()).rejects.toThrow(UnauthorizedException);

    // THEN : aucun JWT ne doit être généré
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

});