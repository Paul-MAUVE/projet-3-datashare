import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FilesService } from '../files/files.service.js';
import { DownloadResponseDto } from './download-response.dto.js';

@ApiTags('Download')
@Controller('download')
export class DownloadController {
  constructor(private readonly filesService: FilesService) {}

  @Get(':downloadToken')
  @ApiOperation({ summary: 'Obtenir les informations de téléchargement' })
  @ApiParam({
    name: 'downloadToken',
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Jeton unique présent dans le lien de téléchargement',
  })
  @ApiResponse({
    status: 200,
    description: 'Informations de téléchargement disponibles',
    type: DownloadResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Lien de téléchargement introuvable',
  })
  @ApiResponse({
    status: 410,
    description: 'Lien de téléchargement expiré',
  })
  async getDownloadInfo(@Param('downloadToken') downloadToken: string) {
    return this.filesService.getDownloadInfo(downloadToken);
  }
}