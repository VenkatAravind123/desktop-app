import React, { useState, useMemo } from 'react';
import { Sparkles, Terminal, Scale, Rocket, CheckCircle2, MonitorSmartphone, Sun, Moon } from 'lucide-react';

const Starfield = () => {
  const stars = useMemo(() => Array.from({ length: 150 }).map(() => ({
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    size: Math.random() * 2 + 1 + 'px',
    duration: Math.random() * 3 + 2 + 's',
    delay: Math.random() * 2 + 's'
  })), []);

  return (
    <div className="starfield">
      {stars.map((star, i) => (
        <div 
          key={i} 
          className="star" 
          style={{ 
            left: star.left, 
            top: star.top, 
            width: star.size, 
            height: star.size, 
            '--duration': star.duration,
            animationDelay: star.delay
          }} 
        />
      ))}
    </div>
  );
};

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [persona, setPersona] = useState('Balanced');
  const [designation, setDesignation] = useState('Commander');
  const [assistantName, setAssistantName] = useState('Luna');
  const [language, setLanguage] = useState('Universal English');
  const [theme, setTheme] = useState('midnight');
  const [model, setModel] = useState('core');

  const handleNext = () => {
    if (step < 5) {
      setStep(step + 1);
    } else {
      setIsProcessing(true);
      setTimeout(() => {
        localStorage.setItem('luna-designation', designation);
        localStorage.setItem('luna-assistantName', assistantName);
        localStorage.setItem('luna-language', language);
        localStorage.setItem('luna-theme', theme);
        localStorage.setItem('luna-model', model);

        if (theme === 'nova') {
          document.body.classList.add('theme-nova');
        } else {
          document.body.classList.remove('theme-nova');
        }

        localStorage.setItem('hasOnboarded', 'true');
        onComplete();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden text-on-surface">
      <Starfield />
      {/* Animated Background Shaders */}
      <div className="absolute top-1/4 right-10 w-64 h-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-10 w-80 h-80 bg-secondary/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Glass Panel (or floating for Step 5) */}
      <div className={`w-full max-w-4xl p-10 flex flex-col items-center relative z-10 mx-6 animate-fade-in ${step === 5 ? '' : 'glass-panel rounded-[32px] shadow-2xl'}`}>
        
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

        {/* Step 4: Control Panel Setup */}
        {step === 4 && (
          <div className="flex flex-col items-center w-full max-w-4xl animate-fade-in px-4">
            <h2 className="font-display-sm text-3xl font-bold mb-2">Establish Identity & System</h2>
            <p className="text-on-surface-variant mb-6 text-sm">Configure how you and your assistant interact within the cosmos.</p>
            
            {/* Ollama Requirement Notice */}
            <div className="w-full p-4 rounded-xl bg-primary/10 border border-primary/20 text-on-surface flex items-start gap-3 mb-6 text-left">
              <span className="material-symbols-outlined text-primary shrink-0 mt-0.5">info</span>
              <div className="text-xs space-y-1">
                <p className="font-bold text-primary">Local AI Engine Requirement</p>
                <p className="text-on-surface-variant/80">Luna operates 100% offline on your hardware. This requires the local **Ollama AI Engine** to be running on your system. If you do not have it installed yet, don't worry—Luna will offer a 1-click auto-installer as soon as you enter the app!</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full text-left">
              
              {/* Column 1: Identity */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface/80 ml-1">Your Designation</label>
                  <input 
                    className="w-full h-11 glass-input rounded-xl px-4 text-on-surface font-body-md focus:ring-1 focus:ring-primary outline-none" 
                    type="text" 
                    placeholder="Commander"
                    value={designation} 
                    onChange={(e) => setDesignation(e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface/80 ml-1">AI Assistant Name</label>
                  <input 
                    className="w-full h-11 glass-input rounded-xl px-4 text-on-surface font-body-md focus:ring-1 focus:ring-primary outline-none" 
                    type="text" 
                    value={assistantName} 
                    onChange={(e) => setAssistantName(e.target.value)} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface/80 ml-1">Preferred Language</label>
                  <select 
                    className="w-full h-11 glass-input rounded-xl px-4 text-on-surface font-body-md outline-none bg-surface/50 cursor-pointer" 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                  >
                    <option value="Universal English" className="bg-surface-container text-on-surface">English (Default)</option>
                    <option value="Mandarin Nebula" className="bg-surface-container text-on-surface">Mandarin</option>
                    <option value="Stellar Spanish" className="bg-surface-container text-on-surface">Spanish</option>
                    <option value="French Aurora" className="bg-surface-container text-on-surface">French</option>
                  </select>
                </div>
              </div>

              {/* Column 2: System preferences */}
              <div className="space-y-4">
                {/* Theme Selector */}
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface/80 ml-1">Atmospheric Theme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={() => setTheme('midnight')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${theme === 'midnight' ? 'border-primary bg-primary/10 text-primary' : 'border-white/10 hover:bg-white/5 text-on-surface-variant'}`}
                    >
                      <Moon className="w-4 h-4" />
                      <span className="text-xs font-bold">Midnight</span>
                    </button>
                    <button 
                      onClick={() => setTheme('nova')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-2 transition-all ${theme === 'nova' ? 'border-secondary-container bg-secondary-container/10 text-secondary-container' : 'border-white/10 hover:bg-white/5 text-on-surface-variant'}`}
                    >
                      <Sun className="w-4 h-4" />
                      <span className="text-xs font-bold">Nova</span>
                    </button>
                  </div>
                </div>

                {/* Model Selector */}
                <div className="space-y-1">
                  <label className="font-label-md text-xs text-on-surface/80 ml-1">AI Intelligence Layer</label>
                  <div className="space-y-2">
                    <div onClick={() => setModel('core')} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${model === 'core' ? 'border-primary bg-primary/5' : 'border-white/5 hover:bg-white/5'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${model === 'core' ? 'border-primary' : 'border-on-surface-variant'}`}>
                        {model === 'core' && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-on-surface">Luna Core (Balanced)</p>
                      </div>
                    </div>

                    <div onClick={() => setModel('pro')} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${model === 'pro' ? 'border-tertiary bg-tertiary/5' : 'border-white/5 hover:bg-white/5'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${model === 'pro' ? 'border-tertiary' : 'border-on-surface-variant'}`}>
                        {model === 'pro' && <div className="w-1.5 h-1.5 rounded-full bg-tertiary" />}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-on-surface">Luna Pro (Advanced)</p>
                      </div>
                    </div>

                    <div onClick={() => setModel('flash')} className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${model === 'flash' ? 'border-secondary-container bg-secondary-container/5' : 'border-white/5 hover:bg-white/5'}`}>
                      <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${model === 'flash' ? 'border-secondary-container' : 'border-on-surface-variant'}`}>
                        {model === 'flash' && <div className="w-1.5 h-1.5 rounded-full bg-secondary-container" />}
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-on-surface">Luna Flash (High Speed)</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Step 5: Ready (Redesigned) */}
        {step === 5 && (
          <div className="flex flex-col items-center text-center space-y-6 max-w-2xl animate-fade-in mt-10">
            
            {/* Glowing Purple Sphere */}
            <div className="w-56 h-56 rounded-full mb-6 relative">
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-[#b47af8] to-[#6d30d1] shadow-[0_0_80px_rgba(180,122,248,0.6)]"></div>
            </div>

            <h1 className="font-display-lg text-5xl font-bold tracking-tight text-white mb-2">
              {assistantName} is ready.
            </h1>
            <p className="font-body-lg text-[15px] text-on-surface-variant/80 max-w-md mx-auto leading-relaxed mb-8">
              Your celestial intelligence has reached full synchronization. The boundary between logic and wonder has dissolved.
            </p>

            <button 
              onClick={handleNext}
              disabled={isProcessing}
              className="px-10 py-4 rounded-full bg-primary/90 text-on-surface font-bold text-lg shadow-[0_0_30px_rgba(214,189,231,0.2)] hover:scale-105 hover:text-black hover:bg-primary active:scale-95 transition-all flex items-center justify-center gap-2 mb-6"
            >
              {isProcessing ? 'Syncing...' : 'Enter the Cosmos'}
            </button>

            <div className="px-4 py-1.5 rounded-full border border-white/10 bg-black/40 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#00eefc] shadow-[0_0_8px_rgba(0,238,252,0.8)]"></div>
              <span className="text-[10px] font-mono-label text-white/60 tracking-wider">Core Active: 100% Sync</span>
            </div>
          </div>
        )}

        {/* Footer Actions (Hidden on Step 5) */}
        {step < 5 && (
          <div className="w-full mt-12 flex justify-between items-center px-4">
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`h-2 rounded-full transition-all ${step === i ? 'w-8 bg-primary' : 'w-2 bg-white/20'}`} />
              ))}
            </div>
            
            <button 
              onClick={handleNext}
              className="px-8 py-4 rounded-full bg-primary text-on-primary font-bold shadow-[0_0_20px_rgba(214,189,231,0.4)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
