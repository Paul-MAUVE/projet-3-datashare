import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UploadService } from './upload.service.js';
import { CreateUploadDto } from './dto/create-upload.dto.js';

@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

    @Post()
    async createUpload(@Body() createUploadDto: CreateUploadDto, @Req() request: { user: { userId: number } }){
        return this.uploadService.createUpload(createUploadDto, request.user.userId);
    }
}