// 神经网络算法实现 (MLP)
import type { DataRow, NeuralNetworkConfig, TrainingResult } from '@/types';

interface NeuralNetwork {
  weights: number[][][];
  biases: number[][];
  config: NeuralNetworkConfig;
}

// 创建神经网络
function createNetwork(config: NeuralNetworkConfig): NeuralNetwork {
  const { layers, inputSize } = config;
  const weights: number[][][] = [];
  const biases: number[][] = [];
  
  let prevSize = inputSize;
  
  for (const layer of layers) {
    const size = layer.neurons || 1;
    weights.push(
      Array(size).fill(null).map(() =>
        Array(prevSize).fill(null).map(() => (Math.random() - 0.5) * 2 / Math.sqrt(prevSize))
      )
    );
    biases.push(Array(size).fill(null).map(() => 0));
    prevSize = size;
  }
  
  return { weights, biases, config };
}

// 激活函数
function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, x))));
}

function sigmoidDerivative(x: number): number {
  return x * (1 - x);
}

function relu(x: number): number {
  return Math.max(0, x);
}

function reluDerivative(x: number): number {
  return x > 0 ? 1 : 0;
}

function tanh(x: number): number {
  return Math.tanh(x);
}

function tanhDerivative(x: number): number {
  return 1 - x * x;
}

function getActivation(name: string): { f: (x: number) => number; df: (x: number) => number } {
  switch (name) {
    case 'relu':
      return { f: relu, df: reluDerivative };
    case 'tanh':
      return { f: tanh, df: tanhDerivative };
    default:
      return { f: sigmoid, df: sigmoidDerivative };
  }
}

// 前向传播
function forward(
  network: NeuralNetwork,
  input: number[]
): { activations: number[][]; outputs: number[] } {
  const { weights, biases, config } = network;
  const activation = getActivation(config.activation);
  
  const activations: number[][] = [input];
  let current = input;
  
  for (let i = 0; i < weights.length; i++) {
    const next: number[] = [];
    const isLast = i === weights.length - 1;
    
    for (let j = 0; j < weights[i].length; j++) {
      let sum = biases[i][j];
      for (let k = 0; k < current.length; k++) {
        sum += weights[i][j][k] * current[k];
      }
      
      if (isLast && config.task === 'classification') {
        next.push(sigmoid(sum));
      } else if (isLast) {
        next.push(sum); // 回归任务输出层不激活
      } else {
        next.push(activation.f(sum));
      }
    }
    
    activations.push(next);
    current = next;
  }
  
  return { activations, outputs: current };
}

// 反向传播
function backward(
  network: NeuralNetwork,
  activations: number[][],
  target: number[],
  learningRate: number
): void {
  const { weights, biases, config } = network;
  const activation = getActivation(config.activation);
  
  // 计算输出层误差
  const outputLayer = activations.length - 1;
  const deltas: number[][] = [];
  
  const outputDelta: number[] = [];
  for (let i = 0; i < activations[outputLayer].length; i++) {
    const output = activations[outputLayer][i];
    const error = target[i] - output;
    
    if (config.task === 'classification') {
      outputDelta.push(error * sigmoidDerivative(output));
    } else {
      outputDelta.push(error); // MSE梯度
    }
  }
  deltas.unshift(outputDelta);
  
  // 反向传播隐藏层
  for (let i = outputLayer - 1; i >= 1; i--) {
    const delta: number[] = [];
    for (let j = 0; j < activations[i].length; j++) {
      let error = 0;
      for (let k = 0; k < deltas[0].length; k++) {
        error += deltas[0][k] * weights[i][k][j];
      }
      delta.push(error * activation.df(activations[i][j]));
    }
    deltas.unshift(delta);
  }
  
  // 更新权重和偏置
  for (let i = 0; i < weights.length; i++) {
    for (let j = 0; j < weights[i].length; j++) {
      for (let k = 0; k < weights[i][j].length; k++) {
        weights[i][j][k] += learningRate * deltas[i][j] * activations[i][k];
      }
      biases[i][j] += learningRate * deltas[i][j];
    }
  }
}

// 训练神经网络
export function trainNeuralNetwork(
  data: DataRow[],
  config: NeuralNetworkConfig,
  inputColumns: string[],
  outputColumn: string,
  onProgress?: (epoch: number, loss: number) => void
): TrainingResult {
  const { learningRate, iterations, batchSize, task } = config;
  
  // 准备数据
  const inputs: number[][] = data.map(row =>
    inputColumns.map(col => {
      const v = row[col];
      return typeof v === 'number' ? v : 0;
    })
  );
  
  const targets: number[][] = data.map(row => {
    const v = row[outputColumn];
    if (task === 'classification') {
      // 分类任务：转换为one-hot或二分类
      const numClasses = new Set(data.map(d => d[outputColumn])).size;
      if (numClasses === 2) {
        return [typeof v === 'number' && v > 0 ? 1 : 0];
      }
      // 多分类one-hot
      const oneHot = new Array(numClasses).fill(0);
      if (typeof v === 'number') oneHot[Math.floor(v)] = 1;
      return oneHot;
    }
    return [typeof v === 'number' ? v : 0];
  });
  
  // 标准化输入
  const inputMeans = new Array(inputColumns.length).fill(0);
  const inputStds = new Array(inputColumns.length).fill(1);
  
  for (let i = 0; i < inputColumns.length; i++) {
    const values = inputs.map(inp => inp[i]);
    inputMeans[i] = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - inputMeans[i], 2), 0) / values.length;
    inputStds[i] = Math.sqrt(variance) || 1;
  }
  
  const normalizedInputs = inputs.map(inp =>
    inp.map((v, i) => (v - inputMeans[i]) / inputStds[i])
  );
  
  // 创建网络
  const actualConfig: NeuralNetworkConfig = {
    ...config,
    inputSize: inputColumns.length,
    outputSize: targets[0].length,
  };
  
  const network = createNetwork(actualConfig);
  
  // 训练循环
  const lossHistory: number[] = [];
  const n = normalizedInputs.length;
  
  for (let epoch = 0; epoch < iterations; epoch++) {
    let totalLoss = 0;
    
    // 打乱数据
    const indices = [...Array(n).keys()];
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // 批量训练
    for (let batch = 0; batch < n; batch += batchSize) {
      const batchEnd = Math.min(batch + batchSize, n);
      
      for (let i = batch; i < batchEnd; i++) {
        const idx = indices[i];
        const { activations, outputs } = forward(network, normalizedInputs[idx]);
        
        // 计算损失
        for (let j = 0; j < outputs.length; j++) {
          totalLoss += 0.5 * Math.pow(targets[idx][j] - outputs[j], 2);
        }
        
        backward(network, activations, targets[idx], learningRate);
      }
    }
    
    const avgLoss = totalLoss / n;
    lossHistory.push(avgLoss);
    
    if (onProgress && epoch % 10 === 0) {
      onProgress(epoch, avgLoss);
    }
  }
  
  // 预测
  const predictions: number[] = [];
  const actualValues: number[] = [];
  
  for (let i = 0; i < n; i++) {
    const { outputs } = forward(network, normalizedInputs[i]);
    
    if (task === 'classification') {
      predictions.push(outputs[0] > 0.5 ? 1 : 0);
    } else {
      predictions.push(outputs[0]);
    }
    actualValues.push(targets[i][0]);
  }
  
  // 计算准确率（分类）或R²（回归）
  let accuracy: number | undefined;
  let confusionMatrix: number[][] | undefined;
  
  if (task === 'classification') {
    const correct = predictions.filter((p, i) => p === actualValues[i]).length;
    accuracy = correct / n;
    
    // 混淆矩阵（二分类）
    let tp = 0, fp = 0, tn = 0, fn = 0;
    for (let i = 0; i < n; i++) {
      if (predictions[i] === 1 && actualValues[i] === 1) tp++;
      else if (predictions[i] === 1 && actualValues[i] === 0) fp++;
      else if (predictions[i] === 0 && actualValues[i] === 0) tn++;
      else fn++;
    }
    confusionMatrix = [[tn, fp], [fn, tp]];
  } else {
    // R²分数
    const meanActual = actualValues.reduce((a, b) => a + b, 0) / n;
    const ssTot = actualValues.reduce((sum, v) => sum + Math.pow(v - meanActual, 2), 0);
    const ssRes = predictions.reduce((sum, p, i) => sum + Math.pow(actualValues[i] - p, 2), 0);
    accuracy = 1 - ssRes / ssTot;
  }
  
  return {
    lossHistory,
    accuracy,
    predictions,
    actualValues,
    confusionMatrix,
  };
}
