import React, { useState, useEffect } from 'react';
import { X, Send, Copy, Check, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';
import { translations } from '../translations';

export default function ReminderModal({ customer, isOpen, onClose, lang }) {
  const t = translations[lang];
  const [activeTab, setActiveTab] = useState('polite');
  const [templates, setTemplates] = useState([]);
  const [customDraft, setCustomDraft] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [phone, setPhone] = useState('');

  // Fetch reminder drafts from backend
  const fetchReminders = async () => {
    if (!customer) return;
    try {
      const res = await fetch('/api/ai/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          amount: customer.balance,
          phone: customer.phone || ''
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data.templates || []);
        if (data.templates && data.templates.length > 0) {
          setCustomDraft(data.templates[0].message);
        }
      }
    } catch (err) {
      console.error('Failed to fetch reminders:', err);
    }
  };

  useEffect(() => {
    if (isOpen && customer) {
      setPhone(customer.phone || '');
      setCopied(false);
      fetchReminders();
    }
  }, [isOpen, customer]);

  if (!isOpen || !customer) return null;

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    const tmpl = templates.find(t => t.id === tabId);
    if (tmpl) {
      setCustomDraft(tmpl.message);
    }
  };

  // Instruct Gemma 2 to draft custom message
  const handleGenerateWithGemma = async () => {
    if (!customInstructions.trim() || isGeneratingCustom) return;
    setIsGeneratingCustom(true);
    try {
      const res = await fetch('/api/ai/remind', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          amount: customer.balance,
          phone: phone,
          instructions: customInstructions.trim(),
          custom_tone: 'custom'
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.custom && data.custom.message) {
          setCustomDraft(data.custom.message);
          setActiveTab('custom');
        }
      }
    } catch (err) {
      console.error('Error generating custom reminder with Gemma:', err);
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const getWhatsAppUrl = () => {
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = `91${cleanPhone}`;
    }
    const encoded = encodeURIComponent(customDraft);
    return cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
  };

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
        maxWidth: '580px',
        width: '100%',
        padding: '2rem',
        animation: 'modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#0f172a',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.2rem' }}>
              <span className="badge badge-ai">
                <Sparkles size={12} />
                Gemma 2 (2B) Bilingual Generator
              </span>
            </div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#ffffff' }}>
              {t.reminder_title}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {customer.name} • <span style={{ color: 'var(--crimson-400)', fontWeight: 700 }}>₹{customer.balance.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span> {lang === 'hi' ? 'बकाया' : 'due'}
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

        {/* Optional phone input */}
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
            {lang === 'hi' ? 'ग्राहक का WhatsApp मोबाइल नंबर' : 'Customer WhatsApp Phone Number'}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 9876543210"
            style={{ width: '100%', fontSize: '0.9rem' }}
          />
        </div>

        {/* Tone Selection Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {templates.map(tmpl => (
            <button
              key={tmpl.id}
              onClick={() => handleTabChange(tmpl.id)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.82rem',
                fontWeight: activeTab === tmpl.id ? 700 : 500,
                backgroundColor: activeTab === tmpl.id ? 'var(--saffron-400)' : 'rgba(255, 255, 255, 0.05)',
                color: activeTab === tmpl.id ? '#0b0f19' : 'var(--text-secondary)',
                border: '1px solid',
                borderColor: activeTab === tmpl.id ? 'var(--saffron-400)' : 'var(--border-subtle)'
              }}
            >
              {lang === 'hi' ? tmpl.title_hin : tmpl.title_eng}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('custom')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'custom' ? 700 : 500,
              backgroundColor: activeTab === 'custom' ? '#8b5cf6' : 'rgba(139, 92, 246, 0.1)',
              color: activeTab === 'custom' ? '#ffffff' : '#c084fc',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem'
            }}
          >
            <Sparkles size={12} />
            <span>AI Custom</span>
          </button>
        </div>

        {/* Gemma Custom Prompt Input (if in custom tab) */}
        {activeTab === 'custom' && (
          <div style={{
            padding: '0.85rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(139, 92, 246, 0.08)',
            border: '1px solid rgba(139, 92, 246, 0.25)',
            marginBottom: '1rem'
          }}>
            <label style={{ fontSize: '0.78rem', color: '#c084fc', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
              {t.custom_ai_prompt}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder={lang === 'hi' ? "जैसे: बोलिए कि कल डिस्ट्रीब्यूटर को पेमेंट देनी है..." : "e.g. say we need to pay suppliers tomorrow..."}
                style={{ flex: 1, fontSize: '0.85rem' }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateWithGemma(); }}
              />
              <button
                onClick={handleGenerateWithGemma}
                disabled={isGeneratingCustom || !customInstructions.trim()}
                style={{
                  padding: '0.5rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  background: '#8b5cf6',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  opacity: (!customInstructions.trim() || isGeneratingCustom) ? 0.5 : 1
                }}
              >
                {isGeneratingCustom ? <RefreshCw size={14} className="spin" /> : <Sparkles size={14} />}
                <span>{lang === 'hi' ? 'बनाएं' : 'Draft'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Editable Message Preview Area */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem', fontWeight: 600 }}>
            {lang === 'hi' ? 'संदेश का पूर्वावलोकन (आप बदलाव भी कर सकते हैं):' : 'Message Preview (You can edit text before sending):'}
          </label>
          <textarea
            rows={5}
            value={customDraft}
            onChange={(e) => setCustomDraft(e.target.value)}
            style={{
              width: '100%',
              fontSize: '0.95rem',
              lineHeight: '1.6',
              resize: 'vertical',
              padding: '0.85rem 1rem'
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          
          {/* Copy Message */}
          <button
            onClick={handleCopy}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid var(--border-subtle)',
              color: copied ? 'var(--emerald-400)' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            <span>{copied ? t.copied : t.copy_message}</span>
          </button>

          {/* Send on WhatsApp Button */}
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
              color: '#ffffff',
              fontWeight: 700,
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(37, 211, 102, 0.3)'
            }}
          >
            <MessageCircle size={18} />
            <span>{t.send_whatsapp}</span>
          </a>

        </div>

      </div>
    </div>
  );
}
