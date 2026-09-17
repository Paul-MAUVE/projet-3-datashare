import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { PasswordService } from './password.service.js';

@Injectable()
export class UserService {
    constructor(private readonly prisma: PrismaService, private readonly passwordService: PasswordService,) {}

    async findByEmail(email: string) {
        return this.prisma.user.findUnique({
            where: {
                email,
            },
        });
    }

    async create(email: string, password: string) {
        if (password.length < 8) {
            throw new Error('Password too short');
        }
        
        const existingUser = await this.findByEmail(email);

        if (existingUser) {
            throw new ConflictException('Email already registered');
        }

        const passwordHash = await this.passwordService.hash(password);

        const user = await this.prisma.user.create({
            data: {
                email,
                passwordHash,
            },
        });

        return {
            id: user.id,
            email: user.email,
            createdAt: user.createdAt,
        };
    }
}
