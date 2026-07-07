import React, { useState } from 'react';
import { 
  Settings, 
  Shield, 
  RefreshCw, 
  Moon, 
  Sun, 
  ArrowLeft, 
  Rocket,
  CheckCircle2
} from 'lucide-react';

export default function Configuration({ onBack }) {
  // Initialize state from localStorage
  const [theme, setTheme] = useState(() => localStorage.getItem('luna-theme') || 'midnight');
  const [model, setModel] = useState(() => localStorage.getItem('luna-model') || 'core');
  const [designation,setDesignation] = useState(() => localStorage.getItem('luna-designation') || 'Commander')
  const [assistantName,setAssistantName] = useState(() => localStorage.getItem('luna-assistantName') || 'Luna')
  const [language,setLanguage] = useState(() => localStorage.getItem('luna-language') || 'Universal English')
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('luna-fontSize') || 'default');
  const [personality, setPersonality] = useState(() => localStorage.getItem('luna-personality') || 'balanced');

  const [activeTab, setActiveTab] = useState('settings');
  const [isSaving, setIsSaving] = useState(false);

  const handleWipeData = async () => {
    if (confirm("Are you sure you want to wipe all memories? This cannot be undone.")) {
        await window.api.clearChats();
        localStorage.clear();
        alert("Memory wiped. Luna will restart.");
        window.location.reload();
    }
  }

  const handleSave = () => {
    setIsSaving(true);
    
    localStorage.setItem('luna-theme', theme);
    localStorage.setItem('luna-model', model);
    localStorage.setItem('luna-designation', designation);
    localStorage.setItem('luna-assistantName', assistantName);
    localStorage.setItem('luna-language', language);
    localStorage.setItem('luna-fontSize', fontSize);
    localStorage.setItem('luna-personality', personality);
    
    if (theme === 'nova') {
      document.body.classList.add('theme-nova');
    } else {
      document.body.classList.remove('theme-nova');
    }

    if (fontSize === 'large') {
      document.body.classList.add('font-large');
      document.body.classList.remove('font-small');
    } else if (fontSize === 'small') {
      document.body.classList.add('font-small');
      document.body.classList.remove('font-large');
    } else {
      document.body.classList.remove('font-large', 'font-small');
    }

    setTimeout(() => {
      onBack();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center nebula-bg overflow-hidden p-6 text-on-surface">
      {/* Main Configuration Shell */}
      <div className="w-full max-w-[100rem] h-full max-h-[750px] glass-panel rounded-[32px] overflow-hidden shadow-2xl flex flex-col md:flex-row relative z-10 animate-fade-in">
        
        {/* Sidebar */}
        <aside className="w-full md:w-[280px] border-b md:border-b-0 md:border-r border-white/10 p-6 flex flex-col gap-6 bg-surface-container/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary-container p-[2px]">
              <div className="w-full h-full rounded-full bg-surface flex items-center justify-center overflow-hidden">
                <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/40 via-secondary-container/20 to-transparent"></div>
              </div>
            </div>
            <div>
              <h2 className="font-display-sm text-[20px] leading-tight font-bold text-on-surface">Luna</h2>
              <p className="font-mono-label text-[10px] text-on-surface-variant/60 uppercase tracking-widest">Celestial Intelligence</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 mt-4">
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all w-full text-left ${activeTab === 'settings' ? 'bg-white/5 text-primary font-bold border-r-2 border-primary' : 'text-on-surface-variant/70 hover:bg-white/5'}`}
            >
              <Settings className="w-5 h-5" />
              <span className="font-label-md text-sm">Configuration</span>
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-all w-full text-left ${activeTab === 'privacy' ? 'bg-white/5 text-primary font-bold border-r-2 border-primary' : 'text-on-surface-variant/70 hover:bg-white/5'}`}
            >
              <Shield className="w-5 h-5" />
              <span className="font-label-md text-sm">Privacy Dashboard</span>
            </button>
          </nav>

          <div className="mt-auto p-4 rounded-2xl bg-primary-container/20 border border-primary/10">
            <p className="font-label-md text-[12px] text-primary/80 mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-secondary-container typing-pulse"></span>
              <span className="text-[12px] font-mono-label text-on-surface/60">Core Modules Ready</span>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <section className="flex-1 p-10 overflow-y-auto flex flex-col">
          <button 
              onClick={onBack}
              className="px-6 py-3 rounded-xl text-on-surface-variant/80 font-label-md hover:text-on-surface transition-colors flex items-center gap-2 bg-primary/90 hover:bg-primary/100"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          <header className="mb-10">
            <h1 className="font-display-sm text-3xl font-bold text-on-surface mb-2 ">
              {activeTab === 'settings' ? 'Configure your Experience' : 'Privacy Dashboard'}
            </h1>
            <p className="font-body-md text-on-surface-variant">
              {activeTab === 'settings' ? 'Fine-tune how you and Luna interact within the cosmos.' : 'Complete transparency and control over your data.'}
            </p>
          </header>

          {activeTab === 'settings' && (
          <div className="space-y-8 flex-1 animate-fade-in">
            {/* Form Row: Names */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label-md text-sm text-on-surface/80 ml-1">Your Designation</label>
                <input className="w-full h-12 glass-input rounded-xl px-4 text-on-surface font-body-md" placeholder="Commander" type="text" value={designation} onChange={(e) => setDesignation(e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-sm text-on-surface/80 ml-1">Assistant Name</label>
                <input className="w-full h-12 glass-input rounded-xl px-4 text-on-surface font-body-md" type="text" value={assistantName} onChange={(e) => setAssistantName(e.target.value)} />
              </div>
            </div>

            {/* Font Size & Personality */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="font-label-md text-sm text-on-surface/80 ml-1">Font Size</label>
                <select 
                  className="w-full h-12 glass-input rounded-xl px-4 text-on-surface font-body-md cursor-pointer outline-none appearance-none bg-surface/50" 
                  value={fontSize} 
                  onChange={(e) => setFontSize(e.target.value)}
                >
                  <option value="small" className="bg-surface-container text-on-surface">Small</option>
                  <option value="default" className="bg-surface-container text-on-surface">Default</option>
                  <option value="large" className="bg-surface-container text-on-surface">Large</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-sm text-on-surface/80 ml-1">AI Personality</label>
                <select 
                  className="w-full h-12 glass-input rounded-xl px-4 text-on-surface font-body-md cursor-pointer outline-none appearance-none bg-surface/50" 
                  value={personality} 
                  onChange={(e) => setPersonality(e.target.value)}
                >
                  <option value="concise" className="bg-surface-container text-on-surface">Concise & Direct</option>
                  <option value="balanced" className="bg-surface-container text-on-surface">Balanced (Default)</option>
                  <option value="creative" className="bg-surface-container text-on-surface">Creative & Detailed</option>
                </select>
              </div>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="font-label-md text-sm text-on-surface/80 ml-1">Preferred Language</label>
              <select 
                className="w-full h-12 glass-input rounded-xl px-4 text-on-surface font-body-md cursor-pointer outline-none appearance-none bg-surface/50" 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
              >
                <option value="Universal English" className="bg-surface-container text-on-surface">Universal English (Default)</option>
                <option value="Mandarin Nebula" className="bg-surface-container text-on-surface">Mandarin Nebula</option>
                <option value="Stellar Spanish" className="bg-surface-container text-on-surface">Stellar Spanish</option>
                <option value="French Aurora" className="bg-surface-container text-on-surface">French Aurora</option>
              </select>
            </div>

            {/* Theme Selection */}
            <div className="space-y-3">
              <label className="font-label-md text-sm text-on-surface/80 ml-1">Atmospheric Theme</label>
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => setTheme('midnight')}
                  className={`card-selector p-4 rounded-2xl border flex flex-col items-center gap-2 group transition-all ${theme === 'midnight' ? 'border-primary bg-primary/10 shadow-[inset_0_0_15px_rgba(214,189,231,0.1)]' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <div className="w-full h-20 rounded-lg bg-surface-container-lowest border border-white/5 flex items-center justify-center overflow-hidden relative">
                    <Moon className={`w-8 h-8 transition-transform group-hover:scale-110 ${theme === 'midnight' ? 'text-primary' : 'text-on-surface-variant'}`} />
                  </div>
                  <span className="font-label-md text-sm">Midnight</span>
                </button>
                <button 
                  onClick={() => setTheme('nova')}
                  className={`card-selector p-4 rounded-2xl border flex flex-col items-center gap-2 group transition-all ${theme === 'nova' ? 'border-secondary-container bg-secondary-container/10 shadow-[inset_0_0_15px_rgba(0,238,252,0.1)]' : 'border-white/10 hover:bg-white/5'}`}
                >
                  <div className="w-full h-20 rounded-lg bg-secondary-container/5 border border-white/5 flex items-center justify-center overflow-hidden relative">
                    <Sun className={`w-8 h-8 transition-transform group-hover:scale-110 ${theme === 'nova' ? 'text-secondary-container' : 'text-on-surface-variant'}`} />
                  </div>
                  <span className="font-label-md text-sm">Nova</span>
                </button>
              </div>
            </div>

            {/* Model Selection */}
            <div className="space-y-3">
              <label className="font-label-md text-sm text-on-surface/80 ml-1">AI Intelligence Layer</label>
              <div className="space-y-3">
                
                <label onClick={() => setModel('core')} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${model === 'core' ? 'border-primary bg-primary/5' : 'border-white/5 hover:bg-white/5'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${model === 'core' ? 'border-primary' : 'border-on-surface-variant'}`}>
                    {model === 'core' && <div className="w-2 h-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface">Luna Core <span className="text-primary/60 ml-2">(Balanced)</span>  (Model used <b>phi3</b>)</p>
                    <p className="text-xs text-on-surface-variant/70 mt-1">Standard intelligence for daily assistance and exploration.</p>
                  </div>
                </label>

                <label onClick={() => setModel('pro')} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${model === 'pro' ? 'border-tertiary bg-tertiary/5' : 'border-white/5 hover:bg-white/5'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${model === 'pro' ? 'border-tertiary' : 'border-on-surface-variant'}`}>
                    {model === 'pro' && <div className="w-2 h-2 rounded-full bg-tertiary" />}
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface">Luna Pro <span className="text-tertiary ml-2">(Advanced Reasoning)</span>  (Model used <b>llama3</b>)</p>
                    <p className="text-xs text-on-surface-variant/70 mt-1">High-capacity compute for complex analytical tasks.</p>
                  </div>
                </label>

                <label onClick={() => setModel('flash')} className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${model === 'flash' ? 'border-secondary-container bg-secondary-container/5' : 'border-white/5 hover:bg-white/5'}`}>
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${model === 'flash' ? 'border-secondary-container' : 'border-on-surface-variant'}`}>
                    {model === 'flash' && <div className="w-2 h-2 rounded-full bg-secondary-container" />}
                  </div>
                  <div>
                    <p className="font-label-md text-sm text-on-surface">Luna Flash <span className="text-secondary-container ml-2">(High Speed)</span>  (Model used <b>gemma3</b>)</p>
                    <p className="text-xs text-on-surface-variant/70 mt-1">Low-latency responses for rapid-fire interactions.</p>
                  </div>
                </label>

              </div>
            </div>
          </div>
          )}

          {activeTab === 'privacy' && (
          <div className="space-y-8 flex-1 animate-fade-in">
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-white/10">
                  <h3 className="font-display-sm text-xl font-bold mb-4">Granted Permissions</h3>
                  <ul className="space-y-3 font-body-md text-on-surface-variant">
                      <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary"/> Local File System Access</li>
                      <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary"/> Desktop Command Execution</li>
                      <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-primary"/> Window Management</li>
                  </ul>
              </div>
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-white/10">
                  <h3 className="font-display-sm text-xl font-bold mb-4">Stored Memories</h3>
                  <p className="font-body-md text-on-surface-variant mb-4">Luna saves conversation histories locally on your hardware. No chat data is ever sent to the cloud.</p>
                  <div className="p-4 rounded-xl bg-primary/10 text-primary font-mono text-sm border border-primary/20 flex items-center justify-between">
                      <span>Chat History Database</span>
                      <span className="px-3 py-1 bg-primary/20 rounded-full text-xs">Active</span>
                  </div>
              </div>
              <div className="p-6 rounded-2xl bg-error/10 border border-error/20">
                  <h3 className="font-display-sm text-xl font-bold text-error mb-4">Danger Zone</h3>
                  <p className="font-body-md text-on-surface-variant mb-6">Wiping your memory will permanently delete all conversation history, settings, and personalizations. Luna will reset to factory defaults.</p>
                  <button onClick={handleWipeData} className="px-6 py-3 rounded-xl bg-error text-white font-bold hover:bg-error/80 transition-all flex items-center gap-2 active:scale-95 shadow-[0_0_15px_rgba(255,0,0,0.2)]">
                      Wipe All Memory
                  </button>
              </div>
          </div>
          )}

          {/* Footer Actions */}
          <footer className="pt-10 flex items-center justify-center border-t border-white/5 mt-8">
            
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={`px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all ${isSaving ? 'bg-secondary-container text-on-secondary-container opacity-80' : 'bg-primary text-on-primary hover:shadow-[0_0_20px_rgba(214,189,231,0.4)] active:scale-95'}`}
            >
              {isSaving ? 'Experience Synced' : 'Save & Initialize'}
              <Rocket className="w-5 h-5" />
            </button>
          </footer>
        </section>

      </div>
    </div>
  );
}
