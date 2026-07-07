import React, { useEffect, useRef } from 'react';

export default function ChatArea({ activeChat, isLoading, messages, runOllamaInstaller }) {
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  return (
    <>
      <header className="h-16 w-full flex justify-between items-center px-[40px] bg-transparent z-40">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-primary typing-pulse' : 'bg-secondary-container'}`}></div>
          <h2 className="font-label-md text-[14px] text-on-surface/80 uppercase tracking-widest">
            {activeChat ? activeChat.title : 'Chatting with Luna'}
          </h2>
        </div>
      </header>

      {/* --- DYNAMIC MESSAGES AREA --- */}
      <section className="flex-1 overflow-y-auto px-[40px] py-[24px] flex flex-col gap-[24px]" id="chat-container">
        
        {messages.map((msg, index) => {
          if (msg.role === 'user') {
            return (
              <div key={index} className="flex justify-end w-full">
                <div className="max-w-[70%] p-5 rounded-2xl rounded-tr-none bg-gradient-to-br from-primary to-on-tertiary-container text-on-primary user-message-glow">
                  {msg.imageUrl && (
                    <img src={msg.imageUrl} alt="Uploaded" className="w-full max-w-sm rounded-lg mb-3 object-cover shadow-lg border border-white/20" />
                  )}
                  {msg.fileName && (
                    <div className="px-3 py-1.5 rounded-lg bg-white/10 text-white flex items-center gap-2 mb-3 text-xs w-fit border border-white/10">
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      <span className="font-mono">{msg.fileName}</span>
                    </div>
                  )}
                  <p className="font-body-md whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          } else {
            return (
              <div key={index} className="flex justify-start w-full gap-4">
                <div className="w-8 h-8 rounded-full glass-panel flex items-center justify-center border border-primary/20 shrink-0">
                  <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                </div>
                <div className="max-w-[80%] p-6 rounded-2xl rounded-tl-none luna-message-glass">
                  {msg.isInstallPrompt ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3 text-error">
                        <span className="material-symbols-outlined text-xl">error</span>
                        <h3 className="font-display-sm text-lg font-bold">Ollama AI Engine Not Found</h3>
                      </div>
                      <p className="font-body-md text-on-surface-variant leading-relaxed">
                        Luna requires the local Ollama engine to run completely privately on your hardware. 
                        It looks like it isn't installed or isn't running in the background.
                      </p>
                      <div className="flex gap-4 mt-2">
                        <button 
                          onClick={runOllamaInstaller}
                          className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold hover:shadow-[0_0_15px_rgba(214,189,231,0.4)] transition-all active:scale-95 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">download</span>
                          1-Click Auto Install
                        </button>
                        <a 
                          href="https://ollama.com" 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-6 py-3 rounded-xl border border-white/10 text-on-surface hover:bg-white/5 transition-all active:scale-95 flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">open_in_new</span>
                          Manual Download
                        </a>
                      </div>
                    </div>
                  ) : msg.isThinking ? (
                    <div className="flex items-center gap-3 text-primary animate-pulse py-1">
                      <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                      <span className="font-label-md italic opacity-80">Luna is thinking...</span>
                    </div>
                  ) : (
                    <p className="font-body-md leading-relaxed text-on-surface/90 whitespace-pre-wrap">
                      {msg.content}
                      {/* Show a blinking cursor while streaming */}
                      {isLoading && index === messages.length - 1 && <span className="loader">█</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          }
        })}

        <div ref={messagesEndRef} />
      </section>
    </>
  );
}
