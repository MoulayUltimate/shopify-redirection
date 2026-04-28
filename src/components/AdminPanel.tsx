'use client';

import React, { useRef, useState, useTransition } from 'react';
import { addStore, deleteStore, toggleStoreStatus } from '@/app/actions';

export default function AdminPanel({ stores }: { stores: any[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await addStore(formData);
    if (result.error) {
      setError(result.error);
    } else {
      formRef.current?.reset();
    }
  };

  return (
    <div className="admin-panel">
      <div className="add-form">
        <h3>Add Store to Rotator</h3>
        <form ref={formRef} action={handleSubmit} className="form-grid">
          <input type="text" name="name" placeholder="Store Name (e.g., Store A)" required className="input" />
          <input type="text" name="domain" placeholder="novanesty-4.myshopify.com" required className="input" />
          <input type="number" name="revenueLimit" placeholder="Limit ($)" defaultValue="500" required className="input" />
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add Store'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="rules-list">
        <h3>Configured Stores ({stores.length})</h3>
        {stores.length === 0 ? (
          <p className="empty">No stores configured. Add one above to start rotating!</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Store</th>
                <th>Revenue / Limit</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => {
                const limitReached = store.currentRevenue >= store.revenueLimit;
                return (
                  <tr key={store.id}>
                    <td>
                      <strong>{store.name}</strong><br/>
                      <span style={{fontSize: '0.8rem', color: '#94a3b8'}}>{store.domain}</span>
                    </td>
                    <td>
                      <span style={{color: limitReached ? '#f87171' : '#34d399'}}>
                        ${store.currentRevenue.toFixed(2)}
                      </span> / ${store.revenueLimit.toFixed(2)}
                    </td>
                    <td>
                      <span className="badge" style={{ background: store.isActive && !limitReached ? 'rgba(52, 211, 153, 0.2)' : 'rgba(248, 113, 113, 0.2)', color: store.isActive && !limitReached ? '#34d399' : '#f87171' }}>
                        {!store.isActive ? 'Paused' : limitReached ? 'Limit Reached' : 'Receiving Traffic'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => startTransition(() => { toggleStoreStatus(store.id, store.isActive); })}
                        className="btn btn-sm btn-secondary"
                        disabled={isPending}
                      >
                        {store.isActive ? 'Pause' : 'Resume'}
                      </button>
                      <button 
                        onClick={() => startTransition(() => { deleteStore(store.id); })}
                        className="btn btn-sm btn-danger"
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
