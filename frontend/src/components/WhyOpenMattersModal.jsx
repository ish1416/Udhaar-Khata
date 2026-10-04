import React from 'react';
import { X, ShieldCheck, WifiOff, DollarSign, Cpu, Heart, CheckCircle2 } from 'lucide-react';
import { translations } from '../translations';

export default function WhyOpenMattersModal({ isOpen, onClose, lang }) {
  const t = translations[lang];
  if (!isOpen) return null;

  const points = [
    {
      icon: <ShieldCheck size={22} color="#10b981" />,
      title_hin: "1. 100% डेटा गोपनीयता (Data Privacy)",
      title_eng: "1. Complete Financial Data Sovereignty",
      desc_hin: "दुकानदार का बही-खाता उसका सबसे संवेदनशील वित्तीय रिकॉर्ड होता है। ओपन-वेट्स AI (Gemma 2 + Whisper) सीधे लैपटॉप पर चलता है। किसी ग्राहक का नाम, फोन या उधारी का डेटा किसी बिग-टेक क्लाउड सर्वर पर नहीं भेजा जाता।",
      desc_eng: "Small shop ledger data is sensitive financial history. Open-weights models (Gemma 2 + Whisper) run 100% on the local laptop. Zero customer records or debt history ever leave the father's device."
    },
    {
      icon: <WifiOff size={22} color="#f59e0b" />,
      title_hin: "2. बिना इंटरनेट के 24/7 काम करता है (Zero Internet Required)",
      title_eng: "2. Works Seamlessly Offline",
      desc_hin: "भारतीय कस्बों और बाज़ारों में इंटरनेट या वाई-फाई अक्सर कट जाता है। बंद APIs (जैसे ChatGPT/Claude) इंटरनेट न होने पर बंद हो जाते हैं, जबकि ओपन-वेट्स मॉडल बिना किसी नेटवर्क के भी हमेशा तेज़ी से चलते हैं।",
      desc_eng: "Indian marketplaces frequently suffer network drops. Closed proprietary APIs fail without connectivity. Running open-weight Gemma 2 locally guarantees sub-second response times even with zero internet connection."
    },
    {
      icon: <DollarSign size={22} color="#38bdf8" />,
      title_hin: "3. शून्य क्लाउड लागत (Zero Recurring Subscription Fees)",
      title_eng: "3. Zero Token / API Costs",
      desc_hin: "एक छोटा दुकानदार हर वॉइस इनपुट के लिए टोकन या मासिक सब्सक्रिप्शन नहीं दे सकता। ओपन-वेट्स मॉडल मुफ्त और हमेशा के लिए उनके लैपटॉप के हार्डवेयर पर चलते हैं।",
      desc_eng: "Small neighbourhood shopkeepers operate on thin margins. Paying metered API bills or monthly SaaS fees is unsustainable. Open-weights AI costs ₹0 to run indefinitely on consumer hardware."
    },
    {
      icon: <Cpu size={22} color="#a855f7" />,
      title_hin: "4. हिंग्लिश और बोलचाल की हिंदी की समझ (Local Language Adaptation)",
      title_eng: "4. Fine-Tuned for Colloquial Hinglish",
      desc_hin: "भारतीय दुकानदार 'उधार लिया', 'जमा किए', 'रोकड़ा', 'खाता' जैसी स्थानीय बोलचाल का प्रयोग करते हैं। ओपन-वेट्स मॉडल को इन बोलचाल के वाक्यों के लिए आसानी से प्रॉम्प्ट और अनुकूलित किया जा सकता है।",
      desc_eng: "Colloquial shop terminology ('udhaar', 'jama', 'hisaab chukta', 'baaki') requires nuanced linguistic handling. Open-weights let us customize system instructions and prompt architecture without proprietary guardrails."
    }
  ];

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
        maxWidth: '680px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2.25rem',
        animation: 'modal-pop 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        background: '#0f172a',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.8)'
      }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="badge badge-ai">
                <Heart size={12} color="#f43f5e" />
                Hacktoberfest: Build for a Friend
              </span>
            </div>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#ffffff' }}>
              {lang === 'hi' ? 'ओपन इनोवेशन (Open Innovation) क्यों महत्वपूर्ण है?' : 'Why Open Innovation Matters for Udhaar Khata'}
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {lang === 'hi' ? 'पिताजी के डिजिटल खाते के लिए ओपन-वेट्स AI ही एकमात्र सही विकल्प क्यों है:' : 'Why open-weight AI is the only ethical and practical choice for my father:'}
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

        {/* Pillars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          {points.map((p, idx) => (
            <div
              key={idx}
              style={{
                padding: '1.1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '1rem'
              }}
            >
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                {p.icon}
              </div>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.3rem' }}>
                  {lang === 'hi' ? p.title_hin : p.title_eng}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  {lang === 'hi' ? p.desc_hin : p.desc_eng}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Footer */}
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12) 0%, rgba(245, 158, 11, 0.04) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <CheckCircle2 size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
          <p style={{ fontSize: '0.85rem', color: '#fef3c7', fontWeight: 500 }}>
            {lang === 'hi'
              ? "ओपन-सोर्स AI (Google Gemma 2 + OpenAI Whisper) ने बंद क्लाउड APIs के बिना एक ऐसा समाधान बनाया जो पूरी तरह मुफ़्त, व्यक्तिगत और स्वायत्त है।"
              : "Open-source AI (Google Gemma 2 + OpenAI Whisper) made it possible to build a completely private, cost-free, offline tool tailored with love for my father."}
          </p>
        </div>

      </div>
    </div>
  );
}
