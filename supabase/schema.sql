-- ============================================================
-- MOTO REPUESTOS FABIÁN - Schema de Base de Datos Supabase
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles (extiende auth.users de Supabase)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'vendedor' CHECK (role IN ('admin', 'vendedor', 'empleado')),
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: settings (configuración del negocio)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  business_name TEXT NOT NULL DEFAULT 'Moto Repuestos Fabián',
  phone TEXT,
  address TEXT,
  email TEXT,
  logo_url TEXT,
  whatsapp TEXT,
  tax_id TEXT,
  fiscal_type TEXT DEFAULT 'monotributo',
  currency TEXT DEFAULT 'ARS',
  low_stock_threshold INTEGER DEFAULT 5,
  invoice_prefix TEXT DEFAULT 'VTA',
  next_invoice_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO settings (business_name, currency) VALUES ('Moto Repuestos Fabián', 'ARS')
ON CONFLICT DO NOTHING;

-- ============================================================
-- TABLA: categories (categorías y subcategorías)
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categorías iniciales del rubro
INSERT INTO categories (name, slug, sort_order) VALUES
  ('Motor', 'motor', 1),
  ('Transmisión', 'transmision', 2),
  ('Frenos', 'frenos', 3),
  ('Eléctrico', 'electrico', 4),
  ('Iluminación', 'iluminacion', 5),
  ('Accesorios', 'accesorios', 6),
  ('Indumentaria', 'indumentaria', 7),
  ('Seguridad', 'seguridad', 8),
  ('Tuning', 'tuning', 9),
  ('Cubiertas', 'cubiertas', 10),
  ('Lubricantes', 'lubricantes', 11),
  ('Suspensión', 'suspension', 12)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- TABLA: products (productos)
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL UNIQUE,
  barcode TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  brand TEXT,
  compatible_model TEXT,
  short_description TEXT,
  description TEXT,
  cost_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  sale_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(12,2),
  stock INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 3,
  unit TEXT DEFAULT 'unidad',
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_new BOOLEAN DEFAULT FALSE,
  is_on_sale BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  technical_notes TEXT,
  location TEXT,
  web_sync BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: product_images (imágenes de productos)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: customers (clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  tax_id TEXT,
  fiscal_type TEXT DEFAULT 'consumidor_final',
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: suppliers (proveedores)
-- ============================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  brand TEXT,
  tax_id TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: purchases (compras / ingresos de mercadería)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_number TEXT NOT NULL UNIQUE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  total_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: purchase_items (ítems de compra)
-- ============================================================
CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  purchase_id UUID REFERENCES purchases(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: sales (ventas)
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_number TEXT NOT NULL UNIQUE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'entregada', 'cancelada')),
  payment_method TEXT NOT NULL DEFAULT 'efectivo' CHECK (payment_method IN ('efectivo', 'transferencia', 'debito', 'credito', 'mixto', 'mercadopago')),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  invoice_number TEXT,
  invoice_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: sale_items (ítems de venta)
-- ============================================================
CREATE TABLE IF NOT EXISTS sale_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  sale_id UUID REFERENCES sales(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE RESTRICT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLA: stock_movements (movimientos de stock)
-- ============================================================
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('ingreso', 'egreso', 'ajuste', 'venta', 'devolucion', 'correccion', 'compra')),
  quantity INTEGER NOT NULL,
  stock_before INTEGER NOT NULL,
  stock_after INTEGER NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Función: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_purchases_updated_at BEFORE UPDATE ON purchases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Función: crear perfil automáticamente al registrar usuario
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Función: descontar stock al confirmar venta
CREATE OR REPLACE FUNCTION process_sale_stock()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
  current_stock INTEGER;
BEGIN
  IF NEW.status = 'confirmada' AND (OLD.status IS NULL OR OLD.status != 'confirmada') THEN
    FOR item IN SELECT * FROM sale_items WHERE sale_id = NEW.id LOOP
      SELECT stock INTO current_stock FROM products WHERE id = item.product_id;

      UPDATE products SET stock = stock - item.quantity WHERE id = item.product_id;

      INSERT INTO stock_movements (product_id, type, quantity, stock_before, stock_after, reference_id, reference_type, notes, user_id)
      VALUES (item.product_id, 'venta', item.quantity, current_stock, current_stock - item.quantity, NEW.id, 'sale', 'Venta #' || NEW.sale_number, NEW.user_id);
    END LOOP;
  END IF;

  IF NEW.status = 'cancelada' AND OLD.status = 'confirmada' THEN
    FOR item IN SELECT * FROM sale_items WHERE sale_id = NEW.id LOOP
      SELECT stock INTO current_stock FROM products WHERE id = item.product_id;

      UPDATE products SET stock = stock + item.quantity WHERE id = item.product_id;

      INSERT INTO stock_movements (product_id, type, quantity, stock_before, stock_after, reference_id, reference_type, notes, user_id)
      VALUES (item.product_id, 'devolucion', item.quantity, current_stock, current_stock + item.quantity, NEW.id, 'sale', 'Devolución - Venta cancelada #' || NEW.sale_number, NEW.user_id);
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_sale_status_change
  AFTER UPDATE ON sales
  FOR EACH ROW EXECUTE FUNCTION process_sale_stock();

-- Función: sumar stock al registrar compra (cuando se crea la compra)
CREATE OR REPLACE FUNCTION process_purchase_stock()
RETURNS TRIGGER AS $$
DECLARE
  current_stock INTEGER;
  purchase_rec RECORD;
BEGIN
  SELECT * INTO purchase_rec FROM purchases WHERE id = NEW.purchase_id;
  SELECT stock INTO current_stock FROM products WHERE id = NEW.product_id;

  UPDATE products SET stock = stock + NEW.quantity WHERE id = NEW.product_id;

  INSERT INTO stock_movements (product_id, type, quantity, stock_before, stock_after, reference_id, reference_type, notes, user_id)
  VALUES (NEW.product_id, 'compra', NEW.quantity, current_stock, current_stock + NEW.quantity, NEW.purchase_id, 'purchase', 'Compra #' || purchase_rec.purchase_number, purchase_rec.user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_purchase_item_created
  AFTER INSERT ON purchase_items
  FOR EACH ROW EXECUTE FUNCTION process_purchase_stock();

-- ============================================================
-- VISTAS ÚTILES
-- ============================================================

-- Vista: productos con estado de stock
CREATE OR REPLACE VIEW products_with_stock_status AS
SELECT
  p.*,
  c.name AS category_name,
  CASE
    WHEN p.stock = 0 THEN 'out'
    WHEN p.stock <= p.min_stock THEN 'low'
    ELSE 'ok'
  END AS stock_status
FROM products p
LEFT JOIN categories c ON c.id = p.category_id;

-- Vista: estadísticas del dashboard
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM products WHERE is_active = TRUE) AS total_products,
  (SELECT COALESCE(SUM(stock), 0) FROM products WHERE is_active = TRUE) AS total_stock_units,
  (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND stock <= min_stock AND stock > 0) AS low_stock_products,
  (SELECT COUNT(*) FROM products WHERE is_active = TRUE AND stock = 0) AS out_of_stock_products,
  (SELECT COUNT(*) FROM sales WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelada') AS today_sales,
  (SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE(created_at) = CURRENT_DATE AND status != 'cancelada') AS today_revenue,
  (SELECT COUNT(*) FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) AND status != 'cancelada') AS month_sales,
  (SELECT COALESCE(SUM(total), 0) FROM sales WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW()) AND status != 'cancelada') AS month_revenue;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas: solo usuarios autenticados pueden ver y gestionar datos
CREATE POLICY "Authenticated users can manage profiles" ON profiles FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage products" ON products FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage product_images" ON product_images FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage categories" ON categories FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage suppliers" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage purchases" ON purchases FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage purchase_items" ON purchase_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage sales" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage sale_items" ON sale_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage stock_movements" ON stock_movements FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can manage settings" ON settings FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================
-- ÍNDICES para mejor performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_stock ON products(stock);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created ON stock_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_created ON sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);

-- ============================================================
-- STORAGE para imágenes de productos
-- ============================================================
-- Ejecutar en el dashboard de Supabase > Storage:
-- Crear bucket: "product-images" (público)
-- Crear bucket: "business-assets" (público)
