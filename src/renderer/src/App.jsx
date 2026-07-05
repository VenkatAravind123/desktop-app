import { useState, useEffect } from 'react'
import { Upload,Trash2, Settings } from 'lucide-react';
import Onboarding from './components/Onboarding';
import Configuration from './components/Configuration';
function App() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('hasOnboarded'))
  const [showConfig, setShowConfig] = useState(false)
  
  // Multi-Session Chat State
  const [chats, setChats] = useState([])
  const [activeChatId, setActiveChatId] = useState(null)

  // 1. Run ONLY ONCE when the app starts
  useEffect(() => {
    // Apply saved theme instantly
    if (localStorage.getItem('luna-theme') === 'nova') {
      document.body.classList.add('theme-nova');
    }

    const loadHistory = async () => {
      const savedChats = await window.api.getChats();
      if (savedChats && savedChats.length > 0) {
        // Safety Check: If it's the old data format, wipe it immediately to prevent crashing
        if (!savedChats[0].id) {
          await window.api.clearChats();
          createNewChat();
          return;
        }
        setChats(savedChats);
        console.log(savedChats);
        setActiveChatId(savedChats[0].id); // Select the most recent chat
      } else {
        createNewChat();
      }
    };
    loadHistory();
  }, []);

  // 2. Run EVERY TIME the chats array changes to auto-save
  useEffect(() => {
    if (chats.length > 0) {
      window.api.saveChats(chats);
    }
  }, [chats]);

  // Create a brand new chat session
  const createNewChat = () => {
    const newId = Date.now().toString();
    const newChat = {
      id: newId,
      title: "New Conversation",
      messages: [{ role: 'ai', content: 'Starting a new conversation! What is on your mind?' }]
    };
    // Add to the top of the list
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newId);
  };

  // Wipe all memory
  const clearMemory = async () => {
    if (isLoading) return;
    await window.api.clearChats();
    setChats([]);
    createNewChat();
  };

  const deleteChatById = async (id) => {
    if(isLoading) return;
    
    // 1. Filter it out of the React state instantly
    const updatedChats = chats.filter(c => c.id !== id);
    setChats(updatedChats);
    
    // 2. If we just deleted the chat we are looking at, switch to another one
    if (activeChatId === id) {
      if (updatedChats.length > 0) {
        setActiveChatId(updatedChats[0].id);
      } else {
        createNewChat();
      }
    }
    
    // 3. Update the backend
    await window.api.deleteChatById(chats, id);
  }
    // Get the currently selected chat and its messages safely
  const activeChat = chats.find(c => c.id === activeChatId);
  const messages = (activeChat && activeChat.messages) ? activeChat.messages : [];

  // --- OLLAMA AI INTEGRATION ---
  const handleSend = async (forcedInput = null, imageObj = null) => {
    // If we passed a string directly, use it. Otherwise use the state.
    const messageToUse = typeof forcedInput === 'string' ? forcedInput : input;
    
    if ((!messageToUse.trim() && !imageObj) || isLoading || !activeChatId) return;

    const userMessage = messageToUse.trim();
    if (typeof forcedInput !== 'string') {
      setInput(''); // Only clear the input box if we used the input box
    }
    
    setIsLoading(true);

    // Helper function to safely update the active chat's messages
    const updateActiveChat = (updaterFn) => {
      setChats(prevChats => prevChats.map(chat => {
        if (chat.id === activeChatId) {
          const newMessages = updaterFn(chat.messages);
          
          // Auto-generate a title if it's the very first user message
          let newTitle = chat.title;
          if (chat.title === "New Conversation" && newMessages.length === 2) {
             newTitle = userMessage.slice(0, 25) + (userMessage.length > 25 ? '...' : '');
          }
          
          return { ...chat, messages: newMessages, title: newTitle };
        }
        return chat;
      }));
    };

    // 1. Add user message to UI
    updateActiveChat(prevMsgs => [...prevMsgs, { role: 'user', content: userMessage, imageUrl: imageObj?.url }]);

    // 2. Add a blank AI message placeholder
    updateActiveChat(prevMsgs => [...prevMsgs, { role: 'ai', content: '' }]);

    // --- DESKTOP AUTOMATION CHECK ---
    if (userMessage.toLowerCase().startsWith('open notepad')) {
      const result = await window.api.runDesktopCommand('notepad.exe');
      updateActiveChat(prevMsgs => {
        const newMsgs = [...prevMsgs];
        newMsgs[newMsgs.length - 1] = { role: 'ai', content: result };
        return newMsgs;
      });
      setIsLoading(false);
      return; // Stop here!
    }

    if (userMessage.toLowerCase().startsWith('create note')) {
      const parts = userMessage.split(' ');
      if (parts.length >= 4) {
        const filename = parts[2];
        const content = parts.slice(3).join(' ');
        const result = await window.api.createNote(filename, content);
        updateActiveChat(prevMsgs => {
          const newMsgs = [...prevMsgs];
          newMsgs[newMsgs.length - 1] = { role: 'ai', content: result };
          return newMsgs;
        });
      } else {
        updateActiveChat(prevMsgs => {
          const newMsgs = [...prevMsgs];
          newMsgs[newMsgs.length - 1] = { role: 'ai', content: "Please use the format: 'create note filename.txt your message here'" };
          return newMsgs;
        });
      }
      setIsLoading(false);
      return; 
    }
    // --------------------------------

    try {
      const apiBody = {
        model: imageObj ? 'llava' : 'phi3', 
        prompt: userMessage || 'What is in this image?',
        stream: true 
      };
      
      if (imageObj) {
        apiBody.images = [imageObj.data];
      }

      // 3. Send the request to local Ollama API
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(apiBody)
      });

      if (!response.ok) throw new Error('Ollama connection failed');

      // 4. Read the streaming response chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            updateActiveChat(prevMsgs => {
              const newMsgs = [...prevMsgs];
              const lastMessage = {...newMsgs[newMsgs.length - 1]};
              lastMessage.content += parsed.response;
              newMsgs[newMsgs.length - 1] = lastMessage;
              return newMsgs;
            });
          }
        }
      }
    } catch (error) {
      console.error(error);
      updateActiveChat(prevMsgs => {
        const newMsgs = [...prevMsgs];
        newMsgs[newMsgs.length - 1].content = "⚠️ Error: Could not connect to Ollama. Make sure it is running!";
        return newMsgs;
      });
    } finally {
      setIsLoading(false);
    }
  }

  // --- FILE UPLOAD INTEGRATION ---
  const handleFileUpload = async () => {
    if (isLoading || !activeChatId) return;
    try {
      const fileResult = await window.api.readFile();
      if (!fileResult) return; // User canceled

      if (fileResult.type === 'pdf') {
        const truncatedText = fileResult.data.substring(0, 4000);
        const prompt = `Please summarize the following PDF document:\n\n${truncatedText}`;
        await handleSend(prompt);
      } else if (fileResult.type === 'image') {
        await handleSend("Can you describe this image?", fileResult);
      }
    } catch (error) {
      console.error("File Upload Error:", error);
    }
  };

  // Allow pressing Enter to send
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (showOnboarding) {
    return <Onboarding onComplete={() => setShowOnboarding(false)} />;
  }

  if (showConfig) {
    return <Configuration onBack={() => setShowConfig(false)} />;
  }

  return (
    <div className="flex h-screen w-full nebula-bg font-body-md overflow-hidden">
      
      {/* Sidebar Navigation */}
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

      {/* Main Content Area */}
      <main className="ml-[280px] w-[calc(100%-280px)] h-screen flex flex-col relative">
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
                    <p className="font-body-md leading-relaxed text-on-surface/90 whitespace-pre-wrap">
                      {msg.content}
                      {/* Show a blinking cursor while streaming */}
                      {isLoading && index === messages.length - 1 && <span className="loader">█</span>}
                    </p>
                  </div>
                </div>
              );
            }
          })}

        </section>

        {/* --- DYNAMIC INPUT AREA --- */}
        <footer className="p-[40px] relative z-40 bg-gradient-to-t from-background to-transparent">
          <div className="max-w-[900px] mx-auto relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary-container/20 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
            <div className="relative flex items-center gap-4 glass-panel rounded-full p-2 pl-6 border-white/10 group-focus-within:border-secondary-container/50 transition-all shadow-2xl">
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
                 <Upload 
                   onClick={handleFileUpload}
                   className={`text-on-surface-variant/70 hover:text-primary transition-all duration-300 cursor-pointer ${isLoading ? 'opacity-50 pointer-events-none' : ''}`} 
                 />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center send-btn-glow active:scale-90 disabled:opacity-50"
                >
                 
                  <span className="material-symbols-outlined font-bold" style={{ fontVariationSettings: "'FILL' 1" }}>arrow_upward</span>
                </button>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App