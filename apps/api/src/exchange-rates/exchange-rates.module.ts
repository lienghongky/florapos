import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRatesService } from './exchange-rates.service';
import { ExchangeRatesController } from './exchange-rates.controller';
import { ExchangeRate } from './entities/exchange-rate.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([ExchangeRate])],
    controllers: [ExchangeRatesController],
    providers: [ExchangeRatesService],
    exports: [ExchangeRatesService],
})
export class ExchangeRatesModule { }
