import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductDto } from './dto/import-product.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { getDiskStorage, imageFileFilter } from '../common/utils/file-upload.utils';

/**
 * Controller for managing products within a store.
 * Supports simple and composite product types, and image uploads.
 */
@ApiTags('products')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Post()
    @UseInterceptors(
        FileInterceptor('image', {
            storage: getDiskStorage('./uploads/products'),
            fileFilter: imageFileFilter,
        }),
    )
    @ApiOperation({ summary: 'Create a new product' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    create(
        @Request() req: any, 
        @Body() createProductDto: CreateProductDto,
        @UploadedFile() image: Express.Multer.File,
    ) {
        return this.productsService.create(req.user.userId, createProductDto, image);
    }


    @Get()
    @ApiOperation({ summary: 'List products for a store' })
    findAll(@Request() req: any, @Query('storeId') storeId: string) {
        return this.productsService.findAll(req.user.userId, storeId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get product details with calculated availability' })
    findOne(@Request() req: any, @Param('id') id: string) {
        return this.productsService.findOne(req.user.userId, id);
    }

    @Post('import')
    @ApiOperation({ summary: 'Import products from another store' })
    @ApiResponse({ status: 201, description: 'Products imported successfully' })
    import(@Request() req: any, @Query('targetStoreId') targetStoreId: string, @Body() importDto: ImportProductDto) {
        return this.productsService.importProducts(req.user.userId, targetStoreId, importDto);
    }

    @Patch(':id')
    @UseInterceptors(
        FileInterceptor('image', {
            storage: getDiskStorage('./uploads/products'),
            fileFilter: imageFileFilter,
        }),
    )
    @ApiOperation({ summary: 'Update a product' })
    @ApiConsumes('multipart/form-data')
    @ApiResponse({ status: 200, description: 'Product updated successfully' })
    update(
        @Request() req: any, 
        @Param('id') id: string, 
        @Body() updateProductDto: any,
        @UploadedFile() image?: Express.Multer.File,
    ) {
        return this.productsService.update(req.user.userId, id, updateProductDto, image);
    }


    @Delete(':id')
    @ApiOperation({ summary: 'Delete a product' })
    @ApiResponse({ status: 200, description: 'Product deleted successfully' })
    async remove(@Request() req: any, @Param('id') id: string) {
        await this.productsService.remove(req.user.userId, id);
        return { success: true };
    }
}
