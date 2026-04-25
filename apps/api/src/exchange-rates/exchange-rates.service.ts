import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { MultiCurrencyPrice } from './dto/multi-currency-price.dto';

@Injectable()
export class ExchangeRatesService {
    private cachedRate: { rate: number; timestamp: number } | null = null;
    private readonly CACHE_TTL = 60000; // 1 minute cache

    constructor(
        @InjectRepository(ExchangeRate)
        private exchangeRateRepository: Repository<ExchangeRate>,
    ) {
        this.initializeDefaultRate();
    }

    private async initializeDefaultRate() {
        const existing = await this.exchangeRateRepository.findOne({
            where: { from_currency: 'USD', to_currency: 'KHR', is_active: true },
        });

        if (!existing) {
            const defaultRate = this.exchangeRateRepository.create({
                from_currency: 'USD',
                to_currency: 'KHR',
                rate: 4100.00,
                effective_from: new Date(),
                is_active: true,
            });
            await this.exchangeRateRepository.save(defaultRate);
        }
    }

    async getCurrentRate(fromCurrency: string = 'USD', toCurrency: string = 'KHR'): Promise<number> {
        // Check cache
        if (this.cachedRate && (Date.now() - this.cachedRate.timestamp) < this.CACHE_TTL) {
            return this.cachedRate.rate;
        }

        const rate = await this.exchangeRateRepository.findOne({
            where: {
                from_currency: fromCurrency,
                to_currency: toCurrency,
                is_active: true,
                effective_from: LessThanOrEqual(new Date()),
            },
            order: { effective_from: 'DESC' },
        });

        const rateValue = rate ? Number(rate.rate) : 4100.00;

        // Update cache
        this.cachedRate = { rate: rateValue, timestamp: Date.now() };

        return rateValue;
    }

    async createRate(userId: string, createDto: CreateExchangeRateDto): Promise<ExchangeRate> {
        // Deactivate previous rates
        await this.exchangeRateRepository.update(
            { from_currency: createDto.from_currency, to_currency: createDto.to_currency, is_active: true },
            { is_active: false }
        );

        const rate = this.exchangeRateRepository.create({
            ...createDto,
            created_by: userId,
            effective_from: createDto.effective_from ? new Date(createDto.effective_from) : new Date(),
        });

        // Clear cache
        this.cachedRate = null;

        return this.exchangeRateRepository.save(rate);
    }

    async convertToMultiCurrency(usdAmount: number): Promise<MultiCurrencyPrice> {
        const rate = await this.getCurrentRate();
        return new MultiCurrencyPrice(usdAmount, rate);
    }

    async getAllRates(): Promise<ExchangeRate[]> {
        return this.exchangeRateRepository.find({
            order: { effective_from: 'DESC' },
            take: 50,
        });
    }
}
