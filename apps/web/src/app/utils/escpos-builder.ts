import { Order, OrderItem, Store } from '../types';
import { formatDateTime, formatPaymentMethod } from './format';
import { generateReceiptCanvas, generateTestReceiptCanvas } from './receipt-canvas';

export interface EscPosOptions {
    paperSize?: '58mm' | '80mm'; // 58mm has 32 chars/line; 80mm has 48 chars/line
    receiptCurrency?: 'USD' | 'KHR';
    cutPaper?: boolean;
    openDrawer?: boolean;
    customNote?: string;
    customInvoiceCode?: string;
}

const parsePrice = (val: any): number => {
    if (val && typeof val === 'object' && 'usd' in val) return Number(val.usd);
    return Number(val) || 0;
};

export class EscPosBuilder {
    private buffer: number[] = [];
    private width: number; // Chars per line

    constructor(paperSize: '58mm' | '80mm' = '58mm') {
        this.width = paperSize === '80mm' ? 48 : 32;
        this.init();
    }

    // Initialize printer
    public init(): this {
        this.buffer.push(0x1B, 0x40); // ESC @
        return this;
    }

    // Text Alignment (0: Left, 1: Center, 2: Right)
    public align(align: 'left' | 'center' | 'right'): this {
        const val = align === 'left' ? 0 : align === 'center' ? 1 : 2;
        this.buffer.push(0x1B, 0x61, val); // ESC a n
        return this;
    }

    // Text Formatting
    public bold(enable: boolean = true): this {
        this.buffer.push(0x1B, 0x45, enable ? 1 : 0); // ESC E n
        return this;
    }

    public textSize(widthMult: number = 1, heightMult: number = 1): this {
        const n = ((widthMult - 1) << 4) | (heightMult - 1);
        this.buffer.push(0x1D, 0x21, n); // GS ! n
        return this;
    }

    public lineFeed(lines: number = 1): this {
        for (let i = 0; i < lines; i++) {
            this.buffer.push(0x0A); // LF
        }
        return this;
    }

    public text(str: string): this {
        for (let i = 0; i < str.length; i++) {
            const code = str.charCodeAt(i);
            // Simple ASCII & Khmer/latin fallback handling
            if (code <= 255) {
                this.buffer.push(code);
            } else {
                // ASCII replacement for non-standard unsupported Unicode chars on basic ESC/POS
                this.buffer.push(63); // '?'
            }
        }
        return this;
    }

    public textLine(str: string): this {
        this.text(str);
        this.lineFeed(1);
        return this;
    }

    public divider(char: string = '-'): this {
        this.textLine(char.repeat(this.width));
        return this;
    }

    // Two column row with padding (e.g., "Subtotal:        $12.50")
    public twoColumn(left: string, right: string): this {
        const available = this.width - right.length;
        if (left.length >= available) {
            left = left.substring(0, available - 1);
        }
        const spaces = Math.max(1, available - left.length);
        this.textLine(left + ' '.repeat(spaces) + right);
        return this;
    }

    // 3/4 Column Row for Items (Name, Qty x Price, Total)
    public itemRow(name: string, qtyPriceStr: string, totalStr: string): this {
        // Line 1: Item Name
        this.bold(true);
        this.textLine(name);

        // Line 2: Qty x Price ... Total
        const leftIndent = "  " + qtyPriceStr;
        const available = this.width - totalStr.length;
        const spaces = Math.max(1, available - leftIndent.length);
        this.textLine(leftIndent + ' '.repeat(spaces) + totalStr);
        this.bold(false);
        return this;
    }

    // Cut Paper Command
    public cut(): this {
        this.lineFeed(3);
        this.buffer.push(0x1D, 0x56, 0x42, 0x00); // GS V 66 0
        return this;
    }

    // Open Cash Drawer
    public openDrawer(): this {
        this.buffer.push(0x1B, 0x70, 0x00, 0x19, 0xFA); // ESC p 0 25 250
        return this;
    }

    /**
     * Appends an HTML5 Canvas as an ESC/POS GS v 0 raster bit image.
     * Automatically slices large images into chunks to prevent thermal printer buffer overflows.
     */
    public rasterImage(canvas: HTMLCanvasElement, chunkHeight: number = 240): this {
        const width = canvas.width;
        const height = canvas.height;
        const widthBytes = Math.ceil(width / 8);

        const ctx = canvas.getContext('2d');
        if (!ctx) return this;

        const imgData = ctx.getImageData(0, 0, width, height).data;

        // Process in vertical slices (chunks)
        for (let startY = 0; startY < height; startY += chunkHeight) {
            const currentChunkHeight = Math.min(chunkHeight, height - startY);

            // GS v 0 0 xL xH yL yH
            const xL = widthBytes & 0xff;
            const xH = (widthBytes >> 8) & 0xff;
            const yL = currentChunkHeight & 0xff;
            const yH = (currentChunkHeight >> 8) & 0xff;

            this.buffer.push(0x1D, 0x76, 0x30, 0x00, xL, xH, yL, yH);

            for (let y = startY; y < startY + currentChunkHeight; y++) {
                for (let xb = 0; xb < widthBytes; xb++) {
                    let byte = 0;
                    for (let bit = 0; bit < 8; bit++) {
                        const x = xb * 8 + bit;
                        if (x < width) {
                            const idx = (y * width + x) * 4;
                            const alpha = imgData[idx + 3] / 255;
                            const luminance =
                                (imgData[idx] * 0.299 + imgData[idx + 1] * 0.587 + imgData[idx + 2] * 0.114) * alpha +
                                255 * (1 - alpha);
                            if (luminance < 165) {
                                byte |= 128 >> bit;
                            }
                        }
                    }
                    this.buffer.push(byte);
                }
            }
        }
        return this;
    }

    public getBytes(): Uint8Array {
        return new Uint8Array(this.buffer);
    }

    /**
     * Generates an ESC/POS Raster Graphic byte stream from an order and store.
     * Renders Khmer fonts, complex scripts, and graphics with 100% fidelity.
     */
    public static generateOrderRasterEscPos(
        order: Order,
        store: Store | null,
        options: EscPosOptions = {}
    ): Uint8Array {
        const paperSize = options.paperSize || '58mm';
        const canvas = generateReceiptCanvas(order, store, {
            paperSize,
            receiptCurrency: options.receiptCurrency,
            customNote: options.customNote,
            customInvoiceCode: options.customInvoiceCode,
        });

        const builder = new EscPosBuilder(paperSize);
        if (options.openDrawer) {
            builder.openDrawer();
        }

        builder.rasterImage(canvas);
        builder.lineFeed(3);

        if (options.cutPaper !== false) {
            builder.cut();
        }

        return builder.getBytes();
    }

    /**
     * Generates test print ESC/POS Raster Graphic bytes including Khmer font verification.
     */
    public static generateTestRasterEscPos(
        printMode: string,
        paperSize: '58mm' | '80mm' = '58mm'
    ): Uint8Array {
        const canvas = generateTestReceiptCanvas(printMode, paperSize);
        const builder = new EscPosBuilder(paperSize);
        builder.rasterImage(canvas);
        builder.lineFeed(3);
        builder.cut();
        return builder.getBytes();
    }

    // Static helper to generate full receipt ESC/POS binary data for an order
    public static generateOrderEscPos(
        order: Order,
        store: Store | null,
        options: EscPosOptions = {}
    ): Uint8Array {
        const paperSize = options.paperSize || '58mm';
        const builder = new EscPosBuilder(paperSize);

        const storeName = store?.name || 'Ottor POS';
        const storeAddress = store?.address;
        const storePhone = store?.phone_number;
        const taxId = store?.tax_id;
        const footerText = store?.receipt_footer_text || 'Thank you for your business!';
        const exchangeRate = order.exchange_rate || store?.exchange_rate || 4100;
        const invoiceCode = options.customInvoiceCode || (order.order_number?.toUpperCase() || order.id.slice(-6).toUpperCase());

        // Header
        builder.align('center');
        builder.bold(true);
        builder.textSize(2, 2);
        builder.textLine(storeName);
        builder.textSize(1, 1);
        builder.bold(false);

        if (storeAddress) builder.textLine(storeAddress);
        if (storePhone) builder.textLine(`TEL: ${storePhone}`);
        if (taxId) builder.textLine(`VAT TIN: ${taxId}`);

        builder.lineFeed(1);
        builder.bold(true);
        builder.textSize(1, 2);
        builder.textLine("=== RECEIPT ===");
        builder.textSize(1, 1);
        builder.bold(false);
        builder.align('left');

        builder.divider('-');
        builder.twoColumn("Invoice:", invoiceCode);
        builder.twoColumn("Date:", formatDateTime(order.created_at));
        builder.twoColumn("Cashier:", order.staff_name || 'System');
        builder.twoColumn("Payment:", formatPaymentMethod(order.payment_method || 'Cash'));
        if (order.customer_name) builder.twoColumn("Customer:", order.customer_name);
        if (order.customer_phone) builder.twoColumn("Phone:", order.customer_phone);
        builder.twoColumn("Ex. Rate:", `1$ = ${exchangeRate.toLocaleString()} KHR`);
        if (order.tags) {
            builder.bold(true);
            builder.textSize(2, 2);
            builder.textLine(`TAG: ${order.tags}`);
            builder.textSize(1, 1);
            builder.bold(false);
        }

        builder.divider('-');
        builder.bold(true);
        builder.textLine("ITEMS");
        builder.bold(false);
        builder.divider('-');

        const isKhr = options.receiptCurrency === 'KHR';

        // Items List
        order.items.forEach((item: OrderItem, idx: number) => {
            const unitPrice = parsePrice(item.unit_price);
            const lineTotal = parsePrice(item.line_total);
            const name = `${idx + 1}. ${item.product_name_snapshot}`;

            const qtyPrice = isKhr
                ? `${item.quantity} x ${Math.round(unitPrice * exchangeRate).toLocaleString()} KHR`
                : `${item.quantity} x $${unitPrice.toFixed(2)}`;
            const totalStr = isKhr
                ? `${Math.round(lineTotal * exchangeRate).toLocaleString()} KHR`
                : `$${lineTotal.toFixed(2)}`;

            builder.itemRow(name, qtyPrice, totalStr);

            // Addons
            if (item.addons && item.addons.length > 0) {
                item.addons.forEach((addon: any) => {
                    const addonPrice = parsePrice(addon.price || 0);
                    const addonStr = isKhr
                        ? `+${Math.round(addonPrice * exchangeRate).toLocaleString()} KHR`
                        : `$${addonPrice.toFixed(2)}`;
                    builder.twoColumn(`   + ${addon.name_snapshot}`, addonStr);
                });
            }
        });

        builder.divider('-');

        // Totals
        const subtotal = parsePrice(order.subtotal);
        const taxTotal = parsePrice(order.tax_total);
        const discountTotal = parsePrice(order.discount_total);
        const deliveryFee = parsePrice(order.delivery_fee || 0);
        const grandTotal = parsePrice(order.grand_total);
        const grandTotalKhr = Math.round(grandTotal * exchangeRate).toLocaleString();

        if (isKhr) {
            builder.twoColumn("Subtotal:", `${Math.round(subtotal * exchangeRate).toLocaleString()} KHR`);
            if (store?.enable_tax !== false && taxTotal > 0) {
                builder.twoColumn(`Tax (${order.tax_rate || store?.tax_rate || 0}%):`, `${Math.round(taxTotal * exchangeRate).toLocaleString()} KHR`);
            }
            if (discountTotal > 0) {
                builder.twoColumn("Discount:", `-${Math.round(discountTotal * exchangeRate).toLocaleString()} KHR`);
            }
            if (order.order_type === 'delivery' && deliveryFee > 0) {
                builder.twoColumn("Delivery Fee:", `${Math.round(deliveryFee * exchangeRate).toLocaleString()} KHR`);
            }

            builder.divider('=');
            builder.bold(true);
            builder.textSize(1, 2);
            builder.twoColumn("GRAND TOTAL (KHR):", `${grandTotalKhr} KHR`);
            builder.textSize(1, 1);
            builder.twoColumn("TOTAL (USD):", `$${grandTotal.toFixed(2)}`);
            builder.bold(false);
            builder.divider('-');
        } else {
            builder.twoColumn("Subtotal:", `$${subtotal.toFixed(2)}`);
            if (store?.enable_tax !== false && taxTotal > 0) {
                builder.twoColumn(`Tax (${order.tax_rate || store?.tax_rate || 0}%):`, `$${taxTotal.toFixed(2)}`);
            }
            if (discountTotal > 0) {
                builder.twoColumn("Discount:", `-$${discountTotal.toFixed(2)}`);
            }
            if (order.order_type === 'delivery' && deliveryFee > 0) {
                builder.twoColumn("Delivery Fee:", `$${deliveryFee.toFixed(2)}`);
            }

            builder.divider('=');
            builder.bold(true);
            builder.textSize(1, 2);
            builder.twoColumn("GRAND TOTAL:", `$${grandTotal.toFixed(2)}`);
            builder.textSize(1, 1);
            builder.twoColumn("TOTAL (KHR):", `${grandTotalKhr} KHR`);
            builder.bold(false);
            builder.divider('-');
        }

        // Footer Note
        builder.align('center');
        if (options.customNote || order.notes) {
            builder.textLine(`Note: ${options.customNote || order.notes}`);
            builder.lineFeed(1);
        }
        builder.textLine(footerText);
        builder.textLine("Powered by Ottor POS");

        if (options.openDrawer) {
            builder.openDrawer();
        }

        if (options.cutPaper !== false) {
            builder.cut();
        } else {
            builder.lineFeed(3);
        }

        return builder.getBytes();
    }
}
