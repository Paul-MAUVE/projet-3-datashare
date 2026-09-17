import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';
import { ConflictException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let prisma: {
    user: {
      findUnique: ReturnType<typeof vi.fn>;
      create: ReturnType<typeof vi.fn>;
    };
  };
  let passwordService: {
    hash: ReturnType<typeof vi.fn>;
  };
  beforeEach(async () => {

    prisma = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    };
    passwordService = {
      hash: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: PasswordService,
          useValue: passwordService,
        },
        UserService,
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a user by email', async () => {
    // GIVEN : un utilisateur simulé est retourné par Prisma
    const user = {
      id: 1,
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      createdAt: new Date(),
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user);

    // WHEN : on recherche l'utilisateur avec son adresse email
    const result = await service.findByEmail('test@example.com');

    // THEN : le résultat doit correspondre à l'utilisateur attendu
    expect(result).toEqual(user);
    // THEN : Prisma doit avoir été appelé avec le bon email
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: {
        email: 'test@example.com',
      },
    });
  });

  it('should reject an already registered email', async () => {
    // GIVEN
    const email = 'test@example.com';
    const password = 'testPass123';

    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      email,
      passwordHash: 'existing-hash',
      createdAt: new Date(),
    });

    // WHEN : on tente de créer un compte avec le même email
    const createUser = () => service.create(email, password);

    // THEN : la création doit être refusée
    await expect(createUser()).rejects.toThrow(ConflictException);;
  });

  it('should return null when user is not found', async () => {
    // GIVEN : Prisma ne trouve aucun utilisateur
    prisma.user.findUnique.mockResolvedValue(null);

    // WHEN : on recherche un utilisateur avec son email
    const result = await service.findByEmail('unknown@example.com');

    // THEN : le service retourne null
    expect(result).toBeNull();
  });

  it('should create a user with a hashed password', async () => {
    // GIVEN
    const email = 'test@example.com';
    const password = 'testPass123';

    // GIVEN : le PasswordService retourne un mot de passe hashé
    passwordService.hash.mockResolvedValue('hashed-password');

    // GIVEN : Prisma retourne l'utilisateur créé
    const createdUser = {
      id: 1,
      email,
      passwordHash: 'hashed-password',
      createdAt: new Date(),
    };

    prisma.user.create.mockResolvedValue(createdUser);

    // WHEN : on crée l'utilisateur
    const result = await service.create(email, password);

    // THEN : le mot de passe doit avoir été transmis au PasswordService
    expect(passwordService.hash).toHaveBeenCalledWith(password);

    // THEN : Prisma doit enregistrer le hash et jamais le mot de passe en clair
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: {
        email,
        passwordHash: 'hashed-password',
      },
    });

    // THEN : le résultat doit correspondre à l'utilisateur créé
    expect(result).toEqual({
      id: createdUser.id,
      email: createdUser.email,
      createdAt: createdUser.createdAt,
    });
  });

  it('should reject a password shorter than 8 characters', async () => {
    // GIVEN : un mot de passe trop court
    const email = 'test@example.com';
    const password = 'short';

    // WHEN : on tente de créer le compte
    const createUser = () => service.create(email, password);

    // THEN : la création doit être refusée
    await expect(createUser()).rejects.toThrow();
  });

  it('should not return the password hash', async () => {
    // GIVEN
    const email = 'test@example.com';
    const password = 'testPass123';

    // GIVEN : le PasswordService retourne un mot de passe hashé
    passwordService.hash.mockResolvedValue('hashed-password');

    // GIVEN : Prisma retourne l'utilisateur créé
    prisma.user.create.mockResolvedValue({
      id: 1,
      email,
      passwordHash: 'hashed-password',
      createdAt: new Date(),
    });

    // WHEN : on crée l'utilisateur
    const result = await service.create(email, password);

    // THEN : le hash du mot de passe ne doit pas être retourné
    expect(result).not.toHaveProperty('passwordHash');
  });
});
