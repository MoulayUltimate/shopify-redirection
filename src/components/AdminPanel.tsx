'use client';

import React, { useRef, useState, useTransition } from 'react';
import { addRedirect, deleteRedirect } from '@/app/actions';

export default function AdminPanel({ rules }: { rules: any[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setError(null);
    const result = await addRedirect(formData);
    if (result.error) {
      setError(result.error);
    } else {
      formRef.current?.reset();
    }
  };

  return (
    <div className="admin-panel">
      <div className="add-form">
        <h3>Add New Redirect</h3>
        <form ref={formRef} action={handleSubmit} className="form-grid">
          <input type="text" name="sourcePath" placeholder="Source Path (e.g., /old-product)" required className="input" />
          <input type="text" name="destination" placeholder="Destination (e.g., /products/new-product)" required className="input" />
          <button type="submit" className="btn btn-primary" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add & Sync to Shopify'}
          </button>
        </form>
        {error && <p className="error">{error}</p>}
      </div>

      <div className="rules-list">
        <h3>Active Rules ({rules.length})</h3>
        {rules.length === 0 ? (
          <p className="empty">No redirects configured yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Source</th>
                <th>Destination</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((rule) => (
                <tr key={rule.id}>
                  <td>{rule.sourcePath}</td>
                  <td>{rule.destination}</td>
                  <td><span className="badge">Active</span></td>
                  <td>
                    <button 
                      onClick={() => startTransition(() => deleteRedirect(rule.id))}
                      className="btn btn-sm btn-danger"
                      disabled={isPending}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
