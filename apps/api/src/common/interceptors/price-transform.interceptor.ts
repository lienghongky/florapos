import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ExchangeRatesService } from '../../exchange-rates/exchange-rates.service';
import { MultiCurrencyPrice } from '../../exchange-rates/dto/multi-currency-price.dto';

@Injectable()
export class PriceTransformInterceptor implements NestInterceptor {
    // Price fields to transform
    private readonly priceFields = [
        'base_price',
        'price_adjustment',
        'cost_price',
        'grand_total',
        'subtotal',
        'tax_total',
        'discount_total',
        'unit_price',
        'line_total',
        'amount',
    ];

    constructor(private readonly exchangeRatesService: ExchangeRatesService) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const exchangeRate = await this.exchangeRatesService.getCurrentRate();

        return next.handle().pipe(
            map(data => this.transformPrices(data, exchangeRate))
        );
    }

    private transformPrices(data: any, exchangeRate: number): any {
        if (!data || data instanceof Date) return data;

        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => this.transformPrices(item, exchangeRate));
        }

        // Handle objects
        if (typeof data === 'object') {
            const transformed = { ...data };

            for (const key of Object.keys(transformed)) {
                // Transform price fields
                if (this.priceFields.includes(key) && typeof transformed[key] === 'number') {
                    transformed[key] = new MultiCurrencyPrice(Number(transformed[key]), exchangeRate);
                }
                // Transform nested objects/arrays
                else if (typeof transformed[key] === 'object' && transformed[key] !== null && !(transformed[key] instanceof Date)) {
                    transformed[key] = this.transformPrices(transformed[key], exchangeRate);
                }
            }

            return transformed;
        }

        return data;
    }
}
