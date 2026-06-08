// 数据类型定义

export interface DataRow {
  [key: string]: string | number | boolean | null;
}

export interface Dataset {
  id: string;
  name: string;
  columns: string[];
  data: DataRow[];
  rowCount: number;
  columnTypes: Record<string, 'number' | 'string' | 'boolean' | 'mixed'>;
  createdAt: Date;
  source: 'upload' | 'crawler' | 'demo';
}

export interface DataStatistics {
  column: string;
  type: 'number' | 'string' | 'boolean' | 'mixed';
  count: number;
  missing: number;
  unique: number;
  // 数值统计
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  std?: number;
  // 分布
  histogram?: { bin: string; count: number }[];
  // 分类统计
  topValues?: { value: string; count: number }[];
}

export interface PreprocessConfig {
  removeColumns?: string[];
  fillMissing?: {
    column: string;
    method: 'mean' | 'median' | 'mode' | 'constant';
    value?: number | string;
  }[];
  removeOutliers?: {
    column: string;
    method: 'iqr' | 'zscore';
    threshold?: number;
  }[];
  normalize?: {
    column: string;
    method: 'minmax' | 'zscore';
  }[];
}

export interface KMeansConfig {
  k: number;
  maxIterations: number;
  initialization: 'random' | 'kmeans++';
  columns: string[];
}

export interface KMeansResult {
  clusters: number[];
  centroids: number[][];
  iterations: number;
  inertia: number;
  silhouetteScore: number;
}

export interface PCAConfig {
  components: number;
  columns: string[];
}

export interface PCAResult {
  principalComponents: number[][];
  explainedVariance: number[];
  explainedVarianceRatio: number[];
  loadings: number[][];
}

export interface NeuralNetworkConfig {
  type: 'mlp' | 'cnn' | 'rnn';
  layers: NeuralLayer[];
  inputSize: number;
  outputSize: number;
  task: 'classification' | 'regression';
  activation: 'sigmoid' | 'relu' | 'tanh';
  learningRate: number;
  iterations: number;
  batchSize: number;
}

export interface NeuralLayer {
  type: 'dense' | 'conv' | 'pool' | 'rnn';
  neurons?: number;
  kernelSize?: number;
  activation?: string;
}

export interface TrainingResult {
  lossHistory: number[];
  accuracy?: number;
  predictions: number[];
  actualValues: number[];
  confusionMatrix?: number[][];
}

export interface CrawlerConfig {
  type: 'web' | 'api';
  url?: string;
  selector?: string;
  headers?: Record<string, string>;
  pagination?: {
    enabled: boolean;
    pattern: string;
    maxPages: number;
  };
}

export interface ExportConfig {
  format: 'csv' | 'json' | 'xlsx';
  includeMetadata: boolean;
}

// 导航模块定义
export interface NavModule {
  id: string;
  name: string;
  icon: string;
  path: string;
  description: string;
}
