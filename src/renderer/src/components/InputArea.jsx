import { Upload } from 'lucide-react';
import { CgAttachment } from "react-icons/cg";

export default function InputArea({
  downloadProgress,
  input,
  setInput,
  handleKeyDown,
  isLoading,
  handleFileUpload,
  handleSend,
  attachedFile,
  setAttachedFile
}) {
  return (
    <footer className="p-[40px] relative z-40 bg-gradient-to-t from-background to-transparent">
      <div className="h-24 bg-gradient-to-t from-background to-transparent absolute bottom-24 w-full pointer-events-none" />

      {/* --- DOWNLOAD PROGRESS BAR --- */}
      {downloadProgress.downloading && (
        <div className="absolute bottom-[100px] left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 animate-fade-in">
          <div className="glass-panel p-4 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-on-surface">
              <span className="font-label-md">{downloadProgress.status}</span>
              <span className="font-display-sm font-bold text-primary">{downloadProgress.percent}%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden border border-white/5">
              <div 
                className="bg-primary h-full transition-all duration-300 ease-out" 
                style={{ width: `${downloadProgress.percent}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* --- ATTACHED FILE PREVIEW (Cleanly placed above the input box) --- */}
      {attachedFile && (
        <div className="max-w-[900px] mx-auto mb-4 animate-fade-in flex">
          <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-on-surface flex items-center gap-3 text-sm">
            <span className="material-symbols-outlined text-primary">
              {attachedFile.type === 'pdf' ? 'description' : 'image'}
            </span>
            <span className="font-mono text-xs max-w-xs truncate">{attachedFile.name}</span>
            <button 
              onClick={() => setAttachedFile(null)}
              className="text-on-surface-variant/60 hover:text-error transition-colors flex items-center"
            >
              <span className="material-symbols-outlined text-xs">close</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-[900px] mx-auto relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary-container/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
        <div className="relative flex items-center gap-4 glass-panel rounded-full p-2 pl-6 border-white/10 group-focus-within:border-secondary-container/50 transition-all shadow-2xl">
        <CgAttachment
            onClick={handleFileUpload} style={{width:"20px",height:"20px",color:"var(--text-on-surface-variant)", cursor:"pointer"}}/>
          <input 
            className="flex-1 bg-transparent border-none focus:ring-0 text-on-surface placeholder-on-surface-variant/40 font-body-md py-4 outline-none" 
            placeholder={isLoading ? "Luna is thinking..." : "Ask Luna about the cosmos..."} 
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          
          <div className="flex items-center gap-2 pr-2">
            
            <button 
              onClick={() => handleSend()} // Clean call (reads attachedFile state automatically)
              disabled={isLoading}
              className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center send-btn-glow active:scale-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
