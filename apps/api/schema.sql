-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. CORE & STORE MANAGEMENT
-- ==========================================

CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE user_role AS ENUM ('OWNER', 'STAFF');
CREATE TABLE store_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    store_id UUID REFERENCES stores(id),
    role user_role DEFAULT 'STAFF',
    UNIQUE(user_id, store_id)
);

-- ==========================================
-- 2. DYNAMIC SETTINGS (Units, Categories)
-- ==========================================

CREATE TABLE units (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(50) NOT NULL, -- e.g. 'Kilogram', 'Box'
    short_code VARCHAR(10) NOT NULL, -- e.g. 'kg', 'box'
    is_base BOOLEAN DEFAULT FALSE, -- If true, this is a base unit for dimension
    conversion_factor DECIMAL(10,4) DEFAULT 1, -- Multiplier to base unit
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_units_store ON units(store_id);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7), -- Hex code for UI
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_categories_store ON categories(store_id);

-- ==========================================
-- 3. INVENTORY (Raw Materials)
-- ==========================================

CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    current_stock DECIMAL(10,3) DEFAULT 0,
    unit_id UUID REFERENCES units(id),     -- Dynamic Unit Link
    min_stock_threshold DECIMAL(10,3) DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,    -- Moving average cost
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_inventory_store ON inventory_items(store_id);

-- ==========================================
-- 4. PRODUCTS (Catalog, Variants, Modifiers)
-- ==========================================

CREATE TYPE product_type AS ENUM ('simple', 'composite');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    category_id UUID REFERENCES categories(id), -- Dynamic Category Link
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    type product_type DEFAULT 'simple',
    
    -- For simple products that map 1:1 to inventory
    inventory_item_id UUID REFERENCES inventory_items(id), 
    
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_products_store ON products(store_id);

-- Product Variants (e.g. Sizes: Small, Medium, Large)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- 'Small', 'Large'
    price_adjustment DECIMAL(10,2) DEFAULT 0, -- +$0.50
    sku VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recipes (Bill of Materials) 
-- Can attach to Product (generic) or Variant (specific size)
CREATE TABLE product_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE, -- Nullable
    inventory_item_id UUID REFERENCES inventory_items(id),
    quantity_needed DECIMAL(10,3) NOT NULL
);

-- Modifier Groups (e.g. "Toppings", "Sugar Level")
CREATE TABLE modifier_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(100) NOT NULL,
    min_selection INT DEFAULT 0,
    max_selection INT DEFAULT 1, -- 1=Radio, >1=Checkbox
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modifier Options (e.g. "Extra Pearl", "No Sugar")
CREATE TABLE modifier_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price_adjustment DECIMAL(10,2) DEFAULT 0,
    inventory_item_id UUID REFERENCES inventory_items(id), -- Auto-deduct topping stock
    quantity_needed DECIMAL(10,3) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Link Products to Modifier Groups
CREATE TABLE product_modifiers (
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    modifier_group_id UUID REFERENCES modifier_groups(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, modifier_group_id)
);

-- ==========================================
-- 5. SALES & REPORTING (Orders)
-- ==========================================

CREATE TYPE order_status AS ENUM ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED');

CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    order_number SERIAL, -- Human friendly ID per store (needs partition logic ideally)
    
    total_amount DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    
    status order_status DEFAULT 'PENDING',
    payment_method VARCHAR(50), -- 'CASH', 'CARD'
    
    performed_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_orders_store_date ON orders(store_id, created_at);

CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID REFERENCES product_variants(id),
    
    product_name_snapshot VARCHAR(255), -- Keep name even if product deleted
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Modifiers snapshot (JSON for simplicity in display, or separate table for strictness)
    modifiers_json JSONB DEFAULT '[]' 
);

-- ==========================================
-- 6. AUDIT & HISTORY (Golden Rule)
-- ==========================================

CREATE TYPE inventory_action AS ENUM ('SALE', 'STOCK_IN', 'ADJUSTMENT', 'DAMAGE', 'EXPIRED', 'COMPOSITE_DEDUCTION');

CREATE TABLE inventory_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    inventory_item_id UUID REFERENCES inventory_items(id),
    
    action_type inventory_action NOT NULL,
    quantity_change DECIMAL(10,3) NOT NULL,
    quantity_before DECIMAL(10,3) NOT NULL,
    quantity_after DECIMAL(10,3) NOT NULL,
    
    reference_id UUID, -- Order ID or Adjustment ID
    reference_type VARCHAR(50), 
    
    performed_by_user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_history_store_date ON inventory_history(store_id, timestamp);

-- ==========================================
-- 7. EXPENSES (Analysis)
-- ==========================================

CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    name VARCHAR(100) NOT NULL, -- 'Rent', 'Utilities', 'Salaries'
    is_recurring BOOLEAN DEFAULT FALSE
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES stores(id),
    
    category_id UUID REFERENCES expense_categories(id),
    description VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    
    date DATE NOT NULL,
    
    recorded_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_expenses_store_date ON expenses(store_id, date);

-- Views for Reporting can be added here in future
