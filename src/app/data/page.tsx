'use client';

import { useState, useCallback } from 'react';
import { useAppState } from '@/context/AppContext';
import { Upload, FileText, Trash2, Play, Database, FileJson, FileSpreadsheet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { parseCSV, parseJSON, createDataset, calculateStatistics } from '@/lib/data-utils';
import type { DataRow } from '@/types';

// 示例数据集
const demoDatasets = [
  {
    name: '鸢尾花数据集 (Iris)',
    description: '经典分类数据集，包含150个样本，4个特征',
    generate: () => {
      const data: DataRow[] = [];
      const species = ['setosa', 'versicolor', 'virginica'];
      for (let s = 0; s < 3; s++) {
        for (let i = 0; i < 50; i++) {
          data.push({
            sepal_length: 4.3 + s * 1.5 + Math.random() * 2,
            sepal_width: 2 + Math.random() * 2,
            petal_length: 1 + s * 2.5 + Math.random() * 2,
            petal_width: 0.1 + s * 1 + Math.random() * 0.9,
            species: s,
          });
        }
      }
      return data;
    },
  },
  {
    name: '随机聚类数据',
    description: '用于测试聚类算法的二维数据',
    generate: () => {
      const data: DataRow[] = [];
      const centers = [[0, 0], [5, 5], [0, 5], [5, 0]];
      for (const [cx, cy] of centers) {
        for (let i = 0; i < 50; i++) {
          data.push({
            x: cx + (Math.random() - 0.5) * 4,
            y: cy + (Math.random() - 0.5) * 4,
            cluster: centers.indexOf([cx, cy]),
          });
        }
      }
      return data;
    },
  },
  {
    name: '回归测试数据',
    description: '用于测试回归模型的线性数据',
    generate: () => {
      const data: DataRow[] = [];
      for (let i = 0; i < 200; i++) {
        const x = Math.random() * 10;
        const noise = (Math.random() - 0.5) * 2;
        data.push({
          x: x,
          y: 2 * x + 3 + noise,
          category: x > 5 ? 1 : 0,
        });
      }
      return data;
    },
  },
];

export default function DataPage() {
  const { dataset, setDataset, setStatistics, setError, error } = useAppState();
  const [previewData, setPreviewData] = useState<DataRow[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      const content = await file.text();
      const extension = file.name.split('.').pop()?.toLowerCase();
      
      let data: DataRow[];
      if (extension === 'json') {
        data = parseJSON(content);
      } else {
        data = parseCSV(content);
      }
      
      if (data.length === 0) {
        setError('无法解析文件或文件为空');
        return;
      }
      
      const newDataset = createDataset(file.name, data, 'upload');
      setDataset(newDataset);
      setPreviewData(data.slice(0, 10));
      
      const stats = calculateStatistics(data, newDataset.columns);
      setStatistics(stats);
    } catch (err) {
      setError(`文件解析失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [setDataset, setStatistics, setError]);

  const loadDemoData = useCallback((demo: typeof demoDatasets[0]) => {
    try {
      setError(null);
      const data = demo.generate();
      const newDataset = createDataset(demo.name, data, 'demo');
      setDataset(newDataset);
      setPreviewData(data.slice(0, 10));
      
      const stats = calculateStatistics(data, newDataset.columns);
      setStatistics(stats);
    } catch (err) {
      setError(`示例数据加载失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  }, [setDataset, setStatistics, setError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">数据管理</h1>
          <p className="text-slate-400">上传数据文件或加载示例数据集</p>
        </div>
        {dataset && (
          <Button
            variant="outline"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
            onClick={() => {
              setDataset(null);
              setStatistics(null);
              setPreviewData([]);
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            清除数据
          </Button>
        )}
      </div>

      {error && (
        <Alert className="bg-red-500/10 border-red-500/50">
          <AlertDescription className="text-red-400">{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="upload" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="upload" className="data-[state=active]:bg-slate-700">
            <Upload className="w-4 h-4 mr-2" />
            文件上传
          </TabsTrigger>
          <TabsTrigger value="demo" className="data-[state=active]:bg-slate-700">
            <Database className="w-4 h-4 mr-2" />
            示例数据
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-6">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragOver
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                <p className="text-lg text-slate-300 mb-2">拖拽文件到此处上传</p>
                <p className="text-sm text-slate-500 mb-4">支持 CSV、JSON 格式</p>
                <label>
                  <input
                    type="file"
                    accept=".csv,.json"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                  />
                  <Button className="bg-blue-500 hover:bg-blue-600">
                    选择文件
                  </Button>
                </label>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg">
                  <FileSpreadsheet className="w-8 h-8 text-green-400" />
                  <div>
                    <p className="font-medium text-slate-200">CSV 格式</p>
                    <p className="text-sm text-slate-400">逗号分隔值文件</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-slate-700/50 rounded-lg">
                  <FileJson className="w-8 h-8 text-blue-400" />
                  <div>
                    <p className="font-medium text-slate-200">JSON 格式</p>
                    <p className="text-sm text-slate-400">JSON 数组或对象</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demo">
          <div className="grid grid-cols-3 gap-4">
            {demoDatasets.map((demo) => (
              <Card
                key={demo.name}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => loadDemoData(demo)}
              >
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    {demo.name}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {demo.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full bg-green-500 hover:bg-green-600">
                    <Play className="w-4 h-4 mr-2" />
                    加载数据
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* 数据预览 */}
      {dataset && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">数据预览</CardTitle>
            <CardDescription className="text-slate-400">
              {dataset.name} - 共 {dataset.rowCount} 行，{dataset.columns.length} 列
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-700 overflow-auto max-h-96">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                    <TableHead className="text-slate-300 w-16">#</TableHead>
                    {dataset.columns.map((col) => (
                      <TableHead key={col} className="text-slate-300">
                        {col}
                        <span className="ml-2 text-xs text-slate-500">
                          ({dataset.columnTypes[col]})
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, i) => (
                    <TableRow key={i} className="border-slate-700">
                      <TableCell className="text-slate-500">{i + 1}</TableCell>
                      {dataset.columns.map((col) => (
                        <TableCell key={col} className="text-slate-300">
                          {row[col] === null ? (
                            <span className="text-slate-500 italic">null</span>
                          ) : typeof row[col] === 'number' ? (
                            (row[col] as number).toFixed(4)
                          ) : (
                            String(row[col])
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {dataset.rowCount > 10 && (
              <p className="text-sm text-slate-500 mt-2">
                仅显示前 10 行，共 {dataset.rowCount} 行数据
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
