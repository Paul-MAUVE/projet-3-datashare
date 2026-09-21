import { Controller, Get, Req, UseGuards, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FilesService } from './files.service.js';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  async findAll(@Req() request: { user: { userId: number } }) {
    return this.filesService.findAllByUser(request.user.userId);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('fileId') fileId: string,
    @Req() request: { user: { userId: number } },
  ) {
    return this.filesService.deleteFileById(
      Number(fileId),
      request.user.userId,
    );
  }
}