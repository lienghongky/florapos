import {
  Controller, Get, Post, Body, Patch, Param,
  Delete, UseGuards, Request, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { StoresService } from './stores.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { getDiskStorage, imageFileFilter } from '../common/utils/file-upload.utils';

/**
 * Controller for managing store-related operations.
 * Stores are multi-tenant units owned by Users.
 */
@ApiTags('stores')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new store' })
  @ApiResponse({ status: 201, description: 'Store created successfully' })
  create(@Request() req: any, @Body() createStoreDto: CreateStoreDto) {
    return this.storesService.create(req.user.userId, createStoreDto);
  }

  @Get()
  @ApiOperation({ summary: 'List user stores' })
  findAll(@Request() req: any) {
    return this.storesService.findAll(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get store details' })
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.storesService.findOne(req.user.userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update store (Owner only)' })
  update(@Request() req: any, @Param('id') id: string, @Body() updateStoreDto: UpdateStoreDto) {
    return this.storesService.update(req.user.userId, id, updateStoreDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete store (Owner only)' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.storesService.remove(req.user.userId, id);
  }

  @Post(':id/upload-banner')
  @ApiOperation({ summary: 'Upload a banner image for the store' })
  @UseInterceptors(FileInterceptor('file', { 
    storage: getDiskStorage('./uploads'),
    fileFilter: imageFileFilter 
  }))
  uploadBanner(@Request() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const bannerPath = `/uploads/${file.filename}`;
    return this.storesService.update(req.user.userId, id, { banner_image: bannerPath });
  }

  @Post(':id/upload-logo')
  @ApiOperation({ summary: 'Upload a logo image for the store' })
  @UseInterceptors(FileInterceptor('file', { 
    storage: getDiskStorage('./uploads'),
    fileFilter: imageFileFilter 
  }))
  uploadLogo(@Request() req: any, @Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const logoPath = `/uploads/${file.filename}`;
    return this.storesService.update(req.user.userId, id, { logo_url: logoPath });
  }
}
