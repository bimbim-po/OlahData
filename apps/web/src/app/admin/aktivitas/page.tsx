'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Activity,
  Play,
  Pause,
  Filter,
  Clock,
  Flame,
  UserCheck,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface FeedEvent {
  id: string;
  event: string;
  userName: string;
  props: Record<string, unknown>;
  timestamp: string;
}

const INITIAL_EVENTS: FeedEvent[] = [
  { id: '1', event: 'analysis_succeeded', userName: 'Budi Santoso', props: { tests_count: 9, duration_seconds: 4.8 }, timestamp: 'Baru saja' },
  { id: '2', event: 'export_created', userName: 'Ahmad Fauzi', props: { format: 'docx', watermark: false }, timestamp: '2 menit lalu' },
  { id: '3', event: 'dataset_uploaded', userName: 'Dewi Lestari', props: { n_rows: 140, n_cols: 18 }, timestamp: '5 menit lalu' },
  { id: '4', event: 'project_created', userName: 'Dewi Lestari', props: { research_type: 'Regresi Linier Berganda' }, timestamp: '7 menit lalu' },
  { id: '5', event: 'login', userName: 'Siti Rahma', props: { provider: 'email' }, timestamp: '12 menit lalu' },
  { id: '6', event: 'plan_paid', userName: 'Ahmad Fauzi', props: { plan: 'thesis', amount: 99000 }, timestamp: '24 menit lalu' },
  { id: '7', event: 'analysis_started', userName: 'Budi Santoso', props: { tests_count: 9 }, timestamp: '35 menit lalu' },
];

export default function AktivitasPage() {
  const [events, setEvents] = useState<FeedEvent[]>(INITIAL_EVENTS);
  const [isLive, setIsLive] = useState(true);
  const [filterEvent, setFilterEvent] = useState('all');
  const [search, setSearch] = useState('');

  // Polling simulation
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      // Simulate live incoming event occasionally
      setEvents((prev) => {
        if (Math.random() > 0.6) {
          const newEv: FeedEvent = {
            id: String(Date.now()),
            event: 'login',
            userName: 'Mahasiswa Baru',
            props: { method: 'google_oauth' },
            timestamp: 'Baru saja',
          };
          return [newEv, ...prev.slice(0, 19)];
        }
        return prev;
      });
    }, 15000);
    return () => clearInterval(interval);
  }, [isLive]);

  const topEvents = [
    { event: 'analysis_succeeded', count: 312, label: 'Kalkulasi Statistik Selesai' },
    { event: 'dataset_uploaded', count: 184, label: 'Unggah Dataset' },
    { event: 'login', count: 520, label: 'Login Mahasiswa' },
    { event: 'export_created', count: 142, label: 'Ekspor Word/PDF' },
  ];

  const peakHours = [
    { hour: '14:00 - 16:00 WIB', activity: 'Paling Ramai (32% aktivitas)' },
    { hour: '19:00 - 22:00 WIB', activity: 'Tinggi (Mahasiswa bimbingan)' },
    { hour: '09:00 - 11:00 WIB', activity: 'Sedang' },
  ];

  const filteredEvents = events.filter((e) => {
    if (filterEvent !== 'all' && e.event !== filterEvent) return false;
    if (search && !e.userName.toLowerCase().includes(search.toLowerCase()) && !e.event.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight">
            Umpan Aktivitas Real-Time
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Aliran kejadian produk (app_events) langsung dari interaksi pengguna (metadata saja).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isLive ? 'default' : 'outline'}
            className="text-xs"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2" />
                Live Polling (Aktif)
              </>
            ) : (
              <>
                <Pause className="w-3.5 h-3.5 mr-1.5" />
                Jeda (Paused)
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Aggregates Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-600" />
              <CardTitle className="text-xs font-semibold">Event Paling Sering</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {topEvents.map((te) => (
              <div key={te.event} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-mono">{te.event}</span>
                <span className="font-semibold tabular-nums">{te.count.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <CardTitle className="text-xs font-semibold">Jam Tersibuk (Asia/Jakarta)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {peakHours.map((ph, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <span className="font-medium text-foreground">{ph.hour}</span>
                <span className="text-[11px] text-muted-foreground">{ph.activity}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <CardTitle className="text-xs font-semibold">Pengguna Paling Aktif (30d)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 pt-0 text-xs">
            <div className="flex items-center justify-between">
              <span>Budi Santoso</span>
              <span className="font-mono text-muted-foreground">34 aktivitas</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Ahmad Fauzi</span>
              <span className="font-mono text-muted-foreground">28 aktivitas</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Dewi Lestari</span>
              <span className="font-mono text-muted-foreground">16 aktivitas</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Stream Filter Bar */}
      <Card className="border-border/60">
        <CardContent className="p-3.5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Cari event atau nama pengguna..."
              className="pl-8.5 h-8 text-xs"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              className="h-8 rounded-md border border-input bg-background px-2 text-xs shadow-xs"
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
            >
              <option value="all">Semua Tipe Event</option>
              <option value="analysis_succeeded">analysis_succeeded</option>
              <option value="dataset_uploaded">dataset_uploaded</option>
              <option value="export_created">export_created</option>
              <option value="login">login</option>
              <option value="plan_paid">plan_paid</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Event Stream List */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {filteredEvents.map((ev) => (
              <div key={ev.id} className="p-4 flex items-start gap-3 hover:bg-muted/20 transition-colors">
                <Activity className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs font-mono">{ev.event}</span>
                      <span className="text-xs text-muted-foreground">• oleh</span>
                      <span className="text-xs font-medium text-foreground">{ev.userName}</span>
                    </div>
                    <span className="text-[11px] text-muted-foreground tabular-nums">{ev.timestamp}</span>
                  </div>
                  <pre className="mt-1.5 p-2 rounded bg-muted/50 text-[10px] font-mono overflow-x-auto text-muted-foreground">
                    {JSON.stringify(ev.props)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
