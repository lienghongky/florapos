import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ExchangeRatesService } from './exchange-rates.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('exchange-rates')
@Controller('exchange-rates')
export class ExchangeRatesController {
    constructor(private readonly exchangeRatesService: ExchangeRatesService) { }

    @Get('current')
    @ApiOperation({ summary: 'Get current exchange rate' })
    async getCurrentRate() {
        const rate = await this.exchangeRatesService.getCurrentRate();
        return { from: 'USD', to: 'KHR', rate };
    }

    @Get()
    @ApiOperation({ summary: 'Get all exchange rates history' })
    findAll() {
        return this.exchangeRatesService.getAllRates();
    }

    @Post()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Create new exchange rate (Admin only)' })
    create(@Request() req: any, @Body() createDto: CreateExchangeRateDto) {
        return this.exchangeRatesService.createRate(req.user.userId, createDto);
    }
}
