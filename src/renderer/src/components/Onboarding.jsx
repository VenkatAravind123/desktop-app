import React, { useState } from 'react';
import { Sparkles, Terminal, Scale, Rocket, CheckCircle2, MonitorSmartphone } from 'lucide-react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [persona, setPersona] = useState('Balanced');

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      setIsProcessing(true);
      setTimeout(() => {
        localStorage.setItem('hasOnboarded', 'true');
        onComplete();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center nebula-bg overflow-hidden text-on-surface">
      {/* Animated Background Shaders */}
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Glass Panel */}
      <div className="glass-panel w-full max-w-4xl p-10 rounded-[32px] flex flex-col items-center relative z-10 mx-6 animate-fade-in shadow-2xl">
        
        {/* Step 1: Welcome */}
        {step === 1 && (
          <div className="flex flex-col items-center text-center space-y-6 max-w-2xl">
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary via-on-tertiary-container to-secondary-container flex items-center justify-center shadow-[0_0_50px_rgba(214,189,231,0.5)] animate-floating">
              <Sparkles className="w-16 h-16 text-on-primary-fixed" />
            </div>
            <h1 className="font-display-lg text-5xl font-bold tracking-tight text-white leading-tight">
              Welcome to the <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary-container">Cosmos</span>
            </h1>
            <p className="font-body-lg text-lg text-on-surface-variant">
              Step into the next generation of celestial intelligence. Luna transcends ordinary interaction to offer an ethereal, responsive experience.
            </p>
          </div>
        )}

        {/* Step 2: Personalize */}
        {step === 2 && (
          <div className="flex flex-col items-center w-full animate-fade-in">
            <h2 className="font-display-sm text-3xl font-bold mb-2">Tailor your experience</h2>
            <p className="text-on-surface-variant mb-8">Choose how Luna resonates with you.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
              {[
                { name: 'Technical', icon: Terminal, desc: 'Prioritizes efficiency and raw logic. Ideal for developers.' },
                { name: 'Balanced', icon: Scale, desc: 'A versatile mix of conversationalist and precise analyst.' },
                { name: 'Creative', icon: Sparkles, desc: 'Focuses on abstract thinking and brainstorming.' }
              ].map(p => (
                <div 
                  key={p.name}
                  onClick={() => setPersona(p.name)}
                  className={`p-6 rounded-2xl border cursor-pointer transition-all ${
                    persona === p.name 
                      ? 'bg-primary/20 border-primary shadow-[0_0_30px_rgba(214,189,231,0.2)]' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <p.icon className={`w-10 h-10 mb-4 ${persona === p.name ? 'text-primary' : 'text-on-surface-variant'}`} />
                  <h3 className="font-bold text-xl mb-2">{p.name}</h3>
                  <p className="text-sm text-on-surface-variant">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Desktop Actions */}
        {step === 3 && (
          <div className="flex flex-col items-center text-center space-y-6 max-w-2xl animate-fade-in">
            <div className="w-24 h-24 rounded-full bg-secondary-container/20 flex items-center justify-center mb-4">
              <MonitorSmartphone className="w-12 h-12 text-secondary-container" />
            </div>
            <h2 className="font-display-sm text-3xl font-bold">Enable Desktop Actions</h2>
            <p className="font-body-lg text-lg text-on-surface-variant">
              Luna can securely interact with your local Windows environment. Allow Luna to open applications, create files, and organize your workspace instantly.
            </p>
            <div className="w-full p-4 rounded-xl bg-secondary-container/10 border border-secondary-container/30 text-secondary-container flex items-center gap-4 text-left">
              <CheckCircle2 className="w-8 h-8 shrink-0" />
              <p className="text-sm">End-to-end local processing. No data ever leaves your computer.</p>
            </div>
          </div>
        )}

        {/* Step 4: Ready */}
        {step === 4 && (
          <div className="flex flex-col items-center text-center space-y-6 max-w-2xl animate-fade-in">
             <div className="w-32 h-32 rounded-full glass-panel flex items-center justify-center border-primary/50 shadow-[0_0_50px_rgba(214,189,231,0.5)]">
              <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
            </div>
            <h1 className="font-display-lg text-5xl font-bold tracking-tight text-white">
              Luna is Ready
            </h1>
            <p className="font-body-lg text-lg text-on-surface-variant">
              Your celestial assistant has been fully initialized.
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="w-full mt-12 flex justify-between items-center px-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-2 rounded-full transition-all ${step === i ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`} />
            ))}
          </div>
          
          <button 
            onClick={handleNext}
            disabled={isProcessing}
            className="px-8 py-4 rounded-full bg-primary text-on-primary font-bold shadow-[0_0_20px_rgba(214,189,231,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
          >
            {isProcessing ? (
              <>Syncing with Stars...</>
            ) : step === 4 ? (
              <>
                Initialize Luna <Rocket className="w-5 h-5" />
              </>
            ) : (
              <>Continue</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
