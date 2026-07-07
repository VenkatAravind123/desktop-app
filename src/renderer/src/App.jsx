import { useState, useEffect } from 'react'
import Onboarding from './components/Onboarding';
import Configuration from './components/Configuration';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import InputArea from './components/InputArea';

function App() {
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('hasOnboarded'))
  const [showConfig, setShowConfig] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState({ downloading: false, percent: 0, status: '' })
    const [attachedFile, setAttachedFile] = useState(null);
  
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
        //console.log(savedChats);
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

    const runOllamaInstaller = async () => {
    setDownloadProgress({ downloading: true, percent: 50, status: `Please click 'Yes' on the Admin prompt and follow the progress in the installer window!` });
    try {
      const result = await window.api.installOllama();
      if (result.success) {
        // We let the user know it's running in the other window
        setTimeout(() => {
          setDownloadProgress({ downloading: false, percent: 0, status: '' });
          alert("Once the installer window finishes downloading and closing, you can send your message again!");
        }, 5000);
      } else {
        setDownloadProgress({ downloading: false, percent: 0, status: '' });
        alert(`Failed to install: ${result.message}`);
      }
    } catch (e) {
      setDownloadProgress({ downloading: false, percent: 0, status: '' });
      alert(e.message);
    }
  };

  // --- OLLAMA AI INTEGRATION ---
  const handleSend = async (forcedInput = null, imageObj = null, isResume = false) => {
    // If we passed a string directly, use it. Otherwise use the state.
    const messageToUse = typeof forcedInput === 'string' ? forcedInput : input;
    
    // Default to the component's state if no parameter is provided
    const fileToUse = imageObj || attachedFile;

    if ((!messageToUse.trim() && !fileToUse) || (!isResume && isLoading) || !activeChatId) return;

    const rawUserMessage = messageToUse.trim();

    // Merge PDF text with the prompt if a PDF is attached
    let finalUserMessage = rawUserMessage;
    let finalImageObj = fileToUse;

    if (fileToUse && fileToUse.type === 'pdf') {
      const truncatedText = fileToUse.data.substring(0, 4000);
      finalUserMessage = `[Analyzing Document: "${fileToUse.name}"]\n${truncatedText}\n\nQuestion: ${rawUserMessage || "Summarize this PDF."}`;
      finalImageObj = null;
    }

    setAttachedFile(null); // Clear attachment box in UI!

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
             newTitle = rawUserMessage.slice(0, 25) + (rawUserMessage.length > 25 ? '...' : '');
          }
          
          return { ...chat, messages: newMessages, title: newTitle };
        }
        return chat;
      }));
    };

    if (!isResume) {
      // 1. Add user message to UI
      updateActiveChat(prevMsgs => [...prevMsgs, { role: 'user', content: rawUserMessage, imageUrl: fileToUse?.url, fileName: fileToUse?.type === 'pdf' ? fileToUse.name : null }]);

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

    // --- INTELLIGENT AUTOMATION PIPELINE ---
    const lowerMsg = rawUserMessage.toLowerCase();
    let automationResult = null;

    if (lowerMsg.startsWith('open ') || lowerMsg.startsWith('launch ')) {
      const appName = lowerMsg.replace('open ', '').replace('launch ', '').trim();
      automationResult = await window.api.launchApp(appName);
    } 
    else if (lowerMsg.startsWith('remind me to ')) {
      // Extract task and minutes (e.g. "remind me to drink water in 5 minutes")
      const match = lowerMsg.match(/remind me to (.+) in (\d+) minute/);
      if (match) {
        const task = match[1];
        const minutes = parseInt(match[2]);
        automationResult = await window.api.createReminder(task, minutes * 60000);
      } else {
        automationResult = "Please use the format: 'remind me to [task] in [number] minutes'";
      }
    }
    else if (lowerMsg.startsWith('find ')) {
      const fileName = lowerMsg.replace('find ', '').trim();
      automationResult = await window.api.findFile(fileName);
    }
    else if (lowerMsg.includes('organize my downloads') || lowerMsg.includes('clean my downloads')) {
      automationResult = await window.api.organizeDownloads();
    }
    else if (lowerMsg.startsWith('create note ')) {
      const parts = rawUserMessage.split(' ');
      if (parts.length >= 4) {
        const filename = parts[2];
        const content = parts.slice(3).join(' ');
        automationResult = await window.api.createNote(filename, content);
      } else {
        automationResult = "Please use the format: 'create note filename.txt your message here'";
      }
    }

    // If an automation was triggered, show the result and STOP (don't send to Ollama)
    if (automationResult) {
      updateActiveChat(prevMsgs => {
        const newMsgs = [...prevMsgs];
        newMsgs[newMsgs.length - 1] = { role: 'ai', content: automationResult };
        return newMsgs;
      });
      setIsLoading(false);
      return; 
    }
    // --------------------------------

    // 1. Grab User Preferences from LocalStorage
    const sysDesignation = localStorage.getItem('luna-designation') || 'Commander';
    const sysName = localStorage.getItem('luna-assistantName') || 'Luna';
    const sysLanguage = localStorage.getItem('luna-language') || 'Universal English';
    const selectedModelSetting = localStorage.getItem('luna-model') || 'core';
    const sysPersonality = localStorage.getItem('luna-personality') || 'balanced';
    
    // Personality Injection
    let personalityPrompt = "Be helpful, concise, and stay in character.";
    if (sysPersonality === 'concise') {
        personalityPrompt = "You must be extremely concise and direct. Give short, no-nonsense answers without pleasantries.";
    } else if (sysPersonality === 'creative') {
        personalityPrompt = "You must be highly creative, descriptive, and detailed. Write elegantly and brainstorm freely.";
    }

    // Determine actual Ollama model name based on UI setting
    let ollamaModel = 'phi3';
    if (finalImageObj) ollamaModel = 'llava';
    else if (selectedModelSetting === 'pro') ollamaModel = 'llama3';
    else if (selectedModelSetting === 'flash') ollamaModel = 'gemma2';

    try {
      // 2. Build the System Prompt
      const systemPrompt = `You are a highly advanced AI named ${sysName}. You are assisting ${sysDesignation}. You must always respond in ${sysLanguage}. ${personalityPrompt}`;
      // 3. Gather the last 10 messages from the active chat so Luna remembers context
      const recentHistory = (activeChat?.messages || []).slice(-10).map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : 'user',
        content: msg.content
      }));
      // 4. Construct the final message payload for the /api/chat endpoint
      const currentMessagePayload = {
        role: 'user',
        content: finalUserMessage || 'What is in this image?'
      };
      
      if (finalImageObj) {
        currentMessagePayload.images = [finalImageObj.data];
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
          keep_alive: "20m",
          options: {
            num_ctx: 1024, 
            num_thread: 8,  
            num_predict: 256,
            temperature: 0.5
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
         pullModel(ollamaModel, finalUserMessage, finalImageObj);
         return; 
      }

      if (error.message.includes('Failed to fetch') && !isResume) {
          updateActiveChat(prevMsgs => {
            const newMsgs = [...prevMsgs];
            newMsgs[newMsgs.length - 1].isThinking = false;
            newMsgs[newMsgs.length - 1].isInstallPrompt = true;
            newMsgs[newMsgs.length - 1].content = `⚠️ Ollama AI Engine Not Found`;
            return newMsgs;
          });
          setIsLoading(false);
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
   // --- FILE UPLOAD INTEGRATION ---
  const handleFileUpload = async () => {
    if (isLoading || !activeChatId) return;
    try {
      const fileResult = await window.api.readFile();
      if (!fileResult) return; // User canceled
      setAttachedFile(fileResult); // Stage the file!
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
      
      <Sidebar 
        isLoading={isLoading}
        createNewChat={createNewChat}
        clearMemory={clearMemory}
        setShowConfig={setShowConfig}
        chats={chats}
        activeChatId={activeChatId}
        setActiveChatId={setActiveChatId}
        deleteChatById={deleteChatById}
      />

      <main className="ml-[280px] w-[calc(100%-280px)] h-screen flex flex-col relative">
        <ChatArea 
          activeChat={activeChat}
          isLoading={isLoading}
          messages={messages}
          runOllamaInstaller={runOllamaInstaller}
        />

        <InputArea 
          downloadProgress={downloadProgress}
          input={input}
          setInput={setInput}
          handleKeyDown={handleKeyDown}
          isLoading={isLoading}
          handleFileUpload={handleFileUpload}
          handleSend={handleSend} // Send handles reading state automatically!
          attachedFile={attachedFile}
          setAttachedFile={setAttachedFile}
        />
      </main>
    </div>
  )
}

export default App