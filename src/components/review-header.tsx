'use client';

interface Reviewer {
  userId?: string;
  userEmail?: string;
  name?: string;
}

interface ReviewHeaderProps {
  projectName?: string;
  projectId?: string;
  fileName: string;
  duration: number;
  resolution?: string;
  fps?: number;
  reviewers?: Reviewer[];
  drawing: boolean;
  onToggleDrawing: () => void;
  onBack: () => void;
  onShare: () => void;
  shareLoading?: boolean;
  userName?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ReviewHeader({
  projectName,
  projectId,
  fileName,
  duration,
  resolution,
  fps,
  reviewers = [],
  drawing,
  onToggleDrawing,
  onBack,
  onShare,
  shareLoading = false,
  userName,
}: ReviewHeaderProps) {
  return (
    <header className="review-header bg-frame-900/70 backdrop-blur-2xl border-b border-white/[0.06] px-4 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <button onClick={onBack} className="text-frame-400 hover:text-white transition-all active:scale-90 p-1 -ml-1 shrink-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex items-center gap-2 min-w-0">
          {projectName && (
            <>
              <button onClick={onBack} className="text-[11px] text-frame-400 hover:text-frame-200 transition-colors truncate max-w-[120px] hidden sm:block">
                {projectName}
              </button>
              <svg className="w-3 h-3 text-frame-600 shrink-0 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          <h1 className="text-white font-semibold text-sm truncate max-w-[160px] sm:max-w-[240px]">{fileName}</h1>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-xs text-white/40 font-mono tabular-nums">{formatDuration(duration)}</span>
          {resolution && (
            <>
              <span className="text-[10px] text-frame-600">|</span>
              <span className="text-[10px] text-frame-400 font-mono">{resolution}</span>
            </>
          )}
          {fps && (
            <>
              <span className="text-[10px] text-frame-600">|</span>
              <span className="text-[10px] text-frame-400 font-mono">{fps}fps</span>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2">
          {reviewers.length > 0 && (
            <div className="flex -space-x-1.5 mr-1">
              {reviewers.slice(0, 4).map((r: Reviewer, i: number) => (
                <div
                  key={r.userId || i}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500/30 to-purple-500/30 border border-white/10 flex items-center justify-center"
                  title={(r as any).name || r.userEmail || 'Reviewer'}
                >
                  <span className="text-[10px] text-white/70 font-medium">
                    {((r as any).name || r.userEmail || 'U')[0].toUpperCase()}
                  </span>
                </div>
              ))}
              {reviewers.length > 4 && (
                <div className="w-7 h-7 rounded-full bg-frame-800 border border-white/10 flex items-center justify-center">
                  <span className="text-[9px] text-frame-400 font-medium">+{reviewers.length - 4}</span>
                </div>
              )}
            </div>
          )}

          <button
            onClick={onShare}
            className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all bg-white/5 text-white/60 hover:text-white hover:bg-white/10 active:scale-90"
          >
            {shareLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                ...
              </span>
            ) : (
              'Share'
            )}
          </button>

          <button
            onClick={onToggleDrawing}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-90 ${
              drawing
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
            }`}
          >
            Annotate
          </button>

          {userName && (
            <span className="text-xs text-white/30 ml-1">{userName}</span>
          )}
        </div>
      </div>
    </header>
  );
}
