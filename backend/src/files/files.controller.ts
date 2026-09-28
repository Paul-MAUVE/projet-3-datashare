import { Controller, Get, Req, UseGuards, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { FilesService } from './files.service.js';
import { FileListItemDto } from '../common/dto/file-list-item.dto.js';

@ApiTags('Files')
@ApiBearerAuth()
@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Get()
  @ApiOperation({ summary: "Lister les fichiers de l'utilisateur connecté" })
  @ApiResponse({
    status: 200,
    description: 'Liste des fichiers de l’utilisateur',
    type: FileListItemDto,
    isArray: true,
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT absent ou invalide',
  })
  async findAll(@Req() request: { user: { userId: number } }) {
    return this.filesService.findAllByUser(request.user.userId);
  }

  @Delete(':fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprimer un fichier' })
  @ApiParam({
    name: 'fileId',
    example: 42,
    description: 'Identifiant du fichier à supprimer',
  })
  @ApiResponse({
    status: 204,
    description: 'Fichier supprimé avec succès',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT absent ou invalide',
  })
  @ApiResponse({
    status: 404,
    description: 'Fichier introuvable',
  })
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