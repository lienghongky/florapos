import { Order, OrderItem, Store } from '../types';
import { formatDateTime, formatPaymentMethod } from './format';

export interface EscPosOptions {
    paperSize?: '58mm' | '80mm'; // 58mm has 32 chars/line; 80mm has 48 chars/line
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

    public getBytes(): Uint8Array {
        return new Uint8Array(this.buffer);
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

        // Items List
        order.items.forEach((item: OrderItem, idx: number) => {
            const unitPrice = parsePrice(item.unit_price);
            const lineTotal = parsePrice(item.line_total);
            const name = `${idx + 1}. ${item.product_name_snapshot}`;
            const qtyPrice = `${item.quantity} x $${unitPrice.toFixed(2)}`;
            const totalStr = `$${lineTotal.toFixed(2)}`;

            builder.itemRow(name, qtyPrice, totalStr);

            // Addons
            if (item.addons && item.addons.length > 0) {
                item.addons.forEach((addon: any) => {
                    const addonPrice = parsePrice(addon.price || 0);
                    builder.twoColumn(`   + ${addon.name_snapshot}`, `$${addonPrice.toFixed(2)}`);
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
        const grandTotalKhr = (grandTotal * exchangeRate).toLocaleString();

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
