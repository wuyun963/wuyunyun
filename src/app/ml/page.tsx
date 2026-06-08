'use client';

import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, Cell, PieChart, Pie, Legend, LineChart, Line } from 'recharts';
import { Play, Settings, Brain, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { kmeans, pca } from '@/lib/ml-algorithms';
import type { DataRow } from '@/types';

const COLORS = ['#3b82f6', '#22c55e', '#f97316', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b', '#6366f1', '#a855f7'];

export default function MLPage() {
  const { dataset, processedData, kmeansResult, setKmeansResult, pcaResult, setPcaResult, setIsLoading, setError } = useAppState();
  const [kmeansK, setKmeansK] = useState(3);
  const [kmeansMaxIter, setKmeansMaxIter] = useState(100);
  const [kmeansColumns, setKmeansColumns] = useState<string[]>([]);
  const [pcaComponents, setPcaComponents] = useState(2);
  const [pcaColumns, setPcaColumns] = useState<string[]>([]);

  const currentData = processedData || dataset?.data || [];

  const numericColumns = dataset?.columns.filter(
    col => dataset.columnTypes[col] === 'number'
  ) || [];

  const runKMeans = () => {
    if (kmeansColumns.length < 2) {
      setError('请至少选择2个数值列');
      return;
    }
    setIsLoading(true);
    try {
      const result = kmeans(currentData, {
        k: kmeansK,
        maxIterations: kmeansMaxIter,
        initialization: 'kmeans++',
        columns: kmeansColumns,
      });
      setKmeansResult(result);
    } catch (err) {
      setError(`K-means聚类失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runPCA = () => {
    if (pcaColumns.length < 2) {
      setError('请至少选择2个数值列');
      return;
    }
    setIsLoading(true);
    try {
      const result = pca(currentData, {
        components: pcaComponents,
        columns: pcaColumns,
      });
      setPcaResult(result);
    } catch (err) {
      setError(`PCA降维失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // 准备散点图数据
  const scatterData = kmeansResult && kmeansColumns.length >= 2
    ? currentData.map((row, i) => ({
        x: Number(row[kmeansColumns[0]]) || 0,
        y: Number(row[kmeansColumns[1]]) || 0,
        cluster: kmeansResult.clusters[i],
      }))
    : [];

  // PCA散点图数据
  const pcaScatterData = pcaResult
    ? pcaResult.principalComponents.map((pc, i) => ({
        pc1: pc[0],
        pc2: pc[1],
        index: i,
      }))
    : [];

  // 簇分布数据
  const clusterDistribution = kmeansResult
    ? Array.from({ length: kmeansK }, (_, i) => ({
        name: `簇 ${i + 1}`,
        count: kmeansResult.clusters.filter(c => c === i).length,
      }))
    : [];

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="bg-slate-800 border-slate-700 w-96">
          <CardContent className="pt-6 text-center">
            <Brain className="w-12 h-12 mx-auto mb-4 text-slate-500" />
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
          <h1 className="text-2xl font-bold text-slate-100">机器学习</h1>
          <p className="text-slate-400">K-means聚类分析与PCA主成分分析</p>
        </div>
      </div>

      <Tabs defaultValue="kmeans" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="kmeans" className="data-[state=active]:bg-slate-700">
            <PieChartIcon className="w-4 h-4 mr-2" />
            K-means 聚类
          </TabsTrigger>
          <TabsTrigger value="pca" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="w-4 h-4 mr-2" />
            PCA 降维
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kmeans" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">K-means 聚类配置</CardTitle>
              <CardDescription className="text-slate-400">
                配置聚类参数并运行算法
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">聚类数 K</Label>
                  <div className="flex items-center gap-3">
                    <Slider
                      value={[kmeansK]}
                      onValueChange={([v]) => setKmeansK(v)}
                      min={2}
                      max={10}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-slate-300 w-8">{kmeansK}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">最大迭代次数</Label>
                  <Input
                    type="number"
                    value={kmeansMaxIter}
                    onChange={(e) => setKmeansMaxIter(Number(e.target.value))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">选择特征列</Label>
                <div className="flex flex-wrap gap-2">
                  {numericColumns.map((col) => (
                    <Button
                      key={col}
                      variant={kmeansColumns.includes(col) ? 'default' : 'outline'}
                      size="sm"
                      className={kmeansColumns.includes(col)
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'border-slate-600 text-slate-300'
                      }
                      onClick={() => {
                        setKmeansColumns(prev =>
                          prev.includes(col)
                            ? prev.filter(c => c !== col)
                            : [...prev, col]
                        );
                      }}
                    >
                      {col}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={runKMeans} className="w-full bg-purple-500 hover:bg-purple-600">
                <Play className="w-4 h-4 mr-2" />
                运行 K-means 聚类
              </Button>
            </CardContent>
          </Card>

          {kmeansResult && (
            <div className="grid grid-cols-2 gap-4">
              {/* 结果统计 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">聚类结果</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">迭代次数</p>
                    <p className="text-2xl font-bold text-slate-200">{kmeansResult.iterations}</p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg">
                    <p className="text-sm text-slate-400">轮廓系数</p>
                    <p className="text-2xl font-bold text-slate-200">
                      {kmeansResult.silhouetteScore.toFixed(4)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-lg col-span-2">
                    <p className="text-sm text-slate-400">惯性 (Inertia)</p>
                    <p className="text-2xl font-bold text-slate-200">
                      {kmeansResult.inertia.toFixed(4)}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* 簇分布 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">簇分布</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={clusterDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                      <YAxis stroke="#94a3b8" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                      />
                      <Bar dataKey="count">
                        {clusterDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* 散点图 */}
              {kmeansColumns.length >= 2 && (
                <Card className="bg-slate-800 border-slate-700 col-span-2">
                  <CardHeader>
                    <CardTitle className="text-slate-100">聚类可视化</CardTitle>
                    <CardDescription className="text-slate-400">
                      {kmeansColumns[0]} vs {kmeansColumns[1]}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={350}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis
                          dataKey="x"
                          name={kmeansColumns[0]}
                          stroke="#94a3b8"
                        />
                        <YAxis
                          dataKey="y"
                          name={kmeansColumns[1]}
                          stroke="#94a3b8"
                        />
                        <ZAxis range={[50, 50]} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        />
                        <Legend />
                        {Array.from({ length: kmeansK }, (_, i) => (
                          <Scatter
                            key={i}
                            name={`簇 ${i + 1}`}
                            data={scatterData.filter(d => d.cluster === i)}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pca" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">PCA 配置</CardTitle>
              <CardDescription className="text-slate-400">
                配置主成分分析参数
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">主成分数量</Label>
                <div className="flex items-center gap-3">
                  <Slider
                    value={[pcaComponents]}
                    onValueChange={([v]) => setPcaComponents(v)}
                    min={1}
                    max={Math.min(numericColumns.length, 5)}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-slate-300 w-8">{pcaComponents}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">选择特征列</Label>
                <div className="flex flex-wrap gap-2">
                  {numericColumns.map((col) => (
                    <Button
                      key={col}
                      variant={pcaColumns.includes(col) ? 'default' : 'outline'}
                      size="sm"
                      className={pcaColumns.includes(col)
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'border-slate-600 text-slate-300'
                      }
                      onClick={() => {
                        setPcaColumns(prev =>
                          prev.includes(col)
                            ? prev.filter(c => c !== col)
                            : [...prev, col]
                        );
                      }}
                    >
                      {col}
                    </Button>
                  ))}
                </div>
              </div>

              <Button onClick={runPCA} className="w-full bg-teal-500 hover:bg-teal-600">
                <Play className="w-4 h-4 mr-2" />
                运行 PCA 降维
              </Button>
            </CardContent>
          </Card>

          {pcaResult && (
            <div className="grid grid-cols-2 gap-4">
              {/* 解释方差 */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-100">解释方差比例</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart
                      data={pcaResult.explainedVarianceRatio.map((ratio, i) => ({
                        name: `PC${i + 1}`,
                        value: ratio,
                        cumulative: pcaResult.explainedVarianceRatio.slice(0, i + 1).reduce((a, b) => a + b, 0),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                      />
                      <Bar dataKey="value" fill="#14b8a6" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {pcaResult.explainedVarianceRatio.map((ratio, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span className="text-slate-400">PC{i + 1}</span>
                        <span className="text-slate-300">{(ratio * 100).toFixed(2)}%</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t border-slate-600">
                      <span className="text-slate-400">累计</span>
                      <span className="text-slate-300">
                        {(pcaResult.explainedVarianceRatio.reduce((a, b) => a + b, 0) * 100).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* PCA散点图 */}
              {pcaComponents >= 2 && (
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-100">主成分投影</CardTitle>
                    <CardDescription className="text-slate-400">
                      PC1 vs PC2
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="pc1" name="PC1" stroke="#94a3b8" />
                        <YAxis dataKey="pc2" name="PC2" stroke="#94a3b8" />
                        <ZAxis range={[30, 30]} />
                        <Tooltip
                          cursor={{ strokeDasharray: '3 3' }}
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        />
                        <Scatter data={pcaScatterData} fill="#14b8a6" />
                      </ScatterChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
