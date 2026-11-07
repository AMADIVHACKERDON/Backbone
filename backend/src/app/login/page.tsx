'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/server';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (type: 'login' | 'signup') => {
    setLoading(true);
    setMessage('');

    const { error } =
      type === 'signup'
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else if (type === 'signup') {
      setMessage('Account created! You can now sign in.');
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <h1 className="text-xl font-bold">Aetekonect Account</h1>
        <p className="text-slate-400 text-xs">Sign in to manage your Smart eSIM & VPN</p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm"
        />

        <input
          type="password"
          placeholder="Password (min 6 chars)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-sm"
        />

        {message && <p className="text-xs text-amber-400">{message}</p>}

        <div className="flex gap-2 pt-2">
          <button
            disabled={loading}
            onClick={() => handleAuth('login')}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-medium"
          >
            Sign In
          </button>
          <button
            disabled={loading}
            onClick={() => handleAuth('signup')}
            className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium"
          >
            Sign Up
          </button>
        </div>
      </div>
    </main>
  );
}