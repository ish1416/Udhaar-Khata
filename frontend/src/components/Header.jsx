import React from 'react';
import { BookOpen, ShieldCheck, Cpu, Globe, Download, RefreshCw, Info } from 'lucide-react';
import { translations } from '../translations';

export default function Header({ lang, setLang, aiStatus, onResetSeed, onOpenWhyOpen }) {
  const t = translations[lang];

  return (
    <header className="glass-panel" style={{ padding: '1.25rem 1.75rem', marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow-saffron)',
            fontSize: '1.6rem'
          }}>
            📒
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #ffffff, #fde68a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {t.title}
              </h1>
              <span className="badge badge-ai" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Cpu size={12} />
                Gemma 2 (2B) + Whisper
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
              {t.subtitle}
            </p>
          </div>
        </div>

        {/* Right side controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          
          {/* Privacy & Offline status pill */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.4rem 0.8rem',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            fontSize: '0.78rem',
            color: 'var(--emerald-400)',
            fontWeight: 600
          }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }}></span>
            <ShieldCheck size={14} />
            <span>100% Local Open AI</span>
          </div>

          {/* Language selector */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-full)',
            padding: '3px',
            border: '1px solid var(--border-subtle)'
          }}>
            {[
              { code: 'hi', label: 'हिंदी' },
              { code: 'hinglish', label: 'Hinglish' },
              { code: 'en', label: 'English' }
            ].map((item) => (
              <button
                key={item.code}
                onClick={() => setLang(item.code)}
                style={{
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8rem',
                  fontWeight: lang === item.code ? 700 : 500,
                  color: lang === item.code ? '#0b0f19' : 'var(--text-secondary)',
                  backgroundColor: lang === item.code ? 'var(--saffron-400)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Why Open Innovation info button */}
          <button
            onClick={onOpenWhyOpen}
            title={t.why_open_matters}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            <Info size={14} color="#f59e0b" />
            <span>Why Open AI?</span>
          </button>

          {/* Export CSV */}
          <a
            href="/api/export?format=csv"
            download="udhaar_khata.csv"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.45rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem',
              fontWeight: 600,
              textDecoration: 'none'
            }}
            title={t.export_csv}
          >
            <Download size={14} />
            <span>CSV</span>
          </a>

          {/* Reset Seed Demo */}
          <button
            onClick={onResetSeed}
            title={t.seed_demo}
            style={{
              padding: '0.45rem 0.6rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)'
            }}
          >
            <RefreshCw size={14} />
          </button>
        </div>

      </div>
    </header>
  );
}
