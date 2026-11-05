import React, { useState, useEffect } from 'react';
import type { Language } from '../types';
import { Mic, Volume2, X, ArrowRight } from 'lucide-react';

interface TeluguVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onVoiceAction: (actionType: 'bookToken' | 'orderMedicine' | 'checkSchemes', voiceText: string) => void;
}

export const TeluguVoiceModal: React.FC<TeluguVoiceModalProps> = ({
  isOpen,
  onClose,
  language,
  onVoiceAction,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [voiceGreetingSpoken, setVoiceGreetingSpoken] = useState(false);

  useEffect(() => {
    if (isOpen && !voiceGreetingSpoken && 'speechSynthesis' in window) {
      const textToSpeak = language === 'te'
        ? 'నమస్కారం! నేను మీ ఆరోగ్య బంధు ఏఐ సహాయకుడిని. మీకు కేజీహెచ్ ఆసుపత్రి టోకెన్ కావాలా లేక మందులు ఆర్డర్ చేయాలా?'
        : 'Welcome to Arogya Bandhu. How can I assist you with KGH hospital tokens or medicine delivery today?';

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
      setVoiceGreetingSpoken(true);
    }

    if (!isOpen) {
      setVoiceGreetingSpoken(false);
      setIsListening(false);
      setTranscript('');
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, language, voiceGreetingSpoken]);

  if (!isOpen) return null;

  const startListening = () => {
    setIsListening(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'te' ? 'te-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        setIsListening(false);
        handleEvaluateVoice(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      setTimeout(() => {
        setIsListening(false);
        const sampleText = language === 'te' ? 'కేజీహెచ్ ఆసుపత్రి టోకెన్ బుక్ చేయండి' : 'Book KGH Hospital Token';
        setTranscript(sampleText);
        handleEvaluateVoice(sampleText);
      }, 2000);
    }
  };

  const handleEvaluateVoice = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('మందు') || lower.includes('medicine') || lower.includes('order') || lower.includes('ఆర్డర్')) {
      onVoiceAction('orderMedicine', text);
      onClose();
    } else if (lower.includes('పథక') || lower.includes('ఆధార్') || lower.includes('scheme') || lower.includes('aarogyasri')) {
      onVoiceAction('checkSchemes', text);
      onClose();
    } else {
      onVoiceAction('bookToken', text);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-outline-border space-y-6 relative text-center">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-surface text-outline hover:text-primary transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mx-auto w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center text-on-secondary-container relative">
          <Mic className={`w-10 h-10 text-secondary ${isListening ? 'animate-bounce' : ''}`} />
          {isListening && (
            <span className="absolute inset-0 rounded-full border-4 border-secondary animate-ping" />
          )}
        </div>

        <div>
          <h3 className="text-2xl font-black text-primary">
            {language === 'te' ? 'తెలుగు వాయిస్ అసిస్టెంట్' : 'Telugu Voice Assistant'}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1">
            {language === 'te'
              ? 'స్పష్టంగా మాట్లాడండి - మీ స్వరాన్ని గ్రహించి వెంటనే పని పూర్తి చేస్తుంది.'
              : 'Speak in Telugu or English - AI automatically executes your booking.'}
          </p>
        </div>

        {/* Live Audio / Transcript Display */}
        <div className="p-4 rounded-2xl bg-surface-container text-primary font-bold text-lg min-h-[64px] flex items-center justify-center">
          {isListening ? (
            <span className="text-secondary flex items-center gap-2">
              <Volume2 className="w-5 h-5 animate-pulse" />
              {language === 'te' ? 'మీ స్వరాన్ని వింటోంది...' : 'Listening to voice...'}
            </span>
          ) : transcript ? (
            <span>"{transcript}"</span>
          ) : (
            <span className="text-on-surface-variant text-base font-normal">
              {language === 'te' ? 'మైక్ బటన్ నొక్కి మాట్లాడండి' : 'Click the microphone button to start speaking'}
            </span>
          )}
        </div>

        {/* Big Mic Button */}
        <button
          onClick={startListening}
          disabled={isListening}
          className="btn-pill-primary w-full py-4 text-xl flex items-center justify-center gap-3 shadow-tactile"
        >
          <Mic className="w-6 h-6 text-secondary-fixed" />
          <span>{language === 'te' ? 'మాట్లాడటానికి నొక్కండి' : 'Tap to Speak Now'}</span>
        </button>

        {/* Quick Voice Shortcuts */}
        <div className="pt-2 text-left">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">
            {language === 'te' ? 'లేదా త్వరిత కమాండ్‌పై క్లిక్ చేయండి:' : 'Or tap an instant voice prompt:'}
          </p>
          <div className="space-y-2">
            <button
              onClick={() => handleEvaluateVoice('కేజీహెచ్ ఆసుపత్రి టోకెన్ బుక్ చేయండి')}
              className="w-full p-2.5 rounded-xl border border-outline-subtle bg-surface hover:bg-surface-container text-left text-sm font-semibold text-primary flex items-center justify-between"
            >
              <span>"కేజీహెచ్ ఆసుపత్రి దర్శన టోకెన్ బుక్ చేయండి"</span>
              <ArrowRight className="w-4 h-4 text-secondary" />
            </button>

            <button
              onClick={() => handleEvaluateVoice('షుగర్ మరియు బీపీ మందులు ఆర్డర్ చేయండి')}
              className="w-full p-2.5 rounded-xl border border-outline-subtle bg-surface hover:bg-surface-container text-left text-sm font-semibold text-primary flex items-center justify-between"
            >
              <span>"నా షుగర్ మరియు బీపీ మందులను ఆర్డర్ చేయండి"</span>
              <ArrowRight className="w-4 h-4 text-secondary" />
            </button>

            <button
              onClick={() => handleEvaluateVoice('ఆరోగ్యశ్రీ 25 లక్షల పథకం అర్హత చూడండి')}
              className="w-full p-2.5 rounded-xl border border-outline-subtle bg-surface hover:bg-surface-container text-left text-sm font-semibold text-primary flex items-center justify-between"
            >
              <span>"డా. వైఎస్సార్ ఆరోగ్యశ్రీ ₹25 లక్షల ఉచిత పథకం"</span>
              <ArrowRight className="w-4 h-4 text-secondary" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
