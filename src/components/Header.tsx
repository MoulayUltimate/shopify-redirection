'use client';

import { signOut } from 'next-auth/react';

export default function Header({ user }: { user: any }) {
  return (
    <header className="main-header">
      <div className="header-left">
        <div className="logo">
          <div className="logo-icon">🚀</div>
          <div className="logo-text">
            <h1>Revenue Rotator</h1>
            <p>Admin Dashboard</p>
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
