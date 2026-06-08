// 数据处理工具函数
import type { DataRow, Dataset, DataStatistics } from '@/types';

// 解析CSV数据
export function parseCSV(content: string): DataRow[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const data: DataRow[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const row: DataRow = {};
      headers.forEach((header, index) => {
        row[header] = parseValue(values[index]);
      });
      data.push(row);
    }
  }
  
  return data;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

function parseValue(value: string): string | number | boolean | null {
  if (value === '' || value === 'null' || value === 'NULL') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  const num = Number(value);
  if (!isNaN(num)) return num;
  return value.replace(/^"|"$/g, '');
}

// 解析JSON数据
export function parseJSON(content: string): DataRow[] {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) return data;
    if (typeof data === 'object' && data !== null) {
      // 处理嵌套数据结构
      if (Array.isArray(data.data)) return data.data;
      return [data];
    }
    return [];
  } catch {
    return [];
  }
}

// 推断列类型
export function inferColumnType(data: DataRow[], column: string): 'number' | 'string' | 'boolean' | 'mixed' {
  const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
  if (values.length === 0) return 'string';
  
  let hasNumber = false;
  let hasString = false;
  let hasBoolean = false;
  
  for (const v of values) {
    if (typeof v === 'number') hasNumber = true;
    else if (typeof v === 'boolean') hasBoolean = true;
    else hasString = true;
  }
  
  const typeCount = [hasNumber, hasString, hasBoolean].filter(Boolean).length;
  if (typeCount > 1) return 'mixed';
  if (hasNumber) return 'number';
  if (hasBoolean) return 'boolean';
  return 'string';
}

// 创建数据集对象
export function createDataset(
  name: string,
  data: DataRow[],
  source: 'upload' | 'crawler' | 'demo' = 'upload'
): Dataset {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];
  const columnTypes: Record<string, 'number' | 'string' | 'boolean' | 'mixed'> = {};
  
  columns.forEach(col => {
    columnTypes[col] = inferColumnType(data, col);
  });
  
  return {
    id: `dataset-${Date.now()}`,
    name,
    columns,
    data,
    rowCount: data.length,
    columnTypes,
    createdAt: new Date(),
    source,
  };
}

// 计算数据统计
export function calculateStatistics(data: DataRow[], columns: string[]): DataStatistics[] {
  return columns.map(column => {
    const values = data.map(row => row[column]);
    const validValues = values.filter(v => v !== null && v !== undefined);
    const uniqueValues = new Set(validValues);
    
    const stats: DataStatistics = {
      column,
      type: inferColumnType(data, column),
      count: validValues.length,
      missing: values.length - validValues.length,
      unique: uniqueValues.size,
    };
    
    // 数值统计
    if (stats.type === 'number') {
      const numValues = validValues.filter(v => typeof v === 'number') as number[];
      if (numValues.length > 0) {
        const minValue = Math.min(...numValues);
        const maxValue = Math.max(...numValues);
        const meanValue = numValues.reduce((a, b) => a + b, 0) / numValues.length;
        
        stats.min = minValue;
        stats.max = maxValue;
        stats.mean = meanValue;
        
        // 中位数
        const sorted = [...numValues].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        stats.median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        
        // 标准差
        const variance = numValues.reduce((sum, v) => sum + Math.pow(v - meanValue, 2), 0) / numValues.length;
        stats.std = Math.sqrt(variance);
        
        // 直方图数据
        const binCount = 10;
        const binWidth = (maxValue - minValue) / binCount || 1;
        const bins = Array(binCount).fill(0);
        numValues.forEach(v => {
          const binIndex = Math.min(Math.floor((v - minValue) / binWidth), binCount - 1);
          bins[binIndex]++;
        });
        stats.histogram = bins.map((count, i) => ({
          bin: `${(minValue + i * binWidth).toFixed(2)}`,
          count,
        }));
      }
    } else {
      // 分类统计
      const valueCounts: Record<string, number> = {};
      validValues.forEach(v => {
        const key = String(v);
        valueCounts[key] = (valueCounts[key] || 0) + 1;
      });
      
      const sortedValues = Object.entries(valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      
      stats.topValues = sortedValues.map(([value, count]) => ({ value, count }));
    }
    
    return stats;
  });
}

// 数据预处理函数
export function fillMissingValues(
  data: DataRow[],
  column: string,
  method: 'mean' | 'median' | 'mode' | 'constant',
  constantValue?: number | string
): DataRow[] {
  const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined) as number[];
  
  let fillValue: number | string;
  
  if (method === 'constant' && constantValue !== undefined) {
    fillValue = constantValue;
  } else if (method === 'mean') {
    fillValue = values.reduce((a, b) => a + b, 0) / values.length;
  } else if (method === 'median') {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    fillValue = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    // mode
    const counts: Record<number, number> = {};
    values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
    fillValue = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }
  
  return data.map(row => ({
    ...row,
    [column]: row[column] === null || row[column] === undefined ? fillValue : row[column],
  }));
}

export function removeOutliers(
  data: DataRow[],
  column: string,
  method: 'iqr' | 'zscore',
  threshold: number = 1.5
): DataRow[] {
  const values = data.map(row => row[column]).filter(v => typeof v === 'number') as number[];
  
  if (method === 'iqr') {
    const sorted = [...values].sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const q1 = sorted[q1Index];
    const q3 = sorted[q3Index];
    const iqr = q3 - q1;
    const lower = q1 - threshold * iqr;
    const upper = q3 + threshold * iqr;
    
    return data.filter(row => {
      const v = row[column];
      if (typeof v !== 'number') return true;
      return v >= lower && v <= upper;
    });
  } else {
    // zscore
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    return data.filter(row => {
      const v = row[column];
      if (typeof v !== 'number') return true;
      return Math.abs((v - mean) / std) <= threshold;
    });
  }
}

export function normalizeData(
  data: DataRow[],
  column: string,
  method: 'minmax' | 'zscore'
): DataRow[] {
  const values = data.map(row => row[column]).filter(v => typeof v === 'number') as number[];
  
  if (method === 'minmax') {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    return data.map(row => ({
      ...row,
      [column]: typeof row[column] === 'number' ? ((row[column] as number) - min) / range : row[column],
    }));
  } else {
    // zscore
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
    
    return data.map(row => ({
      ...row,
      [column]: typeof row[column] === 'number' ? ((row[column] as number) - mean) / std : row[column],
    }));
  }
}
