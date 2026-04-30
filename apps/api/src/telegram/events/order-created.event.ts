/**
 * Event payload emitted when a new order is created in the POS system.
 * Consumed by the Telegram notification listener.
 */
export class OrderCreatedEvent {
    store_id: string;
    order_id: string;
    order_number: string;
    grand_total: number;
    staff_name: string;
    item_count: number;
    payment_method: string;

    constructor(partial: Partial<OrderCreatedEvent>) {
        Object.assign(this, partial);
    }
}
