import { useState, useEffect } from 'react'
import { Upload,Trash2, Settings } from 'lucide-react';
import Onboarding from './components/Onboarding';
import Configuration from './components/Configuration';
function App() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('hasOnboarded'))
  const [showConfig, setShowConfig] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ downloading: false, percent: 0, status: '' })
  
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

  const pullModel = async (modelName, originalMessage, imageObj) => {
    try {
      setDownloadProgress({ downloading: true, percent: 0, status: `Downloading ${modelName}...` });
      
      const response = await fetch('http://localhost:11434/api/pull', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) throw new Error("Failed to pull model");

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.total && parsed.completed) {
              const percent = Math.round((parsed.completed / parsed.total) * 100);
              setDownloadProgress({ downloading: true, percent, status: parsed.status });
            } else if (parsed.status) {
              setDownloadProgress(prev => ({ ...prev, status: parsed.status }));
            }
          } catch (e) {}
        }
      }
      
      // Finished downloading!
      setDownloadProgress({ downloading: false, percent: 0, status: '' });
      // Resume original message
      await handleSend(originalMessage, imageObj, true); 
    } catch (error) {
      console.error("Pull error:", error);
      setDownloadProgress({ downloading: false, percent: 0, status: '' });
      updateActiveChat(prevMsgs => {
        const newMsgs = [...prevMsgs];
        newMsgs[newMsgs.length - 1].content = `⚠️ Failed to download model: ${error.message}`;
        return newMsgs;
      });
      setIsLoading(false);
    }
  };

  // --- OLLAMA AI INTEGRATION ---
  const handleSend = async (forcedInput = null, imageObj = null, isResume = false) => {
    // If we passed a string directly, use it. Otherwise use the state.
    const messageToUse = typeof forcedInput === 'string' ? forcedInput : input;
    
    if ((!messageToUse.trim() && !imageObj) || (!isResume && isLoading) || !activeChatId) return;

    const userMessage = messageToUse.trim();
    if (typeof forcedInput !== 'string') {
      setInput(''); // Only clear the input box if we used the input box
    }
    
    if (!isResume) setIsLoading(true);

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

    if (!isResume) {
      // 1. Add user message to UI
      updateActiveChat(prevMsgs => [...prevMsgs, { role: 'user', content: userMessage, imageUrl: imageObj?.url }]);

      // 2. Add a blank AI message placeholder with isThinking flag
      updateActiveChat(prevMsgs => [...prevMsgs, { role: 'ai', content: '', isThinking: true }]);
    } else {
      // Clear the error message placeholder to retry
      updateActiveChat(prevMsgs => {
        const newMsgs = [...prevMsgs];
        newMsgs[newMsgs.length - 1].content = '';
        newMsgs[newMsgs.length - 1].isThinking = true;
        return newMsgs;
      });
    }

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

    // 1. Grab User Preferences from LocalStorage
    const sysDesignation = localStorage.getItem('luna-designation') || 'Commander';
    const sysName = localStorage.getItem('luna-assistantName') || 'Luna';
    const sysLanguage = localStorage.getItem('luna-language') || 'Universal English';
    const selectedModelSetting = localStorage.getItem('luna-model') || 'core';
    
    // Determine actual Ollama model name based on UI setting
    let ollamaModel = 'phi3';
    if (imageObj) ollamaModel = 'llava';
    else if (selectedModelSetting === 'pro') ollamaModel = 'llama3';
    else if (selectedModelSetting === 'flash') ollamaModel = 'gemma2';

    try {
      // 2. Build the System Prompt
      const systemPrompt = `You are a highly advanced AI named ${sysName}. You are assisting ${sysDesignation}. You must always respond in ${sysLanguage}. Be helpful, concise, and stay in character.`;
      // 3. Gather the last 10 messages from the active chat so Luna remembers context
      const recentHistory = (activeChat?.messages || []).slice(-10).map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));
      // 4. Construct the final message payload for the /api/chat endpoint
      const currentMessagePayload = {
        role: 'user',
        content: userMessage || 'What is in this image?'
      };
      
      if (imageObj) {
        currentMessagePayload.images = [imageObj.data];
      }
      // 5. Send request to the CHAT endpoint with optimized options for speed
      const response = await fetch('http://localhost:11434/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ollamaModel,
          messages: [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
            currentMessagePayload
          ],
          stream: true,
          options: {
            num_ctx: 2048, // Limit context to save memory and speed up processing
            num_thread: 8  // Use more CPU threads for faster generation
          }
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama Error: ${errorText || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last partial line in the buffer
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.message && parsed.message.content) {
              updateActiveChat(prevMsgs => {
                const newMsgs = [...prevMsgs];
                const lastMessage = {...newMsgs[newMsgs.length - 1]};
                lastMessage.isThinking = false; // Turn off thinking state!
                lastMessage.content += parsed.message.content;
                newMsgs[newMsgs.length - 1] = lastMessage;
                return newMsgs;
              });
            }
          } catch (e) {
            console.warn("Failed to parse Ollama chunk:", line);
          }
        }
      }
      
      setIsLoading(false);
    } catch (error) {
      if (error.message.includes('not found') && !isResume) {
         // Auto-download the missing model!
         pullModel(ollamaModel, userMessage, imageObj);
         return; 
      }
      
      console.error(error);
      updateActiveChat(prevMsgs => {
        const newMsgs = [...prevMsgs];
        newMsgs[newMsgs.length - 1].isThinking = false;
        newMsgs[newMsgs.length - 1].content = `⚠️ ${error.message}`;
        return newMsgs;
      });
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

        {/* --- DYNAMIC INPUT AREA --- */}
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