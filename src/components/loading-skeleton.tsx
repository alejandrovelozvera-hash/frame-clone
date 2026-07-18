'use client';

export function LoadingSkeleton({ type = 'spinner' }: { type?: 'spinner' | 'cards' | 'player' }) {
  if (type === 'cards') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="p-0.5 rounded-2xl bg-frame-800/10">
              <div className="bg-frame-900/80 rounded-xl overflow-hidden border border-frame-800/40">
                <div className="aspect-video bg-frame-800/40" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-frame-800/40 rounded w-3/4" />
                  <div className="h-2 bg-frame-800/30 rounded w-1/2" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'player') {
    return (
      <div className="flex-1 flex flex-col bg-black">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-2 border-frame-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-frame-500 text-sm font-medium">Cargando video...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-frame-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-frame-700 border-t-frame-400 rounded-full animate-spin" />
        <p className="text-frame-500 text-sm font-medium">Cargando...</p>
      </div>
    </div>
  );
}
