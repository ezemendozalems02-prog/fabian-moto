import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="w-full h-[calc(100vh-120px)] flex flex-col items-center justify-center space-y-4">
      {/* Spinner Animado */}
      <div className="relative">
        <div className="w-16 h-16 border-4 border-red-600/20 border-t-red-600 rounded-full animate-spin" />
        <Loader2 className="w-6 h-6 text-red-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
      </div>
      
      {/* Texto de Carga */}
      <div className="text-center">
        <h3 className="text-white font-medium text-lg">Cargando módulo...</h3>
        <p className="text-neutral-500 text-sm">Preparando datos del sistema</p>
      </div>

      {/* Esqueleto de la página (decorativo) */}
      <div className="w-full max-w-4xl mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 opacity-10">
        <div className="h-32 bg-white/10 rounded-2xl animate-pulse" />
        <div className="h-32 bg-white/10 rounded-2xl animate-pulse delay-75" />
        <div className="h-32 bg-white/10 rounded-2xl animate-pulse delay-150" />
      </div>
    </div>
  )
}
