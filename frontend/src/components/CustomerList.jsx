import React, { useState } from 'react';
import { Search, Phone, Bell, BookOpen, CheckCircle, ChevronRight, UserPlus } from 'lucide-react';
import { translations } from '../translations';

export default function CustomerList({ customers, lang, onSelectCustomer, onOpenReminder, onSettleAccount, onAddNewCustomer }) {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTab, setFilterTab] = useState('all'); // 'all', 'owing', 'settled'

  // Filter customers
  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.phone && c.phone.includes(searchTerm));
    if (!matchesSearch) return false;

    if (filterTab === 'owing') return c.balance > 0;
    if (filterTab === 'settled') return Math.abs(c.balance) < 0.01;
    return true;
  });

  const getInitials = (name) => {
    if (!name) return 'ग';
    const parts = name.trim().split(' ');
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="glass-panel" style={{ padding: '1.75rem' }}>
      
      {/* Search & Tabs Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
        
        {/* Search input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t.search_placeholder}
            style={{
              width: '100%',
              paddingLeft: '2.5rem',
              fontSize: '0.9rem',
              backgroundColor: 'rgba(255, 255, 255, 0.03)'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {[
            { id: 'all', label: t.all, count: customers.length },
            { id: 'owing', label: t.to_receive, count: customers.filter(c => c.balance > 0).length },
            { id: 'settled', label: t.settled, count: customers.filter(c => Math.abs(c.balance) < 0.01).length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id)}
              style={{
                padding: '0.45rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: filterTab === tab.id ? 700 : 500,
                backgroundColor: filterTab === tab.id ? 'var(--saffron-400)' : 'rgba(255, 255, 255, 0.04)',
                color: filterTab === tab.id ? '#0b0f19' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: filterTab === tab.id ? 'var(--saffron-400)' : 'var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <span>{tab.label}</span>
              <span style={{
                fontSize: '0.72rem',
                padding: '1px 6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: filterTab === tab.id ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.08)',
                fontWeight: 700
              }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

      </div>

      {/* Customers List / Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
          <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📖</div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
            {t.no_customers}
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            {t.add_first}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filtered.map((customer) => {
            const isOwing = customer.balance > 0;
            const isSettled = Math.abs(customer.balance) < 0.01;
            const owesUs = customer.balance < 0;

            return (
              <div
                key={customer.id}
                style={{
                  padding: '1rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.025)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }}
              >
                {/* Left: Avatar + Details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }} onClick={() => onSelectCustomer(customer)}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    background: isOwing 
                      ? 'linear-gradient(135deg, rgba(244, 63, 94, 0.2) 0%, rgba(244, 63, 94, 0.05) 100%)'
                      : 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.05) 100%)',
                    border: isOwing ? '1px solid rgba(244, 63, 94, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                    color: isOwing ? 'var(--crimson-400)' : 'var(--emerald-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1rem'
                  }}>
                    {getInitials(customer.name)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span>{customer.name}</span>
                    </h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {customer.phone ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Phone size={12} /> {customer.phone}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>{lang === 'hi' ? 'फोन नंबर नहीं' : 'No phone'}</span>
                      )}
                      <span>•</span>
                      <span>{customer.transaction_count || 0} {lang === 'hi' ? 'लेन-देन' : 'entries'}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Balance + Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                  
                  {/* Amount Badge */}
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: isOwing ? 'var(--crimson-400)' : (isSettled ? 'var(--emerald-400)' : 'var(--sky-500)')
                    }}>
                      ₹{Math.abs(customer.balance).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      {isOwing && <span style={{ color: 'var(--crimson-400)' }}>{lang === 'hi' ? 'लेना है' : 'To Receive'}</span>}
                      {isSettled && <span style={{ color: 'var(--emerald-400)' }}>{lang === 'hi' ? 'हिसाब चुकता ✓' : 'Settled ✓'}</span>}
                      {owesUs && <span style={{ color: 'var(--sky-500)' }}>{lang === 'hi' ? 'जमा है (देना है)' : 'Advance / We owe'}</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    
                    {/* Reminder button (only if owing money) */}
                    {isOwing && (
                      <button
                        onClick={() => onOpenReminder(customer)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.1) 100%)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: 'var(--saffron-400)',
                          fontSize: '0.82rem',
                          fontWeight: 700
                        }}
                        title={t.reminder_title}
                      >
                        <Bell size={14} />
                        <span>{t.remind_btn}</span>
                      </button>
                    )}

                    {/* Settle button (only if balance != 0) */}
                    {!isSettled && (
                      <button
                        onClick={() => onSettleAccount(customer)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          padding: '0.5rem 0.85rem',
                          borderRadius: 'var(--radius-md)',
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          color: 'var(--emerald-400)',
                          fontSize: '0.82rem',
                          fontWeight: 600
                        }}
                        title={t.settle_btn}
                      >
                        <CheckCircle size={14} />
                        <span>{lang === 'hi' ? 'चुकता' : 'Settle'}</span>
                      </button>
                    )}

                    {/* View Ledger */}
                    <button
                      onClick={() => onSelectCustomer(customer)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        padding: '0.5rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.82rem',
                        fontWeight: 600
                      }}
                    >
                      <BookOpen size={14} />
                      <span>{t.view_ledger}</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
