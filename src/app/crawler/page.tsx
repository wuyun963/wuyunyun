'use client';

import { useState } from 'react';
import { useAppState } from '@/context/AppContext';
import { Globe, Play, Link, Settings, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { createDataset, calculateStatistics } from '@/lib/data-utils';
import type { DataRow } from '@/types';

// 模拟爬取的数据示例
const mockCrawlData: DataRow[] = [
  { id: 1, title: '人工智能技术进展', views: 12500, likes: 856, date: '2024-01-15' },
  { id: 2, title: '机器学习入门指南', views: 8900, likes: 542, date: '2024-01-14' },
  { id: 3, title: '深度学习框架对比', views: 15600, likes: 1023, date: '2024-01-13' },
  { id: 4, title: '自然语言处理应用', views: 7200, likes: 345, date: '2024-01-12' },
  { id: 5, title: '计算机视觉新突破', views: 18400, likes: 1567, date: '2024-01-11' },
  { id: 6, title: '数据科学最佳实践', views: 9800, likes: 678, date: '2024-01-10' },
  { id: 7, title: 'Python数据分析', views: 11200, likes: 890, date: '2024-01-09' },
  { id: 8, title: '神经网络架构设计', views: 14500, likes: 1123, date: '2024-01-08' },
];

export default function CrawlerPage() {
  const { setDataset, setStatistics, setError } = useAppState();
  const [url, setUrl] = useState('');
  const [selector, setSelector] = useState('');
  const [crawlType, setCrawlType] = useState<'web' | 'api'>('web');
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlResult, setCrawlResult] = useState<DataRow[] | null>(null);
  const [crawlLog, setCrawlLog] = useState<string[]>([]);

  const handleCrawl = async () => {
    if (!url) {
      setError('请输入目标URL');
      return;
    }

    setIsCrawling(true);
    setCrawlLog([]);
    setCrawlResult(null);

    // 模拟爬取过程
    const logs = [
      '正在连接目标服务器...',
      '获取网页内容...',
      '解析数据结构...',
      '提取目标数据...',
      '数据清洗完成!',
    ];

    for (let i = 0; i < logs.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setCrawlLog(prev => [...prev, logs[i]]);
    }

    // 使用模拟数据
    setCrawlResult(mockCrawlData);
    setIsCrawling(false);
  };

  const handleLoadAsDataset = () => {
    if (!crawlResult) return;
    
    const dataset = createDataset('爬取数据', crawlResult, 'crawler');
    setDataset(dataset);
    setStatistics(calculateStatistics(crawlResult, dataset.columns));
  };

  const demoUrls = [
    { name: '示例新闻数据', url: 'https://example.com/news', selector: '.news-item' },
    { name: '示例商品数据', url: 'https://example.com/products', selector: '.product-card' },
    { name: '示例用户数据', url: 'https://example.com/users', selector: '.user-profile' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">网络爬虫</h1>
          <p className="text-slate-400">从网页或API采集数据</p>
        </div>
      </div>

      <Tabs defaultValue="crawler" className="space-y-4">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="crawler" className="data-[state=active]:bg-slate-700">
            <Globe className="w-4 h-4 mr-2" />
            网页爬取
          </TabsTrigger>
          <TabsTrigger value="demo" className="data-[state=active]:bg-slate-700">
            <FileText className="w-4 h-4 mr-2" />
            示例模板
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crawler" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-slate-100">爬取配置</CardTitle>
              <CardDescription className="text-slate-400">
                配置目标URL和数据提取规则
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">爬取类型</Label>
                  <Select value={crawlType} onValueChange={(v) => setCrawlType(v as typeof crawlType)}>
                    <SelectTrigger className="bg-slate-700 border-slate-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="web">网页爬取</SelectItem>
                      <SelectItem value="api">API接口</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">目标URL</Label>
                  <Input
                    placeholder="https://example.com/data"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>

              {crawlType === 'web' && (
                <div className="space-y-2">
                  <Label className="text-slate-300">CSS选择器 (可选)</Label>
                  <Input
                    placeholder=".data-item"
                    value={selector}
                    onChange={(e) => setSelector(e.target.value)}
                    className="bg-slate-700 border-slate-600"
                  />
                  <p className="text-sm text-slate-500">
                    用于定位要提取的数据元素，如 .article 或 #data-table
                  </p>
                </div>
              )}

              <Button
                onClick={handleCrawl}
                disabled={isCrawling}
                className="w-full bg-teal-500 hover:bg-teal-600"
              >
                <Play className="w-4 h-4 mr-2" />
                {isCrawling ? '爬取中...' : '开始爬取'}
              </Button>
            </CardContent>
          </Card>

          {/* 爬取日志 */}
          {crawlLog.length > 0 && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-slate-100">爬取日志</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm space-y-1 bg-slate-900 rounded-lg p-4 max-h-48 overflow-auto">
                  {crawlLog.map((log, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span className="text-slate-300">{log}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 爬取结果 */}
          {crawlResult && (
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-100">爬取结果</CardTitle>
                    <CardDescription className="text-slate-400">
                      共获取 {crawlResult.length} 条数据
                    </CardDescription>
                  </div>
                  <Button onClick={handleLoadAsDataset} className="bg-blue-500 hover:bg-blue-600">
                    加载为数据集
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-700 overflow-auto max-h-96">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-700/50 hover:bg-slate-700/50">
                        {Object.keys(crawlResult[0]).map((key) => (
                          <TableHead key={key} className="text-slate-300">
                            {key}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {crawlResult.map((row, i) => (
                        <TableRow key={i} className="border-slate-700">
                          {Object.values(row).map((value, j) => (
                            <TableCell key={j} className="text-slate-300">
                              {String(value)}
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

        <TabsContent value="demo" className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {demoUrls.map((demo) => (
              <Card
                key={demo.name}
                className="bg-slate-800 border-slate-700 hover:border-slate-600 transition-colors cursor-pointer"
                onClick={() => {
                  setUrl(demo.url);
                  setSelector(demo.selector);
                }}
              >
                <CardHeader>
                  <CardTitle className="text-slate-100 flex items-center gap-2">
                    <Link className="w-5 h-5 text-teal-400" />
                    {demo.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-slate-400 truncate">{demo.url}</p>
                  <p className="text-xs text-slate-500">选择器: {demo.selector}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Alert className="bg-yellow-500/10 border-yellow-500/50">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-yellow-400">
              注意: 实际爬取功能需要后端支持。此处为演示模式，将返回模拟数据。
              在实际应用中，请确保遵守目标网站的robots.txt规则和相关法律法规。
            </p>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
