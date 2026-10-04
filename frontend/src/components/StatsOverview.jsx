import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Users, Wallet } from 'lucide-react';
import { translations } from '../translations';

export default function StatsOverview({ customers, lang }) {
  const t = translations[lang];

  // Calculate totals
  const totalUdhaar = customers.reduce((sum, c) => c.balance > 0 ? sum + c.balance : sum, 0);
  const totalJama = customers.reduce((sum, c) => c.balance < 0 ? sum + Math.abs(c.balance) : sum, 0);
  const debtorsCount = customers.filter(c => c.balance > 0).length;
  const settledCount = customers.filter(c => Math.abs(c.balance) < 0.01).length;

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
      gap: '1.25rem',
      marginBottom: '2rem'
    }}>
      
      {/* 1. Total Udhaar (Lena hai / To receive) */}
      <div className="glass-panel" style={{
        padding: '1.4rem 1.6rem',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '4px solid var(--crimson-500)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--crimson-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.total_udhaar}
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginTop: '0.25rem', fontFamily: 'inherit' }}>
              ₹{totalUdhaar.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              <span style={{ color: 'var(--crimson-400)', fontWeight: 700 }}>{debtorsCount}</span> {lang === 'hi' ? 'ग्राहकों से लेना बाकी है' : 'customers owe payment'}
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--crimson-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--crimson-400)'
          }}>
            <ArrowUpRight size={22} />
          </div>
        </div>
      </div>

      {/* 2. Total Jama (Mil gaya / Settled) */}
      <div className="glass-panel" style={{
        padding: '1.4rem 1.6rem',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '4px solid var(--emerald-500)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--emerald-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.total_jama}
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginTop: '0.25rem' }}>
              ₹{totalJama.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              <span style={{ color: 'var(--emerald-400)', fontWeight: 700 }}>{settledCount}</span> {lang === 'hi' ? 'खाते पूर्ण रूप से चुकता' : 'accounts fully settled'}
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--emerald-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--emerald-400)'
          }}>
            <ArrowDownLeft size={22} />
          </div>
        </div>
      </div>

      {/* 3. Total Active Khata Accounts */}
      <div className="glass-panel" style={{
        padding: '1.4rem 1.6rem',
        position: 'relative',
        overflow: 'hidden',
        borderLeft: '4px solid var(--saffron-500)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--saffron-400)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {t.active_customers}
            </span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#ffffff', marginTop: '0.25rem' }}>
              {customers.length}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              {lang === 'hi' ? 'दुकानदार बही-खाता डायरी' : 'Digital ledger accounts'}
            </div>
          </div>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '12px',
            background: 'var(--saffron-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--saffron-400)'
          }}>
            <Users size={22} />
          </div>
        </div>
      </div>

    </div>
  );
}
