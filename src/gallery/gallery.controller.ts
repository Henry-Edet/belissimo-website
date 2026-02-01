// src/gallery/gallery.controller.ts
import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { GalleryService } from './gallery.service';
import { CreateGalleryDto, CreateGalleryResponseDto, GalleryFolder } from './dto/create-gallery.dto';
import { UpdateGalleryDto } from './dto/update-gallery.dto';
import { GalleryResponseDto } from './dto/gallery-response.dto';
import { GenerateSignedUrlDto, SignedUrlResponseDto, SignedUrlOperation } from './dto/signed-url.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/role.decorator';
import { Role } from '../users/user.entity';

@ApiTags('gallery')
@Controller('gallery')
export class GalleryController {
  constructor(private readonly galleryService: GalleryService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Upload a file to gallery' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          enum: Object.values(GalleryFolder),
          default: GalleryFolder.GALLERY,
        },
        description: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        isPublic: { type: 'boolean', default: true },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: CreateGalleryResponseDto,
  })
  async upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp|pdf|doc|docx)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createGalleryDto: CreateGalleryDto,
    @Request() req,
  ): Promise<CreateGalleryResponseDto> {
    const gallery = await this.galleryService.create(
      file,
      createGalleryDto,
      req.user?.id,
    );
    
    return {
      id: gallery.id,
      url: gallery.url,
      s3Key: gallery.s3Key,
      originalName: gallery.originalName,
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all gallery items with pagination' })
  @ApiQuery({ name: 'folder', enum: GalleryFolder, required: false })
  @ApiQuery({ name: 'tags', type: [String], required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, default: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, default: 20 })
  @ApiResponse({
    status: 200,
    description: 'List of gallery items',
    type: [GalleryResponseDto],
  })
  async findAll(
    @Query('folder') folder?: GalleryFolder,
    @Query('tags') tags?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const tagsArray = tags ? tags.split(',') : undefined;
    const skip = (page - 1) * limit;
    
    const result = await this.galleryService.findAll(folder, tagsArray, skip, limit);
    return result;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search gallery items' })
  @ApiQuery({ name: 'q', required: true })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    type: [GalleryResponseDto],
  })
  async search(@Query('q') query: string) {
    return await this.galleryService.search(query);
  }

  @Get('folder/:folder')
  @ApiOperation({ summary: 'Get gallery items by folder' })
  @ApiResponse({
    status: 200,
    description: 'Gallery items in the specified folder',
    type: [GalleryResponseDto],
  })
  async getByFolder(@Param('folder') folder: GalleryFolder) {
    return await this.galleryService.getByFolder(folder);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gallery item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Gallery item details',
    type: GalleryResponseDto,
  })
  async findOne(@Param('id') id: string): Promise<GalleryResponseDto> {
    return await this.galleryService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Update a gallery item' })
  @ApiResponse({
    status: 200,
    description: 'Updated gallery item',
    type: GalleryResponseDto,
  })
  async update(
    @Param('id') id: string,
    @Body() updateGalleryDto: UpdateGalleryDto,
  ): Promise<GalleryResponseDto> {
    return await this.galleryService.update(id, updateGalleryDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.STAFF)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Delete a gallery item' })
  @ApiResponse({ status: 200, description: 'Gallery item deleted successfully' })
  async remove(@Param('id') id: string): Promise<void> {
    return await this.galleryService.remove(id);
  }

  @Post('signed-url')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Generate a signed URL for private file access' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated',
    type: SignedUrlResponseDto,
  })
  async generateSignedUrl(
    @Body() generateSignedUrlDto: GenerateSignedUrlDto,
  ): Promise<SignedUrlResponseDto> {
    const result = await this.galleryService.generateSignedUrl(
      generateSignedUrlDto.key,
      generateSignedUrlDto.operation || SignedUrlOperation.GET,
      generateSignedUrlDto.expiresIn,
    );

    return {
      signedUrl: result.signedUrl,
      expiresAt: result.expiresAt,
      key: result.key,
      operation: generateSignedUrlDto.operation || SignedUrlOperation.GET,
    };
  }

  @Get('stats/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Get gallery statistics (Admin only)' })
  async getStatistics() {
    return await this.galleryService.getStatistics();
  }
}
