'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Database,
  BarChart3,
  Brain,
  Network,
  Globe,
  Download,
  Home,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    id: 'dashboard',
    name: '控制台',
    icon: Home,
    path: '/',
    description: '数据概览与快速操作',
  },
  {
    id: 'data',
    name: '数据管理',
    icon: Database,
    path: '/data',
    description: '数据上传与爬虫采集',
  },
  {
    id: 'preprocess',
    name: '数据预处理',
    icon: BarChart3,
    path: '/preprocess',
    description: '清洗、转换与统计分析',
  },
  {
    id: 'ml',
    name: '机器学习',
    icon: Brain,
    path: '/ml',
    description: 'K-means聚类与PCA降维',
  },
  {
    id: 'dl',
    name: '深度学习',
    icon: Network,
    path: '/dl',
    description: '神经网络分类与回归',
  },
  {
    id: 'crawler',
    name: '网络爬虫',
    icon: Globe,
    path: '/crawler',
    description: '网页数据采集',
  },
  {
    id: 'export',
    name: '结果导出',
    icon: Download,
    path: '/export',
    description: '数据与模型结果导出',
  },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 h-screen bg-slate-900 border-r border-slate-700 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">DM & ML</h1>
            <p className="text-xs text-slate-400">数据挖掘实践平台</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path || 
              (item.path !== '/' && pathname.startsWith(item.path));
            const Icon = item.icon;
            
            return (
              <li key={item.id}>
                <Link
                  href={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                    isActive
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.name}</div>
                    <div className={cn(
                      'text-xs truncate',
                      isActive ? 'text-blue-400/70' : 'text-slate-500'
                    )}>
                      {item.description}
                    </div>
                  </div>
                  {isActive && (
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 text-center">
          数据挖掘与机器学习<br />期末大作业
        </div>
      </div>
    </aside>
  );
}
