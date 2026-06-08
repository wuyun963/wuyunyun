// 机器学习算法实现
import type { DataRow, KMeansConfig, KMeansResult, PCAConfig, PCAResult } from '@/types';

// K-means 聚类算法
export function kmeans(
  data: DataRow[],
  config: KMeansConfig
): KMeansResult {
  const { k, maxIterations, columns } = config;
  
  // 提取数值数据
  const points: number[][] = data.map(row =>
    columns.map(col => {
      const v = row[col];
      return typeof v === 'number' ? v : 0;
    })
  );
  
  // 标准化数据
  const normalizedPoints = normalizePoints(points);
  
  // K-means++ 初始化
  let centroids = initializeCentroids(normalizedPoints, k);
  let clusters = new Array(points.length).fill(0);
  let iterations = 0;
  
  for (let iter = 0; iter < maxIterations; iter++) {
    iterations = iter + 1;
    
    // 分配点到最近的簇
    const newClusters = normalizedPoints.map(point =>
      findNearestCentroid(point, centroids)
    );
    
    // 检查收敛
    if (arraysEqual(clusters, newClusters)) break;
    clusters = newClusters;
    
    // 更新质心
    centroids = updateCentroids(normalizedPoints, clusters, k);
  }
  
  // 计算惯性（误差平方和）
  const inertia = calculateInertia(normalizedPoints, clusters, centroids);
  
  // 计算轮廓系数
  const silhouetteScore = calculateSilhouette(normalizedPoints, clusters);
  
  return {
    clusters,
    centroids,
    iterations,
    inertia,
    silhouetteScore,
  };
}

function normalizePoints(points: number[][]): number[][] {
  const n = points.length;
  const d = points[0].length;
  
  const means = new Array(d).fill(0);
  const stds = new Array(d).fill(0);
  
  // 计算均值
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      means[j] += points[i][j];
    }
  }
  for (let j = 0; j < d; j++) means[j] /= n;
  
  // 计算标准差
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      stds[j] += Math.pow(points[i][j] - means[j], 2);
    }
  }
  for (let j = 0; j < d; j++) stds[j] = Math.sqrt(stds[j] / n);
  
  // 标准化
  return points.map(point =>
    point.map((v, j) => stds[j] > 0 ? (v - means[j]) / stds[j] : 0)
  );
}

function initializeCentroids(points: number[][], k: number): number[][] {
  const n = points.length;
  const centroids: number[][] = [];
  
  // 随机选择第一个质心
  centroids.push(points[Math.floor(Math.random() * n)]);
  
  // K-means++ 选择其余质心
  while (centroids.length < k) {
    const distances = points.map(point => {
      const minDist = Math.min(...centroids.map(c => euclideanDistance(point, c)));
      return minDist * minDist;
    });
    
    const totalDist = distances.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    
    for (let i = 0; i < n; i++) {
      r -= distances[i];
      if (r <= 0) {
        centroids.push(points[i]);
        break;
      }
    }
  }
  
  return centroids;
}

function findNearestCentroid(point: number[], centroids: number[][]): number {
  let minDist = Infinity;
  let nearest = 0;
  
  for (let i = 0; i < centroids.length; i++) {
    const dist = euclideanDistance(point, centroids[i]);
    if (dist < minDist) {
      minDist = dist;
      nearest = i;
    }
  }
  
  return nearest;
}

function updateCentroids(points: number[][], clusters: number[], k: number): number[][] {
  const d = points[0].length;
  const centroids: number[][] = Array(k).fill(null).map(() => new Array(d).fill(0));
  const counts = new Array(k).fill(0);
  
  for (let i = 0; i < points.length; i++) {
    const cluster = clusters[i];
    counts[cluster]++;
    for (let j = 0; j < d; j++) {
      centroids[cluster][j] += points[i][j];
    }
  }
  
  for (let i = 0; i < k; i++) {
    if (counts[i] > 0) {
      for (let j = 0; j < d; j++) {
        centroids[i][j] /= counts[i];
      }
    }
  }
  
  return centroids;
}

function euclideanDistance(a: number[], b: number[]): number {
  return Math.sqrt(a.reduce((sum, v, i) => sum + Math.pow(v - b[i], 2), 0));
}

function arraysEqual(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function calculateInertia(points: number[][], clusters: number[], centroids: number[][]): number {
  return points.reduce((sum, point, i) => {
    return sum + euclideanDistance(point, centroids[clusters[i]]) ** 2;
  }, 0);
}

function calculateSilhouette(points: number[][], clusters: number[]): number {
  const n = points.length;
  const uniqueClusters = [...new Set(clusters)];
  const k = uniqueClusters.length;
  
  if (k <= 1 || k >= n) return 0;
  
  let totalSilhouette = 0;
  let validPoints = 0;
  
  for (let i = 0; i < n; i++) {
    const cluster = clusters[i];
    const sameCluster = points.filter((_, j) => clusters[j] === cluster);
    
    if (sameCluster.length <= 1) continue;
    
    // 计算簇内距离
    const a = sameCluster
      .filter((_, j) => clusters[points.findIndex(p => p === sameCluster[j])] === cluster)
      .reduce((sum, p) => sum + euclideanDistance(points[i], p), 0) / (sameCluster.length - 1);
    
    // 计算最近簇的距离
    let minB = Infinity;
    for (const c of uniqueClusters) {
      if (c === cluster) continue;
      const otherCluster = points.filter((_, j) => clusters[j] === c);
      if (otherCluster.length === 0) continue;
      const b = otherCluster.reduce((sum, p) => sum + euclideanDistance(points[i], p), 0) / otherCluster.length;
      minB = Math.min(minB, b);
    }
    
    if (minB === Infinity) continue;
    
    const s = (minB - a) / Math.max(a, minB);
    totalSilhouette += s;
    validPoints++;
  }
  
  return validPoints > 0 ? totalSilhouette / validPoints : 0;
}

// PCA 主成分分析
export function pca(
  data: DataRow[],
  config: PCAConfig
): PCAResult {
  const { components, columns } = config;
  
  // 提取数值数据
  const matrix: number[][] = data.map(row =>
    columns.map(col => {
      const v = row[col];
      return typeof v === 'number' ? v : 0;
    })
  );
  
  const n = matrix.length;
  const d = matrix[0].length;
  
  // 中心化数据
  const means = new Array(d).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < d; j++) {
      means[j] += matrix[i][j];
    }
  }
  for (let j = 0; j < d; j++) means[j] /= n;
  
  const centered = matrix.map(row => row.map((v, j) => v - means[j]));
  
  // 计算协方差矩阵
  const cov: number[][] = Array(d).fill(null).map(() => new Array(d).fill(0));
  for (let i = 0; i < d; i++) {
    for (let j = 0; j < d; j++) {
      for (let k = 0; k < n; k++) {
        cov[i][j] += centered[k][i] * centered[k][j];
      }
      cov[i][j] /= (n - 1);
    }
  }
  
  // 幂迭代法求特征值和特征向量
  const { eigenvalues, eigenvectors } = powerIteration(cov, components);
  
  // 计算主成分
  const principalComponents = centered.map(row =>
    eigenvectors[0].map((_, j) =>
      row.reduce((sum, v, k) => sum + v * eigenvectors[j][k], 0)
    )
  );
  
  // 计算解释方差
  const totalVariance = eigenvalues.reduce((a, b) => a + b, 0);
  const explainedVariance = eigenvalues;
  const explainedVarianceRatio = eigenvalues.map(v => v / totalVariance);
  
  return {
    principalComponents,
    explainedVariance,
    explainedVarianceRatio,
    loadings: eigenvectors,
  };
}

function powerIteration(matrix: number[][], numComponents: number): { eigenvalues: number[]; eigenvectors: number[][] } {
  const d = matrix.length;
  const eigenvalues: number[] = [];
  const eigenvectors: number[][] = [];
  
  let A = matrix.map(row => [...row]);
  
  for (let c = 0; c < numComponents; c++) {
    // 随机初始化
    let v = new Array(d).fill(0).map(() => Math.random());
    const norm = Math.sqrt(v.reduce((sum, x) => sum + x * x, 0));
    v = v.map(x => x / norm);
    
    let eigenvalue = 0;
    
    // 幂迭代
    for (let iter = 0; iter < 100; iter++) {
      // Av
      const Av = new Array(d).fill(0);
      for (let i = 0; i < d; i++) {
        for (let j = 0; j < d; j++) {
          Av[i] += A[i][j] * v[j];
        }
      }
      
      // 新的特征值估计
      eigenvalue = v.reduce((sum, x, i) => sum + x * Av[i], 0);
      
      // 归一化
      const newNorm = Math.sqrt(Av.reduce((sum, x) => sum + x * x, 0));
      if (newNorm < 1e-10) break;
      v = Av.map(x => x / newNorm);
    }
    
    eigenvalues.push(eigenvalue);
    eigenvectors.push(v);
    
    // 矩阵收缩
    for (let i = 0; i < d; i++) {
      for (let j = 0; j < d; j++) {
        A[i][j] -= eigenvalue * v[i] * v[j];
      }
    }
  }
  
  return { eigenvalues, eigenvectors };
}
