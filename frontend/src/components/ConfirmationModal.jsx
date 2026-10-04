import React, { useState, useEffect } from 'react';
import { Check, X, Volume2, Sparkles, AlertCircle, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { translations } from '../translations';

export default function ConfirmationModal({ parsedData, isOpen, onClose, onConfirm, lang }) {
  const t = translations[lang];

  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState('');
  const [txType, setTxType] = useState('udhaar');
  const [note, setNote] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (parsedData) {
      setCustomerName(parsedData.customer_name || '');
      setAmount(parsedData.amount !== undefined ? parsedData.amount : '');
      setTxType(parsedData.type || 'udhaar');
      setNote(parsedData.note || '');
      setPhone(parsedData.phone || '');
    }
  }, [parsedData]);

  if (!isOpen || !parsedData) return null;

  const handleSpeakConfirmation = () => {
    if ('speechSynthesis' in window) {
      const typeText = txType === 'udhaar' ? 'उधार' : 'जमा';
      const msg = `${customerName} के खाते में ${amount} रुपये ${typeText} दर्ज किया जा रहा है।`;
      const utterance = new SpeechSynthesisUtterance(msg);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSave = () => {
    if (!customerName.trim() || Number(amount) <= 0) {
      alert(lang === 'hi' ? 'कृपया ग्राहक का नाम और सही रकम भरें।' : 'Please specify customer name and valid amount.');
      return;
    }

    // Trigger celebratory confetti
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });

    onConfirm({
      customer_name: customerName.trim(),
      amount: Number(amount),
      type: txType,
      note: note.trim(),
      phone: phone.trim(),
      raw_transcript: parsedData.raw_text || '',
      model_used: parsedData.model_used || 'Gemma 2 (2B)'
    });
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(5, 8, 15, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <div className="glass-panel" style={{
        maxWidth: '520px',
        width: '100%',
        padding: '2rem',
        animation: 'modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        background: '#0f172a',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8), var(--shadow-glow-saffron)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span className="badge badge-ai">
                <Sparkles size={12} />
                {parsedData.model_used || 'Gemma 2 (2B)'}
              </span>
              <button
                onClick={handleSpeakConfirmation}
                style={{
                  background: 'none',
                  color: 'var(--saffron-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}
                title="बोलकर सुनें"
              >
                <Volume2 size={15} />
                <span>बोलें</span>
              </button>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {t.confirm_title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {t.confirm_subtitle}
            </p>
          </div>
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

        {/* Spoken sentence preview */}
        {parsedData.raw_text && (
          <div style={{
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)',
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            marginBottom: '1.25rem'
          }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'block', fontWeight: 600 }}>
              {lang === 'hi' ? 'सुनी गई आवाज़:' : 'Spoken Input:'}
            </span>
            <span style={{ color: '#ffffff', fontWeight: 500 }}>"{parsedData.raw_text}"</span>
          </div>
        )}

        {/* Transaction Type Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.4rem' }}>
            {t.tx_type}
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            
            {/* Udhaar button */}
            <button
              type="button"
              onClick={() => setTxType('udhaar')}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                backgroundColor: txType === 'udhaar' ? 'var(--crimson-bg)' : 'rgba(255, 255, 255, 0.04)',
                border: txType === 'udhaar' ? '2px solid var(--crimson-400)' : '1px solid var(--border-subtle)',
                color: txType === 'udhaar' ? 'var(--crimson-400)' : 'var(--text-secondary)'
              }}
            >
              <span>🔴</span>
              <span>{t.type_udhaar}</span>
            </button>

            {/* Jama button */}
            <button
              type="button"
              onClick={() => setTxType('jama')}
              style={{
                padding: '0.75rem',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                fontSize: '0.9rem',
                backgroundColor: txType === 'jama' ? 'var(--emerald-bg)' : 'rgba(255, 255, 255, 0.04)',
                border: txType === 'jama' ? '2px solid var(--emerald-400)' : '1px solid var(--border-subtle)',
                color: txType === 'jama' ? 'var(--emerald-400)' : 'var(--text-secondary)'
              }}
            >
              <span>🟢</span>
              <span>{t.type_jama}</span>
            </button>
          </div>
        </div>

        {/* Customer Name & Amount Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              {t.customer_name} *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ramesh"
              style={{ width: '100%', fontSize: '1rem', fontWeight: 600 }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              {t.amount} *
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, color: 'var(--text-muted)' }}>₹</span>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="200"
                style={{ width: '100%', paddingLeft: '2rem', fontSize: '1.1rem', fontWeight: 700, color: txType === 'udhaar' ? 'var(--crimson-400)' : 'var(--emerald-400)' }}
              />
            </div>
          </div>
        </div>

        {/* Phone & Note Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              {lang === 'hi' ? 'मोबाइल नंबर (ऐच्छिक)' : 'Phone (Optional)'}
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="9876543210"
              style={{ width: '100%', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.35rem' }}>
              {t.item_note}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={lang === 'hi' ? 'जैसे: राशन, तेल, दाल' : 'e.g. ration, items'}
              style={{ width: '100%', fontSize: '0.9rem' }}
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              color: 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            {t.cancel}
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            style={{
              padding: '0.75rem 1.75rem',
              borderRadius: 'var(--radius-md)',
              background: txType === 'udhaar'
                ? 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: txType === 'udhaar' ? 'var(--shadow-glow-crimson)' : 'var(--shadow-glow-emerald)'
            }}
          >
            <Check size={18} />
            <span>{t.confirm_save}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
