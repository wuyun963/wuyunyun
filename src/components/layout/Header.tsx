'use client';

import { useAppState } from '@/context/AppContext';
import { Database, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export function Header() {
  const { dataset, isLoading, error } = useAppState();

  return (
    <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
      {/* Left: Data Status */}
      <div className="flex items-center gap-4">
        {dataset ? (
          <div className="flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-green-400" />
            <span className="text-slate-300">{dataset.name}</span>
            <span className="text-slate-500">
              ({dataset.rowCount} 行 × {dataset.columns.length} 列)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Database className="w-4 h-4" />
            <span>未加载数据集</span>
          </div>
        )}
      </div>

      {/* Right: Status Indicators */}
      <div className="flex items-center gap-3">
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>处理中...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
        {dataset && !isLoading && !error && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>就绪</span>
          </div>
        )}
      </div>
    </header>
  );
}
