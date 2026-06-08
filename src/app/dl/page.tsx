'use client';

import { useState, useRef, useEffect } from 'react';
import { useAppState } from '@/context/AppContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ScatterChart, Scatter, ZAxis } from 'recharts';
import { Play, Network, Settings, TrendingUp, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { trainNeuralNetwork } from '@/lib/neural-network';
import type { NeuralNetworkConfig, NeuralLayer } from '@/types';

export default function DLPage() {
  const { dataset, processedData, neuralResult, setNeuralResult, setIsLoading, setError } = useAppState();
  const [task, setTask] = useState<'classification' | 'regression'>('classification');
  const [learningRate, setLearningRate] = useState(0.01);
  const [iterations, setIterations] = useState(100);
  const [batchSize, setBatchSize] = useState(32);
  const [hiddenLayers, setHiddenLayers] = useState<number[]>([16, 8]);
  const [inputColumns, setInputColumns] = useState<string[]>([]);
  const [outputColumn, setOutputColumn] = useState<string>('');
  const [trainingProgress, setTrainingProgress] = useState({ epoch: 0, loss: 0 });
  const [isTraining, setIsTraining] = useState(false);

  const currentData = processedData || dataset?.data || [];

  const numericColumns = dataset?.columns.filter(
    col => dataset.columnTypes[col] === 'number'
  ) || [];

  const runTraining = async () => {
    if (inputColumns.length === 0) {
      setError('请选择输入特征列');
      return;
    }
    if (!outputColumn) {
      setError('请选择输出列');
      return;
    }

    setIsTraining(true);
    setIsLoading(true);
    
    try {
      const layers: NeuralLayer[] = hiddenLayers.map(neurons => ({
        type: 'dense' as const,
        neurons,
        activation: 'relu',
      }));
      layers.push({ type: 'dense', neurons: task === 'classification' ? 1 : 1 });

      const config: NeuralNetworkConfig = {
        type: 'mlp',
        layers,
        inputSize: inputColumns.length,
        outputSize: 1,
        task,
        activation: 'relu',
        learningRate,
        iterations,
        batchSize: Math.min(batchSize, currentData.length),
      };

      const result = trainNeuralNetwork(
        currentData,
        config,
        inputColumns,
        outputColumn,
        (epoch, loss) => {
          setTrainingProgress({ epoch, loss });
        }
      );

      setNeuralResult(result);
    } catch (err) {
      setError(`神经网络训练失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsTraining(false);
      setIsLoading(false);
    }
  };

  // 损失曲线数据
  const lossData = neuralResult?.lossHistory.map((loss, i) => ({
    epoch: i + 1,
    loss,
  })) || [];

  // 预测vs实际散点图数据
  const predictionData = neuralResult?.predictions.map((pred, i) => ({
    actual: neuralResult.actualValues[i],
    predicted: pred,
  })) || [];

  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="bg-slate-800 border-slate-700 w-96">
          <CardContent className="pt-6 text-center">
            <Network className="w-12 h-12 mx-auto mb-4 text-slate-500" />
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
          <h1 className="text-2xl font-bold text-slate-100">深度学习</h1>
          <p className="text-slate-400">神经网络分类与回归模型</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700 col-span-2">
          <CardHeader>
            <CardTitle className="text-slate-100">网络配置</CardTitle>
            <CardDescription className="text-slate-400">
              配置MLP神经网络结构和训练参数
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">任务类型</Label>
                <Select value={task} onValueChange={(v) => setTask(v as typeof task)}>
                  <SelectTrigger className="bg-slate-700 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-700 border-slate-600">
                    <SelectItem value="classification">分类</SelectItem>
                    <SelectItem value="regression">回归</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">学习率</Label>
                <Input
                  type="number"
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  step="0.001"
                  min="0.0001"
                  max="1"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">迭代次数</Label>
                <Input
                  type="number"
                  value={iterations}
                  onChange={(e) => setIterations(Number(e.target.value))}
                  min="10"
                  max="1000"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">批次大小</Label>
                <Input
                  type="number"
                  value={batchSize}
                  onChange={(e) => setBatchSize(Number(e.target.value))}
                  min="1"
                  max="256"
                  className="bg-slate-700 border-slate-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">隐藏层结构</Label>
              <div className="flex items-center gap-2">
                {hiddenLayers.map((neurons, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={neurons}
                      onChange={(e) => {
                        const newLayers = [...hiddenLayers];
                        newLayers[i] = Number(e.target.value);
                        setHiddenLayers(newLayers);
                      }}
                      min="1"
                      max="128"
                      className="w-20 bg-slate-700 border-slate-600"
                    />
                    <span className="text-slate-500 text-sm">→</span>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHiddenLayers([...hiddenLayers, 8])}
                  className="border-slate-600"
                >
                  +
                </Button>
                {hiddenLayers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setHiddenLayers(hiddenLayers.slice(0, -1))}
                    className="border-slate-600"
                  >
                    -
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">输入特征列</Label>
              <div className="flex flex-wrap gap-2">
                {numericColumns.map((col) => (
                  <Button
                    key={col}
                    variant={inputColumns.includes(col) ? 'default' : 'outline'}
                    size="sm"
                    className={inputColumns.includes(col)
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : 'border-slate-600 text-slate-300'
                    }
                    onClick={() => {
                      setInputColumns(prev =>
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

            <div className="space-y-2">
              <Label className="text-slate-300">输出列</Label>
              <Select value={outputColumn} onValueChange={setOutputColumn}>
                <SelectTrigger className="bg-slate-700 border-slate-600">
                  <SelectValue placeholder="选择输出列" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  {numericColumns.map((col) => (
                    <SelectItem key={col} value={col} className="text-slate-200">
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={runTraining}
              disabled={isTraining}
              className="w-full bg-orange-500 hover:bg-orange-600"
            >
              <Play className="w-4 h-4 mr-2" />
              {isTraining ? `训练中... (Epoch ${trainingProgress.epoch})` : '开始训练'}
            </Button>
          </CardContent>
        </Card>

        {/* 网络结构可视化 */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-slate-100">网络结构</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center gap-2 p-4">
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 rounded bg-blue-500/20 border border-blue-500 flex items-center justify-center text-xs text-blue-400">
                  输入 ({inputColumns.length})
                </div>
              </div>
              <div className="text-slate-500">↓</div>
              {hiddenLayers.map((neurons, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-16 h-8 rounded bg-purple-500/20 border border-purple-500 flex items-center justify-center text-xs text-purple-400">
                    隐藏 ({neurons})
                  </div>
                </div>
              ))}
              <div className="text-slate-500">↓</div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-8 rounded bg-green-500/20 border border-green-500 flex items-center justify-center text-xs text-green-400">
                  输出 (1)
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">总参数</span>
                <span className="text-slate-300">
                  {(() => {
                    let params = 0;
                    let prev = inputColumns.length;
                    for (const n of hiddenLayers) {
                      params += prev * n + n;
                      prev = n;
                    }
                    params += prev + 1;
                    return params;
                  })()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">激活函数</span>
                <span className="text-slate-300">ReLU</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {neuralResult && (
        <div className="grid grid-cols-2 gap-4">
          {/* 训练结果 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">训练结果</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">最终损失</p>
                <p className="text-2xl font-bold text-slate-200">
                  {neuralResult.lossHistory[neuralResult.lossHistory.length - 1]?.toFixed(6) || '-'}
                </p>
              </div>
              <div className="p-3 bg-slate-700/50 rounded-lg">
                <p className="text-sm text-slate-400">{task === 'classification' ? '准确率' : 'R² 分数'}</p>
                <p className="text-2xl font-bold text-slate-200">
                  {neuralResult.accuracy !== undefined ? (neuralResult.accuracy * 100).toFixed(2) + '%' : '-'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 损失曲线 */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">损失曲线</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={lossData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="epoch" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Line type="monotone" dataKey="loss" stroke="#f97316" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 预测vs实际 */}
          <Card className="bg-slate-800 border-slate-700 col-span-2">
            <CardHeader>
              <CardTitle className="text-slate-100">预测 vs 实际</CardTitle>
              <CardDescription className="text-slate-400">
                模型预测值与实际值的对比
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    dataKey="actual"
                    name="实际值"
                    stroke="#94a3b8"
                  />
                  <YAxis
                    dataKey="predicted"
                    name="预测值"
                    stroke="#94a3b8"
                  />
                  <ZAxis range={[30, 30]} />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  />
                  <Scatter data={predictionData} fill="#f97316" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 混淆矩阵 */}
          {task === 'classification' && neuralResult.confusionMatrix && (
            <Card className="bg-slate-800 border-slate-700 col-span-2">
              <CardHeader>
                <CardTitle className="text-slate-100">混淆矩阵</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                  <div></div>
                  <div className="text-center text-sm text-slate-400">预测: 0</div>
                  <div className="text-center text-sm text-slate-400">预测: 1</div>
                  <div className="text-sm text-slate-400">实际: 0</div>
                  <div className="p-3 bg-red-500/20 rounded text-center font-bold text-slate-200">
                    {neuralResult.confusionMatrix[0][0]}
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded text-center font-bold text-slate-200">
                    {neuralResult.confusionMatrix[0][1]}
                  </div>
                  <div className="text-sm text-slate-400">实际: 1</div>
                  <div className="p-3 bg-orange-500/20 rounded text-center font-bold text-slate-200">
                    {neuralResult.confusionMatrix[1][0]}
                  </div>
                  <div className="p-3 bg-green-500/20 rounded text-center font-bold text-slate-200">
                    {neuralResult.confusionMatrix[1][1]}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
