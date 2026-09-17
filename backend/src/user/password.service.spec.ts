import { Test, TestingModule } from '@nestjs/testing';
import { PasswordService } from './password.service.js';

describe('PasswordService', () => {
  let service: PasswordService;

  beforeEach(async () => {

    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordService],
    }).compile();

    service = module.get<PasswordService>(PasswordService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should hash and verify a password', async () => {
    // GIVEN
    const clearPassword = 'testPass';

    // WHEN : le mot de passe est hashé puis vérifié
    const hashedPassword = await service.hash(clearPassword);
    const validation = await service.verify(clearPassword,hashedPassword);
    
    //THEN : le hash doit être différent du mot de passe original
    expect(hashedPassword).not.toBe(clearPassword);
    // THEN : le mot de passe original doit être accepté
    expect(validation).toBe(true);

  });

  it('should reject an incorrect password', async () => {
    
    const clearPassword = 'testPass';
    const hashedPassword = await service.hash(clearPassword);

    // WHEN : on vérifie avec un mauvais mot de passe
    const validation = await service.verify('wrongPassword', hashedPassword);

    // THEN : le mot de passe doit être refusé
    expect(validation).toBe(false);
    });
});
