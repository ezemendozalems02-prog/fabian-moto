import type { Metadata } from 'next'
import { Toaster } from 'sonner'
import './globals.css'

export const metadata: Metadata = {
  title: 'Moto Repuestos Fabián - Sistema de Gestión',
  description: 'Panel administrativo de gestión de stock e inventario',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="bg-[#080808] text-white antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e1e1e',
              border: '1px solid #333',
              color: '#f5f5f5',
              borderRadius: '10px',
            },
            className: 'text-sm',
          }}
        />
      </body>
    </html>
  )
}
