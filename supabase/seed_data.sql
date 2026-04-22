-- Script de Carga de Datos Iniciales (VERSIÓN FINAL)
-- Moto Repuestos Fabián

DO $$
DECLARE
    target_user_id UUID;
    cat_motor_id UUID;
    cat_transmision_id UUID;
    cat_cubiertas_id UUID;
    cat_lubricantes_id UUID;
    prod_aceite_id UUID;
    customer_id UUID;
    supplier_id UUID;
    sale_id UUID;
BEGIN
    -- 1. Obtener el ID del usuario de la tabla de autenticación
    SELECT id INTO target_user_id FROM auth.users WHERE email = 'enzo100amarilla@gmail.com' LIMIT 1;
    
    IF target_user_id IS NULL THEN
        RAISE NOTICE 'No se encontró el usuario enzo100amarilla@gmail.com en Supabase Auth.';
        RETURN;
    END IF;

    -- 2. Asegurar que el perfil EXISTE en la tabla "profiles" y sea Admin
    INSERT INTO profiles (id, name, role, is_active)
    VALUES (target_user_id, 'Enzo Amarilla', 'admin', true)
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin', name = 'Enzo Amarilla';

    -- 3. Obtener IDs de Categorías
    SELECT id INTO cat_motor_id FROM categories WHERE slug = 'motor' LIMIT 1;
    SELECT id INTO cat_transmision_id FROM categories WHERE slug = 'transmision' LIMIT 1;
    SELECT id INTO cat_cubiertas_id FROM categories WHERE slug = 'cubiertas' LIMIT 1;
    SELECT id INTO cat_lubricantes_id FROM categories WHERE slug = 'lubricantes' LIMIT 1;

    -- 4. Proveedor
    INSERT INTO suppliers (name, phone, brand, email, notes)
    VALUES ('Distribuidora Centro', '1144556677', 'Motul, DID, NGK', 'ventas@districentro.com', 'Proveedor principal')
    RETURNING id INTO supplier_id;

    -- 5. Productos
    INSERT INTO products (name, sku, category_id, brand, cost_price, sale_price, stock, min_stock, is_active)
    VALUES ('Aceite Motul 5100 4T 15W50 1L', 'MOT-5100-1550', cat_lubricantes_id, 'Motul', 8500, 14200, 24, 6, true)
    RETURNING id INTO prod_aceite_id;

    INSERT INTO products (name, sku, category_id, brand, cost_price, sale_price, stock, min_stock, is_active)
    VALUES ('Kit Transmisión Honda CB 250 New Twister', 'KIT-CB250-DID', cat_transmision_id, 'DID/HAMP', 45000, 72000, 4, 3, true);

    INSERT INTO products (name, sku, category_id, brand, cost_price, sale_price, stock, min_stock, is_active)
    VALUES ('Cubierta Pirelli Diablo Rosso II 140/70-17', 'CUB-PIR-DR2', cat_cubiertas_id, 'Pirelli', 95000, 155000, 2, 2, true);

    INSERT INTO products (name, sku, category_id, brand, cost_price, sale_price, stock, min_stock, is_active)
    VALUES ('Bujía NGK Iridium CR9EIX', 'BUJ-NGK-CR9', cat_motor_id, 'NGK', 12000, 19500, 15, 5, true);

    -- 6. Cliente
    INSERT INTO customers (name, phone, email, notes)
    VALUES ('Juan Pérez', '3764123456', 'juan.perez@email.com', 'Cliente de prueba')
    RETURNING id INTO customer_id;

    -- 7. Venta de prueba
    INSERT INTO sales (sale_number, customer_id, status, payment_method, subtotal, total, user_id, created_at)
    VALUES ('VTA-0001', customer_id, 'confirmada', 'mercadopago', 14200, 14200, target_user_id, NOW() - INTERVAL '1 day')
    RETURNING id INTO sale_id;

    INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
    VALUES (sale_id, prod_aceite_id, 1, 14200);

    RAISE NOTICE 'Seed finalizado.';
END $$;
