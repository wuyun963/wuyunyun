'use client';

import { useState, useMemo } from 'react';
import { useAppState } from '@/context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Settings, BarChart3, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { calculateStatistics, fillMissingValues, removeOutliers, normalizeData } from '@/lib/data-utils';
import type { DataStatistics } from '@/types';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

export default function PreprocessPage() {
  const { dataset, statistics, setStatistics, processedData, setProcessedData, setError } = useAppState();
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [fillMethod, setFillMethod] = useState<'mean' | 'median' | 'mode'>('mean');
  const [outlierThreshold, setOutlierThreshold] = useState(1.5);
  const [normalizeMethod, setNormalizeMethod] = useState<'minmax' | 'zscore'>('minmax');

  const currentData = processedData || dataset?.data || [];
  const currentStats = useMemo(() => {
    if (currentData.length > 0 && dataset) {
      return calculateStatistics(currentData, dataset.columns);
    }
    return statistics;
  }, [currentData, dataset, statistics]);

  const selectedStats = currentStats?.find(s => s.column === selectedColumn);

  const handleFillMissing = () => {
    if (!selectedColumn || !dataset) return;
    try {
      const newData = fillMissingValues(currentData, selectedColumn, fillMethod);
      setProcessedData(newData);
      setStatistics(calculateStatistics(newData, dataset.columns));
    } catch (err) {
      setError(`缺失值处理失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleRemoveOutliers = () => {
    if (!selectedColumn || !dataset) return;
    try {
      const newData = removeOutliers(currentData, selectedColumn, 'iqr', outlierThreshold);
      setProcessedData(newData);
      setStatistics(calculateStatistics(newData, dataset.columns));
    } catch (err) {
      setError(`异常值处理失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleNormalize = () => {
    if (!selectedColumn || !dataset) return;
    try {
      const newData = normalizeData(currentData, selectedColumn, normalizeMethod);
      setProcessedData(newData);
      setStatistics(calculateStatistics(newData, dataset.columns));
    } catch (err) {
      setError(`数据标准化失败: ${err instanceof Error ? err.message : '未知错误'}`);
    }
  };

  const handleReset = () => {
    if (dataset) {
      setProcessedData(null);
      setStatistics(calculateStatistics(dataset.data, dataset.columns));
    }
  };

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="bg-slate-800 border-slate-700 w-96">
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-slate-500" />
            <p className="text-slate-400">请先上传或加载数据集</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">数据预处理</h1>
          <p className="text-slate-400">数据清洗、转换与统计分析</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            当前数据: {currentData.length} 行
          </span>
          {processedData && (
            <Button variant="outline" onClick={handleReset} className="border-slate-600">
              <RefreshCw className="w-4 h-4 mr-2" />
              重置
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="stats" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="stats" className="data-[state=active]:bg-slate-700">
            <BarChart3 className="w-4 h-4 mr-2" />
            统计分析
          </TabsTrigger>
          <TabsTrigger value="clean" className="data-[state=active]:bg-slate-700">
            <Settings className="w-4 h-4 mr-2" />
            数据清洗
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stats" className="space-y-4">
          {/* 列选择 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">选择分析列</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="选择要分析的列" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {dataset.columns.map((col) => (
                    <SelectItem key={col} value={col} className="text-slate-200">
                      {col} ({dataset.columnTypes[col]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedStats && (
            <div className="grid grid-cols-2 gap-4">
              {/* 基本统计 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">基本统计</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">数据类型</p>
                    <p className="text-lg font-medium text-slate-200">{selectedStats.type}</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">有效值</p>
                    <p className="text-lg font-medium text-slate-200">{selectedStats.count}</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">缺失值</p>
                    <p className="text-lg font-medium text-slate-200">{selectedStats.missing}</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">唯一值</p>
                    <p className="text-lg font-medium text-slate-200">{selectedStats.unique}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 数值统计 */}
              {selectedStats.type === 'number' && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">数值统计</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-400">最小值</p>
                      <p className="text-lg font-medium text-slate-200">
                        {selectedStats.min?.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-400">最大值</p>
                      <p className="text-lg font-medium text-slate-200">
                        {selectedStats.max?.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-400">均值</p>
                      <p className="text-lg font-medium text-slate-200">
                        {selectedStats.mean?.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-sm text-slate-400">中位数</p>
                      <p className="text-lg font-medium text-slate-200">
                        {selectedStats.median?.toFixed(4)}
                      </p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg col-span-2">
                      <p className="text-sm text-slate-400">标准差</p>
                      <p className="text-lg font-medium text-slate-200">
                        {selectedStats.std?.toFixed(4)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 直方图 */}
              {selectedStats.type === 'number' && selectedStats.histogram && (
                <Card className="bg-slate-800 border-slate-700 col-span-2">
                  <CardHeader>
                    <CardTitle className="text-slate-100">数值分布直方图</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={selectedStats.histogram}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="bin" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                          labelStyle={{ color: '#f1f5f9' }}
                        />
                        <Bar dataKey="count" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}

              {/* 分类统计饼图 */}
              {selectedStats.topValues && (
                <Card className="bg-slate-800 border-slate-700 col-span-2">
                  <CardHeader>
                    <CardTitle className="text-slate-100">分类分布</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={selectedStats.topValues}
                          dataKey="count"
                          nameKey="value"
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label={({ value, percent }) => `${value}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {selectedStats.topValues.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="clean" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">数据清洗操作</CardTitle>
              <CardDescription className="text-slate-400">
                选择列并执行相应的预处理操作
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Select value={selectedColumn} onValueChange={setSelectedColumn}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="选择要处理的列" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {dataset.columns.map((col) => (
                    <SelectItem key={col} value={col} className="text-slate-200">
                      {col} ({dataset.columnTypes[col]})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* 缺失值处理 */}
              <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-400" />
                    <span className="font-medium text-slate-200">缺失值处理</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={fillMethod} onValueChange={(v) => setFillMethod(v as typeof fillMethod)}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="mean">均值填充</SelectItem>
                        <SelectItem value="median">中位数填充</SelectItem>
                        <SelectItem value="mode">众数填充</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleFillMissing} size="sm" className="bg-orange-500 hover:bg-orange-600">
                      应用
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  用选定方法填充缺失值
                </p>
              </div>

              {/* 异常值处理 */}
              <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    <span className="font-medium text-slate-200">异常值移除 (IQR)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-400">阈值:</span>
                    <Slider
                      value={[outlierThreshold]}
                      onValueChange={([v]) => setOutlierThreshold(v)}
                      min={0.5}
                      max={3}
                      step={0.1}
                      className="w-24"
                    />
                    <span className="text-sm text-slate-300">{outlierThreshold.toFixed(1)}</span>
                    <Button onClick={handleRemoveOutliers} size="sm" className="bg-red-500 hover:bg-red-600">
                      应用
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  基于四分位距移除异常值
                </p>
              </div>

              {/* 数据标准化 */}
              <div className="p-4 bg-slate-700/50 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-slate-200">数据标准化</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Select value={normalizeMethod} onValueChange={(v) => setNormalizeMethod(v as typeof normalizeMethod)}>
                      <SelectTrigger className="bg-slate-600 border-slate-500 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-700 border-slate-600">
                        <SelectItem value="minmax">Min-Max</SelectItem>
                        <SelectItem value="zscore">Z-Score</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleNormalize} size="sm" className="bg-green-500 hover:bg-green-600">
                      应用
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-slate-400">
                  将数据标准化到统一范围
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
