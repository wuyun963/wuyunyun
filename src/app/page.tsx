'use client';

import Link from 'next/link';
import { useAppState } from '@/context/AppContext';
import { 
  Database, BarChart3, Brain, Network, Globe, 
  ArrowRight, Upload, TrendingUp, PieChart 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: '数据管理',
    description: '上传CSV/JSON数据文件，或使用爬虫从网页采集数据',
    icon: Database,
    path: '/data',
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  {
    title: '数据预处理',
    description: '缺失值处理、异常值检测、数据标准化与统计分析',
    icon: BarChart3,
    path: '/preprocess',
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  {
    title: '机器学习',
    description: 'K-means聚类分析与PCA主成分降维',
    icon: Brain,
    path: '/ml',
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  {
    title: '深度学习',
    description: '构建MLP神经网络进行分类与回归任务',
    icon: Network,
    path: '/dl',
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
];

export default function DashboardPage() {
  const { dataset } = useAppState();

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-800/50 rounded-xl p-8 border border-slate-700">
        <h1 className="text-3xl font-bold text-slate-100 mb-2">
          数据挖掘与机器学习实践平台
        </h1>
        <p className="text-slate-400 mb-6 max-w-2xl">
          一个集成数据挖掘全流程的网页应用，支持数据采集、预处理、传统机器学习与深度学习，
          为数据分析与模型构建提供一站式解决方案。
        </p>
        
        <div className="flex gap-4">
          <Link href="/data">
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Upload className="w-4 h-4 mr-2" />
              开始使用
            </Button>
          </Link>
          <Link href="/data?demo=true">
            <Button variant="outline" className="border-slate-600 text-slate-300">
              加载示例数据
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {dataset ? dataset.rowCount : 0}
                </p>
                <p className="text-sm text-slate-400">数据行数</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">
                  {dataset ? dataset.columns.length : 0}
                </p>
                <p className="text-sm text-slate-400">特征数量</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">2</p>
                <p className="text-sm text-slate-400">ML算法</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <PieChart className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-100">1</p>
                <p className="text-sm text-slate-400">神经网络</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.path} className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <Link href={feature.path}>
                    <Button variant="ghost" size="sm" className="text-slate-400 hover:text-slate-200">
                      进入 <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
                <CardTitle className="text-slate-100 mt-4">{feature.title}</CardTitle>
                <CardDescription className="text-slate-400">
                  {feature.description}
                </CardDescription>
              </CardHeader>
            </Card>
          );
        })}
      </div>

      {/* Quick Guide */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-slate-100">快速开始指南</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {['上传数据', '预处理', '模型训练', '结果导出'].map((step, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-slate-300 font-medium">
                  {i + 1}
                </div>
                <span className="text-slate-300">{step}</span>
                {i < 3 && <ArrowRight className="w-4 h-4 text-slate-500" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
