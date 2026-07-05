import { Trash2, Settings } from 'lucide-react';

export default function Sidebar({
  isLoading,
  createNewChat,
  clearMemory,
  setShowConfig,
  chats,
  activeChatId,
  setActiveChatId,
  deleteChatById
}) {
  return (
    <aside className="w-[280px] h-screen fixed left-0 top-0 bg-surface-container/60 backdrop-blur-[40px] border-r border-white/10 shadow-sm flex flex-col py-12 z-50">
      
      {/* Logo Section */}
      <div className="flex items-center gap-4 mb-10 px-6">
        <div className="w-10 h-10 rounded-full glass-panel flex items-center justify-center border border-primary/20">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
        </div>
        <div>
          <h1 className="font-display-sm text-[40px] font-bold text-on-surface leading-none">Luna</h1>
          <p className="font-label-md text-[14px] text-primary/60 tracking-wider">Celestial Intelligence</p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="px-6 space-y-2 mb-6">
        <div onClick={isLoading ? null : createNewChat} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer active:scale-95 transition-transform text-primary font-bold border-2 border-primary bg-primary/10 hover:bg-primary/20">
          <span className="material-symbols-outlined">add_circle</span>
          <span className="font-label-md">New Chat</span>
        </div>
        
        <div onClick={clearMemory} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer active:scale-95 transition-transform text-on-surface-variant/70 hover:bg-white/5 hover:backdrop-blur-xl transition-all duration-300">
          <span className="material-symbols-outlined">delete</span>
          <span className="font-label-md">Delete History</span>
        </div>

        <div onClick={() => setShowConfig(true)} className="flex items-center gap-4 p-4 rounded-xl cursor-pointer active:scale-95 transition-transform text-on-surface-variant/70 hover:bg-white/5 hover:backdrop-blur-xl transition-all duration-300">
          <Settings className="w-6 h-6" />
          <span className="font-label-md">Settings</span>
        </div>
      </div>

      {/* Chat History List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="mb-4 px-2">
          <span className="text-xs font-bold text-on-surface-variant/50 uppercase tracking-widest">Recent Chats</span>
        </div>
        
        <div className="space-y-1">
          {chats.map(chat => (
            <div 
              key={chat.id}
              onClick={() => { if (!isLoading) setActiveChatId(chat.id) }}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${activeChatId === chat.id ? 'bg-primary/20 border-l-2 border-primary text-primary font-bold shadow-lg' : 'text-on-surface-variant/70 hover:bg-white/5'}`}
            >
              <span className="material-symbols-outlined text-[18px]">chat_bubble</span>
              <span className="font-label-md truncate">{chat.title}</span>
              <button className='ml-auto text-on-surface/50 hover:text-error' onClick={(e) => { e.stopPropagation(); deleteChatById(chat.id); }}><Trash2/></button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
