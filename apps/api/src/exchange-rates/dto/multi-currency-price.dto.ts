export class MultiCurrencyPrice {
    usd: number;
    khr: number;
    exchange_rate: number;

    constructor(usdAmount: number, exchangeRate: number) {
        this.usd = usdAmount;
        this.exchange_rate = exchangeRate;
        this.khr = Math.round(usdAmount * exchangeRate * 100) / 100; // Round to 2 decimals
    }
}
