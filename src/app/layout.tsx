import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/context/AppContext';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: {
    default: '数据挖掘与机器学习实践平台',
    template: '%s | DM & ML',
  },
  description: '一个集成数据挖掘全流程的网页应用，包含爬虫、数据预处理、机器学习和深度学习模块。',
  keywords: [
    '数据挖掘',
    '机器学习',
    '深度学习',
    'K-means',
    'PCA',
    '神经网络',
    '数据预处理',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="dark">
      <body className="antialiased">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
