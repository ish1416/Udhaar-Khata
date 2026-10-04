import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, ArrowUpRight, ArrowDownLeft, Phone, Calendar, CheckCircle, Printer, Download, Sparkles } from 'lucide-react';
import { translations } from '../translations';

export default function LedgerModal({ customer, isOpen, onClose, onRefreshData, lang }) {
  const t = translations[lang];
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  
  // New manual entry states
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState('udhaar');
  const [note, setNote] = useState('');

  const fetchTransactions = async () => {
    if (!customer) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/transactions`);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.transactions || []);
      }
    } catch (err) {
      console.error('Failed to load transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      fetchTransactions();
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const handleAddManualEntry = async (e) => {
    e.preventDefault();
    if (Number(amount) <= 0) return;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          amount: Number(amount),
          type: txType,
          note: note.trim(),
          phone: customer.phone || '',
          model_used: 'Manual Entry'
        })
      });
      if (res.ok) {
        setAmount('');
        setNote('');
        setShowAddForm(false);
        fetchTransactions();
        onRefreshData();
      }
    } catch (err) {
      console.error('Error adding transaction:', err);
    }
  };

  const handleDeleteEntry = async (txId) => {
    if (!window.confirm(lang === 'hi' ? 'क्या आप इस प्रविष्टि को हटाना चाहते हैं?' : 'Delete this transaction entry?')) {
      return;
    }
    try {
      const res = await fetch(`/api/transactions/${txId}`, { method: 'DELETE' });
      if (res.ok) {
        fetchTransactions();
        onRefreshData();
      }
    } catch (err) {
      console.error('Error deleting transaction:', err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const isOwing = customer.balance > 0;
  const isSettled = Math.abs(customer.balance) < 0.01;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '720px',
        width: '100%',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: '2rem',
        animation: 'modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
                {customer.name}
              </h3>
              {customer.phone && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Phone size={12} /> {customer.phone}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              {lang === 'hi' ? 'ग्राहक का सम्पूर्ण बही-खाता विवरण' : 'Complete customer ledger statement'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={handlePrint}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-secondary)',
                borderRadius: 'var(--radius-md)',
                padding: '0.45rem 0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
              title="Print Statement"
            >
              <Printer size={14} />
              <span>{lang === 'hi' ? 'प्रिंट' : 'Print'}</span>
            </button>
            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: 'var(--text-muted)',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Balance Card Banner */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          background: isOwing ? 'var(--crimson-bg)' : (isSettled ? 'var(--emerald-bg)' : 'rgba(14, 165, 233, 0.12)'),
          border: '1px solid',
          borderColor: isOwing ? 'rgba(244, 63, 94, 0.3)' : (isSettled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(14, 165, 233, 0.3)'),
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem'
        }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              {lang === 'hi' ? 'कुल शेष बकाया (Net Balance)' : 'Current Balance'}
            </span>
            <div style={{
              fontSize: '2rem',
              fontWeight: 800,
              color: isOwing ? 'var(--crimson-400)' : (isSettled ? 'var(--emerald-400)' : 'var(--sky-500)'),
              marginTop: '0.15rem'
            }}>
              ₹{Math.abs(customer.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: isOwing ? 'var(--crimson-400)' : (isSettled ? 'var(--emerald-400)' : 'var(--sky-500)') }}>
              {isOwing && (lang === 'hi' ? 'ग्राहक से यह रकम लेना बाकी है' : 'Amount to collect from customer')}
              {isSettled && (lang === 'hi' ? 'खाता पूर्ण रूप से साफ है ✓' : 'Account is fully settled ✓')}
              {customer.balance < 0 && (lang === 'hi' ? 'ग्राहक की अग्रिम रकम जमा है' : 'Advance balance')}
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            style={{
              padding: '0.65rem 1.1rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              color: '#0b0f19',
              fontWeight: 700,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              boxShadow: 'var(--shadow-glow-saffron)'
            }}
          >
            <Plus size={16} />
            <span>{showAddForm ? (lang === 'hi' ? 'फॉर्म बंद करें' : 'Close') : (lang === 'hi' ? 'हिसाब जोड़ें' : 'Add Entry')}</span>
          </button>
        </div>

        {/* Collapsible Manual Entry Form */}
        {showAddForm && (
          <form onSubmit={handleAddManualEntry} style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1.25rem'
          }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.75rem' }}>
              {lang === 'hi' ? 'नया लेन-देन दर्ज करें' : 'Record New Transaction'}
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t.tx_type}
                </label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value)}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                >
                  <option value="udhaar">🔴 उधार दिया (Udhaar)</option>
                  <option value="jama">🟢 जमा लिया (Jama)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t.amount} *
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="₹ Amount"
                  required
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>
                  {t.item_note}
                </label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={lang === 'hi' ? 'सामान' : 'Item/Note'}
                  style={{ width: '100%', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                style={{ padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-md)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem' }}
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--saffron-400)',
                  color: '#0b0f19',
                  fontWeight: 700,
                  fontSize: '0.8rem'
                }}
              >
                {lang === 'hi' ? 'दर्ज करें' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {/* Transactions Timeline */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '0.5rem' }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.04em' }}>
            {lang === 'hi' ? 'लेन-देन इतिहास' : 'Transaction History'}
          </h4>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              {lang === 'hi' ? 'लोड हो रहा है...' : 'Loading history...'}
            </div>
          ) : transactions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              {t.no_transactions}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {transactions.map((tx) => {
                const isDebit = tx.type === 'udhaar';
                const dateStr = new Date(tx.created_at).toLocaleString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={tx.id}
                    style={{
                      padding: '0.85rem 1.1rem',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    {/* Left: Type Icon + Notes */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '10px',
                        backgroundColor: isDebit ? 'var(--crimson-bg)' : 'var(--emerald-bg)',
                        color: isDebit ? 'var(--crimson-400)' : 'var(--emerald-400)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        {isDebit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            color: isDebit ? 'var(--crimson-400)' : 'var(--emerald-400)'
                          }}>
                            {isDebit ? (lang === 'hi' ? 'उधार दिया' : 'Credit Given') : (lang === 'hi' ? 'जमा लिया' : 'Payment Received')}
                          </span>
                          {tx.note && (
                            <span style={{ fontSize: '0.85rem', color: '#ffffff', fontWeight: 500 }}>
                              • {tx.note}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span>{dateStr}</span>
                          {tx.model_used && tx.model_used !== 'system' && (
                            <span style={{ color: '#a855f7', display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <Sparkles size={10} /> {tx.model_used}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Amount + Delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{
                        fontSize: '1.15rem',
                        fontWeight: 800,
                        color: isDebit ? 'var(--crimson-400)' : 'var(--emerald-400)'
                      }}>
                        {isDebit ? '+' : '-'} ₹{tx.amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                      </div>

                      <button
                        onClick={() => handleDeleteEntry(tx.id)}
                        style={{
                          background: 'none',
                          color: 'var(--text-muted)',
                          padding: '4px',
                          borderRadius: '4px'
                        }}
                        title={lang === 'hi' ? 'हटाएं' : 'Delete'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
