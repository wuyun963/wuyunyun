'use client';

import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Download, FileText, FileJson, FileSpreadsheet, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { DataRow } from '@/types';

function dataToCSV(data: DataRow[]): string {
  if (data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const v = row[h];
      if (v === null) return '';
      if (typeof v === 'string' && v.includes(',')) return `"${v}"`;
      return String(v);
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

function dataToJSON(data: DataRow[]): string {
  return JSON.stringify(data, null, 2);
}

export default function ExportPage() {
  const { dataset, processedData, kmeansResult, pcaResult, neuralResult } = useAppState();
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const currentData = processedData || dataset?.data || [];

  const handleExport = (data: DataRow[], filename: string) => {
    const content = format === 'csv' ? dataToCSV(data) : dataToJSON(data);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
    setExportSuccess(`${filename}.${format}`);
    setTimeout(() => setExportSuccess(null), 3000);
  };

  const handleExportMLResult = (type: 'kmeans' | 'pca' | 'neural') => {
    let data: DataRow[] = [];
    let filename = '';

    if (type === 'kmeans' && kmeansResult) {
      data = currentData.map((row, i) => ({
        ...row,
        cluster: kmeansResult.clusters[i],
      }));
      filename = 'kmeans_result';
    } else if (type === 'pca' && pcaResult) {
      data = pcaResult.principalComponents.map((pc, i) => {
        const row: DataRow = { index: i };
        pc.forEach((v, j) => {
          row[`PC${j + 1}`] = v;
        });
        return row;
      });
      filename = 'pca_result';
    } else if (type === 'neural' && neuralResult) {
      data = neuralResult.predictions.map((pred, i) => ({
        index: i,
        actual: neuralResult.actualValues[i],
        predicted: pred,
      }));
      filename = 'neural_result';
    }

    if (data.length > 0) {
      handleExport(data, filename);
    }
  };

  const exportOptions: Array<{
    title: string;
    description: string;
    data?: DataRow[];
    filename?: string;
    type?: 'kmeans' | 'pca' | 'neural';
    available: boolean;
  }> = [
    {
      title: '原始数据集',
      description: dataset ? `${dataset.rowCount} 行 × ${dataset.columns.length} 列` : '无数据',
      data: dataset?.data || [],
      filename: 'dataset',
      available: !!dataset,
    },
    {
      title: '预处理数据',
      description: processedData ? `${processedData.length} 行` : '未处理',
      data: processedData || [],
      filename: 'processed_data',
      available: !!processedData,
    },
    {
      title: 'K-means 聚类结果',
      description: kmeansResult ? `${kmeansResult.clusters.length} 个样本` : '无结果',
      type: 'kmeans' as const,
      available: !!kmeansResult,
    },
    {
      title: 'PCA 降维结果',
      description: pcaResult ? `${pcaResult.principalComponents.length} 个样本` : '无结果',
      type: 'pca' as const,
      available: !!pcaResult,
    },
    {
      title: '神经网络预测结果',
      description: neuralResult ? `${neuralResult.predictions.length} 个预测` : '无结果',
      type: 'neural' as const,
      available: !!neuralResult,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">结果导出</h1>
          <p className="text-slate-400">导出数据与模型分析结果</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={format} onValueChange={(v) => setFormat(v as typeof format)}>
            <SelectTrigger className="bg-slate-700 border-slate-600 w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-700 border-slate-600">
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {exportSuccess && (
        <Card className="bg-green-500/10 border-green-500/50">
          <CardContent className="py-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-green-400">文件 {exportSuccess} 已下载</span>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="data" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="data" className="data-[state=active]:bg-slate-700">
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            数据导出
          </TabsTrigger>
          <TabsTrigger value="results" className="data-[state=active]:bg-slate-700">
            <FileText className="w-4 h-4 mr-2" />
            结果导出
          </TabsTrigger>
        </TabsList>

        <TabsContent value="data" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {exportOptions.slice(0, 2).map((option) => (
              <Card
                key={option.title}
                className={`bg-slate-800 border-slate-700 ${
                  option.available ? 'hover:border-slate-600' : 'opacity-50'
                } transition-colors`}
              >
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Download className="w-5 h-5 text-blue-400" />
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => {
                      if (option.data && option.filename) {
                        handleExport(option.data, option.filename);
                      }
                    }}
                    disabled={!option.available}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出 {format.toUpperCase()}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {dataset && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">数据预览</CardTitle>
                <CardDescription className="text-slate-400">
                  当前数据集内容（前10行）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-700 overflow-auto max-h-64">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                        {dataset.columns.map((col) => (
                          <TableHead key={col} className="text-slate-300">
                            {col}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentData.slice(0, 10).map((row, i) => (
                        <TableRow key={i} className="border-slate-700">
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
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {exportOptions.slice(2).map((option) => (
              <Card
                key={option.title}
                className={`bg-slate-800 border-slate-700 ${
                  option.available ? 'hover:border-slate-600' : 'opacity-50'
                } transition-colors`}
              >
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <FileJson className="w-5 h-5 text-purple-400" />
                    {option.title}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => handleExportMLResult(option.type as 'kmeans' | 'pca' | 'neural')}
                    disabled={!option.available}
                    className="w-full bg-purple-500 hover:bg-purple-600"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出结果
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 结果详情 */}
          {kmeansResult && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">K-means 聚类结果摘要</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">迭代次数</p>
                  <p className="text-xl font-bold text-slate-200">{kmeansResult.iterations}</p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">轮廓系数</p>
                  <p className="text-xl font-bold text-slate-200">
                    {kmeansResult.silhouetteScore.toFixed(4)}
                  </p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">惯性值</p>
                  <p className="text-xl font-bold text-slate-200">
                    {kmeansResult.inertia.toFixed(4)}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {pcaResult && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">PCA 降维结果摘要</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {pcaResult.explainedVarianceRatio.map((ratio, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <span className="text-slate-400">主成分 {i + 1}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500"
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>
                        <span className="text-slate-300 text-sm w-20 text-right">
                          {(ratio * 100).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {neuralResult && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">神经网络结果摘要</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">最终损失</p>
                  <p className="text-xl font-bold text-slate-200">
                    {neuralResult.lossHistory[neuralResult.lossHistory.length - 1]?.toFixed(6)}
                  </p>
                </div>
                <div className="p-3 bg-slate-700/50 rounded-lg">
                  <p className="text-sm text-slate-400">准确率/R²</p>
                  <p className="text-xl font-bold text-slate-200">
                    {neuralResult.accuracy !== undefined
                      ? (neuralResult.accuracy * 100).toFixed(2) + '%'
                      : '-'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
