import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { PasswordService } from './password.service.js';
import { UserController } from './user.controller.js';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, PasswordService],
  exports: [UserService, PasswordService],
})
export class UserModule {}
