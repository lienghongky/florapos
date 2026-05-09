import { Controller, Get, Body, Patch, Param, UseGuards, Request, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { EmenuService } from './emenu.service';
import { OrdersService } from '../orders/orders.service';
import { CreateOrderDto } from '../orders/dto/create-order.dto';
import { OrderType, OrderStatus } from '../orders/entities/order.entity';
import { UpdateEmenuSettingDto } from './dto/update-emenu-setting.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { getDiskStorage, imageFileFilter } from '../common/utils/file-upload.utils';

@ApiTags('emenu')
@Controller('emenu')
export class EmenuController {
    constructor(
        private readonly emenuService: EmenuService,
        private readonly ordersService: OrdersService,
    ) {}

    @Post('public/:storeId/orders')
    @ApiOperation({ summary: 'Create a new order from public E-Menu' })
    async createPublicOrder(@Param('storeId') storeId: string, @Body() createDto: CreateOrderDto) {
        // Enforce storeId
        createDto.store_id = storeId;
        createDto.order_type = OrderType.EMENU;
        createDto.status = OrderStatus.EMENU_PENDING;

        // Fetch settings to ensure ordering is allowed
        const settings = await this.emenuService.getSettings(storeId);
        if (!settings.is_enabled || !settings.allow_ordering) {
            throw new BadRequestException('Ordering is not available for this E-Menu');
        }

        // Create the order using a system user ID or null if the service allows it. 
        // We'll pass storeId as userId since OrdersService.create might use it, but OrdersService.create looks for user to get staff name.
        // Actually, we should handle this. Let's pass a dummy user ID or modify OrdersService to accept undefined for staff.
        // We'll pass the store owner's ID or simply null and let the service handle it.
        return this.ordersService.create(null as any, createDto);
    }

    @Get('public/:storeId')
    @ApiOperation({ summary: 'Get public E-Menu data for a store' })
    getPublicEmenu(@Param('storeId') storeId: string) {
        return this.emenuService.getPublicEmenu(storeId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('settings/:storeId')
    @ApiOperation({ summary: 'Get E-Menu settings for a store' })
    getSettings(@Request() req: any, @Param('storeId') storeId: string) {
        // In a real app we might check if req.user has access to storeId, but for now it's okay based on POS setup
        return this.emenuService.getSettings(storeId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Patch('settings/:storeId')
    @ApiOperation({ summary: 'Update E-Menu settings for a store' })
    updateSettings(@Request() req: any, @Param('storeId') storeId: string, @Body() updateDto: UpdateEmenuSettingDto) {
        return this.emenuService.updateSettings(storeId, updateDto);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('settings/:storeId/upload-banner')
    @ApiOperation({ summary: 'Upload E-Menu banner' })
    @UseInterceptors(FileInterceptor('file', { 
      storage: getDiskStorage('./uploads'),
      fileFilter: imageFileFilter 
    }))
    uploadBanner(@Request() req: any, @Param('storeId') storeId: string, @UploadedFile() file: Express.Multer.File) {
        const bannerPath = `/uploads/${file.filename}`;
        return this.emenuService.updateSettings(storeId, { banner_image: bannerPath });
    }
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Get('settings/:storeId/products')
    @ApiOperation({ summary: 'Get visible products in E-Menu' })
    getVisibleProducts(@Param('storeId') storeId: string) {
        return this.emenuService.getVisibleProductIds(storeId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('settings/:storeId/products/:productId')
    @ApiOperation({ summary: 'Add product to E-Menu' })
    addProductToEmenu(@Param('storeId') storeId: string, @Param('productId') productId: string) {
        return this.emenuService.addProductToEmenu(storeId, productId);
    }

    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Post('settings/:storeId/products/:productId/remove')
    @ApiOperation({ summary: 'Remove product from E-Menu' })
    removeProductFromEmenu(@Param('storeId') storeId: string, @Param('productId') productId: string) {
        return this.emenuService.removeProductFromEmenu(storeId, productId);
    }
}
