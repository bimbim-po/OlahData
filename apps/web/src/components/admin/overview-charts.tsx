'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, DollarSign } from 'lucide-react';

interface OverviewChartsProps {
  dailyActivity: Array<{ date: string; signups: number; dau: number }>;
  weeklyMrr: Array<{ week: string; mrr: number }>;
}

export function OverviewCharts({ dailyActivity, weeklyMrr }: OverviewChartsProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pendaftar Baru vs Pengguna Aktif (DAU)</CardTitle>
          </CardHeader>
          <CardContent><div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg" /></CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Pertumbuhan MRR Mingguan</CardTitle>
          </CardHeader>
          <CardContent><div className="h-64 w-full bg-muted/20 animate-pulse rounded-lg" /></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Daily Signups vs DAU */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Pendaftar Baru vs Pengguna Aktif (DAU)</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Tren pergerakan pengguna harian dalam 7 hari terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyActivity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="signups" name="Pendaftar" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="dau" name="DAU" fill="#C98A1B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Weekly MRR Growth */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <CardTitle className="text-sm font-semibold">Pertumbuhan MRR Mingguan</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Estimasi Monthly Recurring Revenue dari langganan aktif (Rp)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyMrr} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(val) => `Rp${(val / 1000).toLocaleString('id-ID')}k`}
                />
                <Tooltip
                  formatter={(val) => [`Rp${Number(val).toLocaleString('id-ID')}`, 'MRR']}
                  contentStyle={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area
                  type="monotone"
                  dataKey="mrr"
                  name="MRR"
                  stroke="#1F6F5C"
                  fill="#1F6F5C"
                  fillOpacity={0.15}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
