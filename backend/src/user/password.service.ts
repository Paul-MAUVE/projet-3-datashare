import { Injectable } from '@nestjs/common';
import { hash, verify } from 'argon2';

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return hash(password);
  }

  async verify(password: string, passwordHash: string): Promise<boolean> {
    return verify(passwordHash, password);
  }
}