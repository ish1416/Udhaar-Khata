import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, CornerDownLeft } from 'lucide-react';
import { translations } from '../translations';

export default function VoiceInputBar({ lang, onParseText, isProcessing }) {
  const t = translations[lang];
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [textInput, setTextInput] = useState('');
  const [recognitionSupported, setRecognitionSupported] = useState(true);

  const recognitionRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Initialize Web Speech API if supported in browser
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang === 'en' ? 'en-IN' : 'hi-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setRecognitionSupported(false);
    }
  }, [lang]);

  // When speech recognition ends and we have transcript, send to parse
  const handleStopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (transcript.trim()) {
      onParseText(transcript.trim(), 'voice');
    }
  };

  const handleStartListening = () => {
    setTranscript('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = lang === 'en' ? 'en-IN' : 'hi-IN';
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn('Error starting speech recognition:', err);
      }
    } else {
      // Prompt user that mic isn't supported in this browser
      alert('Speech recognition is not supported in this browser. Please use text input or Chrome/Edge.');
    }
  };

  const toggleMic = () => {
    if (isListening) {
      handleStopListening();
    } else {
      handleStartListening();
    }
  };

  // When transcript updates and user finishes speaking, auto parse on final
  useEffect(() => {
    if (!isListening && transcript.trim()) {
      onParseText(transcript.trim(), 'voice');
      setTranscript('');
    }
  }, [isListening]);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (textInput.trim() && !isProcessing) {
      onParseText(textInput.trim(), 'text');
      setTextInput('');
    }
  };

  const quickSamples = [
    { label: "Ramesh ne 200 udhaar liya", hin: "रमेश ने 200 उधार लिया" },
    { label: "Sunita ne 500 wapas kiye", hin: "सुनीता ने 500 वापस किए" },
    { label: "Sharma ji ko 1200 ka ration udhaar diya", hin: "शर्मा जी को 1200 का राशन उधार दिया" },
    { label: "Mukesh ne 450 jama karwaye", hin: "मुकेश ने 450 जमा करवाए" },
    { label: "Pooja ne 600 ka saman liya", hin: "पूजा ने 600 का सामान लिया" }
  ];

  return (
    <div className="glass-panel" style={{
      padding: '2rem 1.75rem',
      marginBottom: '2rem',
      background: 'linear-gradient(180deg, rgba(20, 27, 45, 0.85) 0%, rgba(14, 19, 31, 0.95) 100%)',
      border: isListening ? '1px solid var(--saffron-400)' : '1px solid var(--border-card)',
      boxShadow: isListening ? 'var(--shadow-glow-saffron)' : 'var(--shadow-md)',
      transition: 'all 0.3s ease'
    }}>
      
      {/* Voice Hub Section */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem' }}>
        
        {/* Pulsing Mic Button */}
        <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
          {isListening && (
            <div style={{
              position: 'absolute',
              inset: '-12px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(245, 158, 11, 0.4) 0%, rgba(245, 158, 11, 0) 70%)',
              animation: 'pulse-ring 1.8s infinite ease-out'
            }} />
          )}

          <button
            onClick={toggleMic}
            disabled={isProcessing}
            style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: isListening 
                ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' 
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isListening ? '0 0 30px rgba(239, 68, 68, 0.5)' : 'var(--shadow-glow-saffron)',
              transform: isListening ? 'scale(1.06)' : 'scale(1)',
              transition: 'all 0.25s ease',
              position: 'relative',
              zIndex: 2
            }}
            title={isListening ? 'Stop' : 'Click & Speak'}
          >
            {isListening ? <MicOff size={36} /> : <Mic size={36} />}
          </button>
        </div>

        {/* Status text */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: isListening ? 'var(--saffron-400)' : '#ffffff' }}>
          {isListening ? t.listening : (isProcessing ? t.processing : t.speak_prompt)}
        </h2>

        {/* Waveform Animation when listening */}
        {isListening && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', height: '36px', marginTop: '0.75rem' }}>
            {[14, 28, 36, 20, 32, 16, 26, 38, 22, 12].map((h, i) => (
              <span
                key={i}
                style={{
                  width: '4px',
                  backgroundColor: 'var(--saffron-400)',
                  borderRadius: '2px',
                  animation: `wave-bounce 0.8s infinite ease-in-out ${i * 0.08}s`
                }}
              />
            ))}
          </div>
        )}

        {/* Live speech transcript box */}
        {(transcript || isListening) && (
          <div style={{
            marginTop: '1rem',
            padding: '0.75rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#fef3c7',
            fontSize: '1.05rem',
            fontWeight: 600,
            maxWidth: '650px'
          }}>
            "{transcript || '...'}"
          </div>
        )}
      </div>

      {/* Manual text input fallback */}
      <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.75rem', maxWidth: '750px', margin: '0 auto 1.25rem' }}>
        <input
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          placeholder={lang === 'hi' ? "या यहाँ लिखें: 'रमेश ने 200 उधार लिया'..." : "Or type here: 'Ramesh ne 200 udhaar liya'..."}
          disabled={isProcessing}
          style={{
            flex: 1,
            fontSize: '0.95rem',
            padding: '0.85rem 1.25rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid var(--border-subtle)'
          }}
        />
        <button
          type="submit"
          disabled={!textInput.trim() || isProcessing}
          style={{
            padding: '0.85rem 1.5rem',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
            color: '#0b0f19',
            fontWeight: 700,
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: 'var(--shadow-glow-saffron)',
            opacity: (!textInput.trim() || isProcessing) ? 0.5 : 1
          }}
        >
          <Sparkles size={16} />
          <span>{t.submit}</span>
        </button>
      </form>

      {/* Quick sample chips */}
      <div style={{ maxWidth: '850px', margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
          {t.quick_samples}
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '0.5rem' }}>
          {quickSamples.map((sample, idx) => (
            <button
              key={idx}
              onClick={() => onParseText(sample.label, 'preset')}
              disabled={isProcessing}
              style={{
                fontSize: '0.78rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(245, 158, 11, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.4)';
                e.currentTarget.style.color = 'var(--saffron-400)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
            >
              <span>💬</span>
              <span>{lang === 'hi' ? sample.hin : sample.label}</span>
            </button>
          ))}
        </div>
      </div>

    </div>
  );
}
