'use client';

import { signOut } from 'next-auth/react';

export default function Header({ user }: { user: any }) {
  return (
    <header className="main-header">
      <div className="header-left">
        <div className="logo">
          <img src="/logo.jpg" alt="AmksaSwitchify" className="logo-img" style={{ height: '48px', borderRadius: '8px' }} />
          <div className="logo-text">
            <h1>AmksaSwitchify</h1>
            <p>Smart Traffic & Revenue Control</p>
          </div>
        </div>
      </div>
      
      <div className="header-right">
        <div className="user-profile">
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
