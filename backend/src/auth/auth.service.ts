import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service.js';
import { PasswordService } from '../user/password.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.passwordService.verify(
        password,
        user.passwordHash,
    );

    if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = this.jwtService.sign({
        sub: user.id,
        email: user.email,
    });

    return {
        accessToken,
    };
  }
}