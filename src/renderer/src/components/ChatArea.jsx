export default function ChatArea({ activeChat, isLoading, messages }) {
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
                  {msg.isThinking ? (
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

      </section>
    </>
  );
}
