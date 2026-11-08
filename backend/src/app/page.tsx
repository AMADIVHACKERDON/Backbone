'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const MOCK_CARRIERS = ['MTN Nigeria', 'Airtel Nigeria', 'Glo Mobile'];

const pingFetcher = async (url: string): Promise<number> => {
  const start = performance.now();
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error('Ping failed');
  return Math.round(performance.now() - start);
};

export default function NetworkMonitor() {
  const [activeCarrier, setActiveCarrier] = useState(MOCK_CARRIERS[0]);
  const [logs, setLogs] = useState<string[]>(['System initialized. Monitoring network...']);
  const [esimLoading, setEsimLoading] = useState(false);
  const [esimData, setEsimData] = useState<{ esim_iccid: string; esim_qr_code: string } | null>(null);

  const activateEsim = async () => {
    setEsimLoading(true);
    addLog('Requesting multi-carrier eSIM from Zendit Sandbox...');
    try {
      const res = await fetch('/api/provision-esim', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provisioning failed');

      setEsimData(data.profile);
      setActiveCarrier(data.profile.active_network);
      addLog(`✅ eSIM Activated! ICCID: ${data.profile.esim_iccid}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error';
      addLog(`❌ eSIM Error: ${msg}`);
    } finally {
      setEsimLoading(false);
    }
  };
  
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${time}] ${msg}`, ...prev.slice(0, 9)]);
  };

  const switchCarrierMock = (reason: string) => {
    setActiveCarrier((current) => {
      const next = MOCK_CARRIERS.find((c) => c !== current) || MOCK_CARRIERS[0];
      addLog(`⚠️ ${reason} — Auto-switched to ${next} (Simulated)`);
      return next;
    });
  };

  // SWR replaces useEffect + setInterval cleanly
  const { data: latency, error } = useSWR('/api/ping', pingFetcher, {
    refreshInterval: 3000,
    shouldRetryOnError: false,
    onSuccess: (ms) => {
      if (ms > 500) {
        switchCarrierMock(`High latency (${ms}ms)`);
      }
    },
    onError: () => {
      switchCarrierMock('Connection dropped');
    },
  });

  const router = useRouter();
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };
  
  // Derive health status directly without extra state
  const status = error
    ? 'Offline'
    : latency && latency > 500
    ? 'Weak'
    : 'Optimal';

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-1">Aetekonect Core</h1>
      <button onClick={() => handleLogout()}>Sign Out</button>
      <p className="text-slate-400 text-sm mb-6">Real-time Signal Intelligence (SWR Prototype)</p>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Active Network (Mock)</span>
          <span className="font-semibold text-emerald-400">{activeCarrier}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Real-Time Latency</span>
          <span className="font-mono text-lg">
            {error ? 'Disconnected' : latency !== undefined ? `${latency} ms` : 'Measuring...'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-slate-400 text-sm">Connection Health</span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              status === 'Optimal'
                ? 'bg-emerald-500/20 text-emerald-300'
                : status === 'Weak'
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-red-500/20 text-red-300'
            }`}
          >
            {status}
          </span>
        </div>

        <button
          onClick={() => switchCarrierMock('Manual test trigger')}
          className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium transition"
        >
          Simulate Signal Drop
        </button>
        <button
  disabled={esimLoading}
  onClick={activateEsim}
  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-lg text-sm font-medium transition"
>
  {esimLoading ? 'Provisioning eSIM...' : 'Activate Smart eSIM (Zendit)'}
</button>

{esimData && (
  <div className="p-3 bg-slate-950 border border-emerald-500/30 rounded-lg text-xs font-mono space-y-1 break-all">
    <div className="text-emerald-400 font-semibold">Digital SIM Ready:</div>
    <div>ICCID: {esimData.esim_iccid}</div>
    <div className="text-slate-400">LPA: {esimData.esim_qr_code}</div>
  </div>
)}
      </div>

      <div>
        <h2 className="text-xs uppercase tracking-wider text-slate-400 mb-2">Live Decision Log</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-2 text-xs font-mono text-slate-300">
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </div>
    </main>
  );
}