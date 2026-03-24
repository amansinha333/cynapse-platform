import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate('/dashboard/list');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      <div className="relative hidden lg:block">
        <img
          src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop"
          alt="Abstract background"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-900/20 via-white/10 to-transparent" />
        <div className="absolute left-10 bottom-10">
          <p className="tracking-[0.2em] uppercase text-xs text-white/80">Cynapse Platform</p>
          <h2 className="font-serif text-5xl tracking-tighter text-white mt-3">Precision at Enterprise Scale.</h2>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 md:px-10">
        <form onSubmit={handleSubmit} className="w-full max-w-md">
          <Link to="/" className="tracking-[0.2em] uppercase text-xs text-slate-400">Back to site</Link>
          <h1 className="mt-4 text-4xl font-serif tracking-tighter text-slate-900">Log in to Cynapse</h1>
          <p className="mt-3 text-slate-500">Secure access to your compliance command center.</p>

          <div className="mt-8 space-y-4">
            <input
              type="email"
              required
              placeholder="Email address"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <input
              type="password"
              required
              placeholder="Password"
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-slate-800 transition-colors"
          >
            Enter System
          </button>
        </form>
      </div>
    </div>
  );
}
