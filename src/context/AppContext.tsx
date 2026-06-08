'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import type { Dataset, DataStatistics, KMeansResult, PCAResult, TrainingResult } from '@/types';

interface AppState {
  // 当前数据集
  dataset: Dataset | null;
  setDataset: (dataset: Dataset | null) => void;
  
  // 预处理后的数据
  processedData: Record<string, string | number | boolean | null>[] | null;
  setProcessedData: (data: Record<string, string | number | boolean | null>[] | null) => void;
  
  // 数据统计
  statistics: DataStatistics[] | null;
  setStatistics: (stats: DataStatistics[] | null) => void;
  
  // 机器学习结果
  kmeansResult: KMeansResult | null;
  setKmeansResult: (result: KMeansResult | null) => void;
  
  pcaResult: PCAResult | null;
  setPcaResult: (result: PCAResult | null) => void;
  
  neuralResult: TrainingResult | null;
  setNeuralResult: (result: TrainingResult | null) => void;
  
  // 加载状态
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // 错误信息
  error: string | null;
  setError: (error: string | null) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [dataset, setDataset] = useState<Dataset | null>(null);
  const [processedData, setProcessedData] = useState<Record<string, string | number | boolean | null>[] | null>(null);
  const [statistics, setStatistics] = useState<DataStatistics[] | null>(null);
  const [kmeansResult, setKmeansResult] = useState<KMeansResult | null>(null);
  const [pcaResult, setPcaResult] = useState<PCAResult | null>(null);
  const [neuralResult, setNeuralResult] = useState<TrainingResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <AppContext.Provider
      value={{
        dataset,
        setDataset: useCallback((d) => setDataset(d), []),
        processedData,
        setProcessedData: useCallback((d) => setProcessedData(d), []),
        statistics,
        setStatistics: useCallback((s) => setStatistics(s), []),
        kmeansResult,
        setKmeansResult: useCallback((r) => setKmeansResult(r), []),
        pcaResult,
        setPcaResult: useCallback((r) => setPcaResult(r), []),
        neuralResult,
        setNeuralResult: useCallback((r) => setNeuralResult(r), []),
        isLoading,
        setIsLoading: useCallback((l) => setIsLoading(l), []),
        error,
        setError: useCallback((e) => setError(e), []),
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppProvider');
  }
  return context;
}
