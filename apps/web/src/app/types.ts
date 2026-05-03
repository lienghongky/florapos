export enum UserRole {
    MASTER = 'MASTER',
    OWNER = 'OWNER',
    MANAGER = 'MANAGER',
    STAFF = 'STAFF'
}

export interface User {
    id: string;
    name?: string;
    full_name?: string;
    email: string;
    role: UserRole;
    avatar?: string;
    is_active: boolean;
    subscription?: Subscription;
}

export interface SubscriptionPlan {
    id: string;
    name: string;
    price: number;
    max_stores: number;
    max_users: number;
    features: string[];
}

export interface Subscription {
    id: string;
    plan_id: string;
    status: string;
    trial_start_at?: string;
    trial_end_at?: string;
    current_period_start?: string;
    current_period_end?: string;
    is_auto_renew: boolean;
    cancel_at_period_end: boolean;
    plan?: SubscriptionPlan;
}

export interface InventoryItem {
    id: string;
    store_id?: string;
    name: string;
    sku?: string;
    barcode?: string;
    current_stock: number;
    reserved_qty: number;
    min_stock_threshold: number;
    reorder_qty: number;
    unit_id?: string;
    cost_price: number;
    average_cost: number;
    supplier?: string;
    location?: string;
    is_active: boolean;
    category_id?: string;
    category?: Category;
    tags?: string[];
    updated_at?: string;
    created_at?: string;
}

export type ProductType = 'simple' | 'composite';
export type PricingType = 'fixed' | 'variable';

export interface ProductRecipeItem {
    inventory_item_id: string;
    quantity_required: number;
}

export interface ProductVariant {
    id: string;
    name: string;
    sku?: string;
    barcode?: string;
    price_modifier: number;
    cost_modifier: number;
    is_default: boolean;
    is_active: boolean;
}

export interface Addon {
    id: string;
    name: string;
    price: number;
    max_quantity: number;
    required: boolean;
    is_active: boolean;
}

export interface ProductAddon {
    id: string;
    addon_id: string;
    display_order: number;
    addon?: Addon;
}

export interface ModifierOption {
    id?: string;
    name: string;
    price_adjustment: number;
    inventory_item_id?: string;
    quantity_needed?: number;
}

export interface ModifierGroup {
    id?: string;
    name: string;
    selection_type: 'single' | 'multiple';
    min_selection: number;
    max_selection: number;
    options: ModifierOption[];
}

export interface Product {
    id: string;
    store_id?: string;
    name: string;
    description?: string;
    sku?: string;
    barcode?: string;
    category_id?: string;
    product_type: ProductType;
    pricing_type: PricingType;
    base_price: number;
    cost_price: number;
    taxable: boolean;
    tax_rate: number;
    track_inventory: boolean;
    allow_negative_stock: boolean;
    image_url?: string;
    is_active: boolean;

    variants?: ProductVariant[];
    product_addons?: ProductAddon[];
    modifier_groups?: ModifierGroup[];
    recipe?: ProductRecipeItem[];
    
    // UI specific
    calculated_stock?: number;
    tags?: string[];
    updated_at?: string;
    created_at?: string;
}

export interface OrderItemAddon {
    id?: string;
    addon_id?: string;
    name_snapshot: string;
    price: number;
    quantity: number;
}

export interface OrderItem {
    id?: string;
    product_id: string;
    variant_id?: string;
    product_name_snapshot: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_amount: number;
    line_total: number;
    addons?: OrderItemAddon[];
    notes?: string;
    product?: Product;
}

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type OrderType = 'pickup' | 'delivery';

export interface Order {
    id: string;
    store_id: string;
    order_number: string;
    order_type: OrderType;
    status: OrderStatus;
    customer_id?: string;
    staff_id?: string;
    staff_name?: string;
    staff?: User;
    session_id?: string;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    grand_total: number;
    delivery_fee?: number;
    delivery_address?: string;
    notes?: string;
    items: OrderItem[];
    created_at?: string;
    payment_method?: string;
    customer_name?: string;
    customer_phone?: string;
    exchange_rate?: number;
    tax_rate?: number;
}

export interface CartItem {
    uuid: string; // Unique ID for cart entry
    product: Product;
    quantity: number;
    selectedVariant?: ProductVariant; // maps to variant_id
    selectedAddons?: Addon[]; // maps to order item addons
    selectedModifiers?: { [groupId: string]: ModifierOption[] };
}

export interface Store {
    id: string;
    name: string;
    address?: string;
    phone_number?: string;
    description?: string;
    tax_id?: string;
    tax_rate?: number;
    enable_tax?: boolean;
    website?: string;
    receipt_footer_text?: string;
    invoice_prefix?: string;
    invoice_next_number?: number;
    banner_image?: string;
    logo_url?: string;
    exchange_rate?: number;
}

export interface Category {
    id: string;
    store_id?: string;
    name: string;
    description?: string;
    parent_id?: string;
    display_order: number;
    is_active: boolean;
    color?: string;
}

export interface ExpenseCategory {
    id: string;
    name: string;
    type: 'expense' | 'income';
    isDefault?: boolean;
    isActive: boolean;
}

export interface Expense {
    id: string;
    date: string;
    description: string;
    amount: number;
    categoryId: string;
    paymentMethod?: string;
    notes?: string;
    isRecurring?: boolean;
}

export interface Income {
    id: string;
    date: string;
    source: string;
    amount: number;
    categoryId: string;
    paymentMethod?: string;
    notes?: string;
}
export type InventoryActionType = 'SALE' | 'STOCK_IN' | 'RESTOCK' | 'ADJUSTMENT' | 'DAMAGE' | 'EXPIRED' | 'COMPOSITE_DEDUCTION';

export interface InventoryHistoryLog {
    id: string;
    store_id: string;
    inventory_item_id: string;
    action: InventoryActionType; // Map backend action_type to action if needed, or keep same name
    quantityChange: number;
    previousStock: number;
    newStock: number;
    date: string;
    userName?: string;
    userRole?: string;
    referenceId?: string;
    note?: string;
    item?: {
        name: string;
    };
}
