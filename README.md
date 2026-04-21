# Moto Repuestos Fabián — Sistema de Gestión

Sistema web premium para gestión de stock, inventario, ventas y control comercial.

## Stack tecnológico

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Estilos**: Tailwind CSS (dark mode)
- **Base de datos**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Gráficos**: Recharts
- **Deploy**: Vercel

## Configuración inicial

### 1. Clonar el repositorio y crear el `.env.local`

```bash
cp .env.local.example .env.local
```

Completar con las credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Configurar Supabase

1. Crear un proyecto en [supabase.com](https://supabase.com)
2. Ir a **SQL Editor** y ejecutar el archivo `supabase/schema.sql`
3. En **Storage**, crear dos buckets públicos:
   - `product-images` (público)
   - `business-assets` (público)
4. En **Authentication > Settings**, configurar el dominio de redirección

### 3. Crear el primer usuario admin

Ir a **Supabase > Authentication > Users** y crear un usuario con email y contraseña. El sistema lo convierte automáticamente en admin via trigger.

### 4. Instalar dependencias y correr localmente

```bash
npm install
npm run dev
```

Acceder en: `http://localhost:3000`

### 5. Deploy en Vercel

1. Subir el repositorio a GitHub
2. En Vercel, importar el repositorio
3. Agregar las variables de entorno de Supabase
4. Deploy automático en cada push a `main`

## Módulos del sistema

| Módulo | Descripción |
|--------|-------------|
| Dashboard | Métricas, gráficos y accesos rápidos |
| Productos | CRUD completo con imágenes, variantes y filtros |
| Categorías | Gestión de categorías y subcategorías |
| Inventario | Control de stock con ajustes y trazabilidad |
| Movimientos | Historial completo de todos los movimientos |
| Ventas | Registro de ventas con descuento automático de stock |
| Compras | Ingresos de mercadería con aumento automático de stock |
| Clientes | Base de clientes con historial |
| Proveedores | Directorio de proveedores |
| Alertas | Stock bajo y agotado con reposición rápida |
| Reportes | Analytics de ventas, productos y categorías |
| Configuración | Datos del negocio, facturación futura e integración web |

## Estructura del proyecto

```
src/
├── app/
│   ├── login/                    # Página de login
│   └── dashboard/                # Panel principal
│       ├── layout.tsx            # Layout con auth check
│       ├── page.tsx              # Dashboard principal
│       ├── productos/            # Módulo productos
│       ├── categorias/           # Módulo categorías
│       ├── inventario/           # Módulo inventario
│       ├── movimientos/          # Módulo movimientos
│       ├── ventas/               # Módulo ventas
│       ├── compras/              # Módulo compras
│       ├── clientes/             # Módulo clientes
│       ├── proveedores/          # Módulo proveedores
│       ├── alertas/              # Módulo alertas
│       ├── reportes/             # Módulo reportes
│       └── configuracion/        # Módulo configuración
├── components/
│   ├── layout/                   # Sidebar, Header, Layout
│   ├── dashboard/                # Componentes del dashboard
│   └── products/                 # Componentes de productos
├── lib/
│   ├── supabase/                 # Clientes Supabase
│   └── utils.ts                  # Utilidades compartidas
└── types/
    └── index.ts                  # Tipos TypeScript

supabase/
└── schema.sql                    # Schema completo de la BD
```
# fabian-moto
