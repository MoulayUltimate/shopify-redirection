'use client';

import { signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Header({ user }: { user: any }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <header className="main-header">
      <div className="header-left">
        <div className="logo">
          <img src="/logo.jpg" alt="AmksaSwitchify" className="logo-img" style={{ height: '52px', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', border: '2px solid var(--border)' }} />
          <div className="logo-text">
            <h1>AmksaSwitchify</h1>
            <p>Smart Traffic & Revenue Control</p>
          </div>
        </div>
      </div>
      
      <div className="header-right">
        <div className="user-profile">
          {user?.email === 'remoymak@gmail.com' && (
            <Link href="/admin" className="btn btn-primary btn-sm" style={{ marginRight: '0.5rem', background: 'var(--accent-purple)' }}>
              👑 Master View
            </Link>
          )}
          <button onClick={toggleTheme} className="btn btn-ghost btn-sm" style={{ marginRight: '0.5rem', borderRadius: '50%', width: '36px', height: '36px', padding: 0 }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className="user-info">
            <span className="user-name">{user?.name || user?.email}</span>
            <span className="user-role">Administrator</span>
          </div>
          <button onClick={() => signOut()} className="btn btn-ghost btn-sm">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
