import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import StatsOverview from './components/StatsOverview';
import VoiceInputBar from './components/VoiceInputBar';
import CustomerList from './components/CustomerList';
import ConfirmationModal from './components/ConfirmationModal';
import LedgerModal from './components/LedgerModal';
import ReminderModal from './components/ReminderModal';
import WhyOpenMattersModal from './components/WhyOpenMattersModal';
import { translations } from './translations';
import confetti from 'canvas-confetti';

export default function App() {
  const [lang, setLang] = useState('hi'); // 'hi', 'hinglish', 'en'
  const [customers, setCustomers] = useState([]);
  const [aiStatus, setAiStatus] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Modals state
  const [parsedData, setParsedData] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [reminderCustomer, setReminderCustomer] = useState(null);
  const [showWhyOpenModal, setShowWhyOpenModal] = useState(false);

  const t = translations[lang];

  // Fetch initial data
  const fetchCustomers = async () => {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(data.customers || []);
      }
    } catch (err) {
      console.error('Failed to load customers:', err);
    }
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch (err) {
      console.error('Failed to load health status:', err);
    }
  };

  useEffect(() => {
    fetchCustomers();
    fetchHealth();
  }, []);

  // Handle parsing text/voice
  const handleParseText = async (text, source = 'text') => {
    if (!text || !text.trim()) return;
    setIsProcessing(true);
    try {
      const res = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, source })
      });
      if (res.ok) {
        const parsed = await res.json();
        setParsedData(parsed);
        setShowConfirmModal(true);
      }
    } catch (err) {
      console.error('Error during AI parsing:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle saving confirmed transaction
  const handleConfirmSave = async (txData) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData)
      });
      if (res.ok) {
        setShowConfirmModal(false);
        setParsedData(null);
        fetchCustomers();
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
    }
  };

  // Handle settling account with 1 click
  const handleSettleAccount = async (customer) => {
    const confirmMsg = lang === 'hi'
      ? `क्या आप ${customer.name} का ₹${customer.balance} का हिसाब चुकता करना चाहते हैं?`
      : `Settle account of ${customer.name} (₹${customer.balance}) to 0?`;
    
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/customers/${customer.id}/settle`, { method: 'POST' });
      if (res.ok) {
        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.7 }
        });
        fetchCustomers();
      }
    } catch (err) {
      console.error('Error settling account:', err);
    }
  };

  // Reset seed sample data
  const handleResetSeed = async () => {
    if (!window.confirm(lang === 'hi' ? 'डेमो डेटा रीसेट करें?' : 'Reset demo sample data?')) return;
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        fetchCustomers();
      }
    } catch (err) {
      console.error('Error reseeding:', err);
    }
  };

  return (
    <div className="app-container">
      {/* 1. Header */}
      <Header
        lang={lang}
        setLang={setLang}
        aiStatus={aiStatus}
        onResetSeed={handleResetSeed}
        onOpenWhyOpen={() => setShowWhyOpenModal(true)}
      />

      {/* 2. Top Stats Overview Cards */}
      <StatsOverview
        customers={customers}
        lang={lang}
      />

      {/* 3. Voice Hub / Mic input bar for Father */}
      <VoiceInputBar
        lang={lang}
        onParseText={handleParseText}
        isProcessing={isProcessing}
      />

      {/* 4. Customer Directory & Balance Sheet */}
      <CustomerList
        customers={customers}
        lang={lang}
        onSelectCustomer={(cust) => setSelectedCustomer(cust)}
        onOpenReminder={(cust) => setReminderCustomer(cust)}
        onSettleAccount={handleSettleAccount}
      />

      {/* Confirmation Modal after Voice/Text Parse */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        parsedData={parsedData}
        onClose={() => {
          setShowConfirmModal(false);
          setParsedData(null);
        }}
        onConfirm={handleConfirmSave}
        lang={lang}
      />

      {/* Customer Ledger Detailed Statement Modal */}
      <LedgerModal
        isOpen={!!selectedCustomer}
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onRefreshData={fetchCustomers}
        lang={lang}
      />

      {/* Polite Payment Reminder Modal */}
      <ReminderModal
        isOpen={!!reminderCustomer}
        customer={reminderCustomer}
        onClose={() => setReminderCustomer(null)}
        lang={lang}
      />

      {/* Why Open Innovation Matters Modal */}
      <WhyOpenMattersModal
        isOpen={showWhyOpenModal}
        onClose={() => setShowWhyOpenModal(false)}
        lang={lang}
      />

      {/* Footer */}
      <footer style={{
        marginTop: '3.5rem',
        textAlign: 'center',
        padding: '1.5rem',
        color: 'var(--text-muted)',
        fontSize: '0.82rem',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.45rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span>उधार खाता (Udhaar Khata)</span>
          <span>•</span>
          <span>Built for Father with ❤️</span>
          <span>•</span>
          <span style={{ color: '#c084fc', fontWeight: 600 }}>Google Gemma 2 (2B) + OpenAI Whisper</span>
          <span>•</span>
          <span>Hacktoberfest Weekend Challenge</span>
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
          100% Local Open-Weights Inference • Zero External Cloud APIs • No Data Leaves This Laptop
        </div>
      </footer>
    </div>
  );
}
