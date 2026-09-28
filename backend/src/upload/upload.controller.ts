import { Body, Controller, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { UploadService } from './upload.service.js';
import { CreateUploadDto } from './dto/create-upload.dto.js';
import { CreateUploadResponseDto } from './dto/create-upload-response.dto.js';
import { FileResponseDto } from '../common/dto/file-response.dto.js';

@ApiTags('Uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard)
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une session de téléversement' })
  @ApiBody({ type: CreateUploadDto })
  @ApiResponse({
    status: 201,
    description: "Session d'upload créée",
    type: CreateUploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données de requête invalides',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT absent ou invalide',
  })
  async createUpload(
    @Body() createUploadDto: CreateUploadDto,
    @Req() request: { user: { userId: number } },
  ) {
    return this.uploadService.createUpload(
      createUploadDto,
      request.user.userId,
    );
  }

  @Post(':uploadId/complete')
  @ApiOperation({ summary: "Finaliser un téléversement" })
  @ApiParam({
    name: 'uploadId',
    example: 42,
    description: "Identifiant de la session d'upload",
  })
  @ApiResponse({
    status: 201,
    description: 'Téléversement finalisé avec succès',
    type: FileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Session expirée ou taille du fichier incorrecte',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT absent ou invalide',
  })
  @ApiResponse({
    status: 404,
    description: "Session d'upload introuvable",
  })
  async completeUpload(
    @Param('uploadId') uploadId: string,
    @Req() request: { user: { userId: number } },
  ) {
    return this.uploadService.completeUpload(
      Number(uploadId),
      request.user.userId,
    );
  }
}