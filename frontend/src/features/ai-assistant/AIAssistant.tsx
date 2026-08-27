import { useState, useEffect, useRef } from 'react';
import {
  Send, Sparkles, Bot, User, BookOpen,
  ChevronDown, ChevronUp, RefreshCw,
  History, Plus, MessageSquare, X
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { chatWithLLM, chatWithRAG, fetchWithAuth } from '../../services/api';

export default function AIAssistant() {
  const { profile } = useAuth();

  // Active chat session state
  const [sessionId, setSessionId] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  // Default mode (LLM or RAG)
  const [mode, setMode] = useState(() => localStorage.getItem('campusos_ai_mode') || 'llm');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // 1. Initialize a brand-new AI chat session on login/mount as per specification
  const startNewChatSession = async () => {
    try {
      setIsLoading(true);
      const newSession = await fetchWithAuth('/ai/sessions', {
        method: 'POST',
        body: JSON.stringify({ title: 'New AI Chat Session' })
      });

      setSessionId(newSession.id);
      setMessages([
        {
          id: 'welcome-' + Date.now(),
          role: 'assistant',
          sender: 'assistant',
          content: `Hi ${profile?.full_name || 'Student'}! Welcome to your fresh CampusOS AI session. Ask me general programming, academic concepts, reasoning, or switch to RAG Mode for grounded university document search!`,
          mode: mode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: mode === 'llm' ? '✨ Gemini 2.5 Flash' : '📚 RAG Knowledge Base'
        }
      ]);

      // Refresh past sessions list
      loadPastSessions();
    } catch (err) {
      console.error('Error starting new AI chat session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPastSessions = async () => {
    try {
      const list = await fetchWithAuth('/ai/sessions');
      setPastSessions(list || []);
    } catch (err) {
      console.warn('Could not fetch past AI sessions:', err);
    }
  };

  const loadPastSessionMessages = async (targetSession: any) => {
    try {
      setIsLoading(true);
      const res = await fetchWithAuth(`/ai/sessions/${targetSession.id}/messages`);
      setSessionId(targetSession.id);

      const formatted = (res.messages || []).map((m: any) => ({
        id: 'msg-' + m.id,
        role: m.role,
        sender: m.role,
        content: m.message,
        mode: m.mode || 'llm',
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: m.sources || [],
        agentName: m.role === 'assistant' ? (m.mode === 'rag' ? '📚 RAG Knowledge Base' : '✨ Gemini 2.5 Flash') : null
      }));

      if (formatted.length === 0) {
        setMessages([
          {
            id: 'welcome-empty-' + Date.now(),
            role: 'assistant',
            sender: 'assistant',
            content: `Session "${targetSession.title}". Ask your question to begin!`,
            mode: mode,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            agentName: mode === 'llm' ? '✨ Gemini 2.5 Flash' : '📚 RAG Knowledge Base'
          }
        ]);
      } else {
        setMessages(formatted);
      }
      setShowHistorySidebar(false);
    } catch (err) {
      alert('Failed to load chat history session.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startNewChatSession();
  }, [profile?.id]);

  useEffect(() => {
    localStorage.setItem('campusos_ai_mode', mode);
  }, [mode]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const suggestedQueries = mode === 'llm' ? [
    'Explain Operating Systems architecture',
    'Write a Python Binary Search function',
    'How do I prepare for technical interviews?',
    'What are the key principles of OOP?'
  ] : [
    'What is the university attendance requirement?',
    'What are the hostel warden rules and timings?',
    'How do library book reservations work?',
    'What placement drive criteria apply?'
  ];

  const toggleSources = (msgId: any) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };



  const handleSend = async (customQuery?: string) => {
    const query = (customQuery || inputValue).trim();
    if (!query || isLoading) return;

    const userMsgId = 'msg-' + Date.now();
    const currentMode = mode;

    const userMsg = {
      id: userMsgId,
      role: 'user',
      sender: 'user',
      content: query,
      mode: currentMode,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      user_id: profile?.id
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputValue('');
    setIsLoading(true);

    // Save user message to DB session if active
    if (sessionId) {
      try {
        await fetchWithAuth(`/ai/sessions/${sessionId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ role: 'user', message: query, mode: currentMode })
        });
      } catch (dbErr) {
        console.warn('DB session user msg store warning:', dbErr);
      }
    }

    try {
      let responseData;
      if (currentMode === 'llm') {
        const historyContext = messages.slice(-6).map(m => ({
          role: m.role || m.sender,
          content: m.content || m.text
        }));
        responseData = await chatWithLLM(query, historyContext, profile?.id);
      } else {
        responseData = await chatWithRAG(query, profile?.role || 'student', profile?.id);
      }

      const botMsgText = responseData.answer || responseData.response || (
        currentMode === 'rag' 
          ? 'This information is not available in the university knowledge base.' 
          : 'Thank you for your question.'
      );

      const botMsg = {
        id: 'bot-' + Date.now(),
        role: 'assistant',
        sender: 'assistant',
        content: botMsgText,
        mode: currentMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: responseData.agent_name || (currentMode === 'llm' ? '✨ Gemini 2.5 Flash' : '📚 RAG Knowledge Base'),
        confidenceScore: responseData.confidence_score || responseData.confidence || (currentMode === 'llm' ? 0.99 : 0.95),
        sources: responseData.sources || responseData.source_documents || []
      };

      setMessages((prev) => [...prev, botMsg]);

      // Save assistant response to DB session
      if (sessionId) {
        try {
          await fetchWithAuth(`/ai/sessions/${sessionId}/messages`, {
            method: 'POST',
            body: JSON.stringify({
              role: 'assistant',
              message: botMsgText,
              mode: currentMode,
              sources: botMsg.sources
            })
          });
          loadPastSessions();
        } catch (dbErr) {
          console.warn('DB session bot msg store warning:', dbErr);
        }
      }
    } catch (err) {
      console.error(`[AI Assistant Error] Mode ${currentMode.toUpperCase()}:`, err);

      const errorMsgText = currentMode === 'llm'
        ? "Unable to connect to Gemini AI Assistant right now. Please verify your internet connection or server GEMINI_API_KEY configuration and try again."
        : "This information is not available in the university knowledge base.";

      const botMsg = {
        id: 'bot-err-' + Date.now(),
        role: 'assistant',
        sender: 'assistant',
        content: errorMsgText,
        mode: currentMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: currentMode === 'llm' ? '✨ Gemini 2.5 Flash' : '📚 RAG Knowledge Base',
        confidenceScore: 0.0,
        sources: []
      };

      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const isLLM = mode === 'llm';

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] animate-fade-in space-y-4 font-sans max-w-7xl mx-auto w-full relative">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-[24px] border border-slate-100 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span className={`p-2 rounded-xl transition-all ${
                isLLM ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-sky-50 text-sky-600 border border-sky-100'
              }`}>
                {isLLM ? <Sparkles className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </span>
              CampusOS AI Assistant
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {isLLM 
              ? 'General knowledge, coding, academic concepts, and technical reasoning powered by Gemini 2.5 Flash.' 
              : 'Grounded university search. Answers restricted strictly to indexed campus handbooks & rules.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chat History Sidebar Toggle Button */}
          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="px-3.5 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5"
            title="View AI Chat History"
          >
            <History className="w-4 h-4 text-indigo-600" />
            <span>Chat History ({pastSessions.length})</span>
          </button>

          <button
            onClick={startNewChatSession}
            className="px-3.5 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Start New AI Chat Session"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>

          {/* Segmented Mode Selector Switch */}
          <div className="bg-slate-100/80 p-1 rounded-2xl border border-slate-200/80 flex items-center gap-1">
            <button
              onClick={() => setMode('llm')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                isLLM ? 'bg-white text-purple-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              ✨ LLM Mode
            </button>
            <button
              onClick={() => setMode('rag')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                !isLLM ? 'bg-white text-sky-700 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-sky-600" />
              📚 RAG Mode
            </button>
          </div>
        </div>
      </div>

      {/* Main Chat Body with Collapsible Chat History Sidebar */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        {/* Chat History Sidebar Overlay / Panel */}
        {showHistorySidebar && (
          <div className="absolute lg:relative z-40 inset-y-0 left-0 w-72 bg-white rounded-3xl p-4 border border-slate-200 shadow-xl lg:shadow-sm flex flex-col space-y-3 animate-fade-in shrink-0">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600" /> AI Chat History
              </h3>
              <button onClick={() => setShowHistorySidebar(false)} className="text-slate-400 hover:text-slate-600 p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={startNewChatSession}
              className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center justify-center gap-2 border border-indigo-100 transition-all"
            >
              <Plus className="w-4 h-4" /> Start New Session
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {pastSessions.length === 0 ? (
                <p className="text-xs text-slate-400 p-4 text-center">No previous AI sessions recorded.</p>
              ) : (
                pastSessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadPastSessionMessages(s)}
                    className={`w-full text-left p-3 rounded-xl transition-all border text-xs font-medium space-y-1 block ${
                      sessionId === s.id
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-950 font-bold'
                        : 'bg-slate-50/60 hover:bg-slate-100 border-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="truncate">{s.title || 'Chat Session'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span>{new Date(s.created_at).toLocaleDateString()}</span>
                      <span>{s.message_count} msg(s)</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Chat Feed */}
        <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user' || msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs ${
                    isUser ? 'bg-indigo-600 text-white' : (isLLM ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700')
                  }`}>
                    {isUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>

                  <div className={`space-y-2 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 text-[11px] text-slate-400 font-medium ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold text-slate-700">{isUser ? 'You' : (msg.agentName || 'AI Assistant')}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-tr-xs shadow-sm font-medium'
                        : 'bg-slate-50 border border-slate-200/70 text-slate-800 rounded-tl-xs whitespace-pre-wrap'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Grounded RAG Document Sources dropdown */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-100 hover:bg-sky-100/70 px-3 py-1 rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                          <span>Sources & Document Citations ({msg.sources.length})</span>
                          {expandedSources[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedSources[msg.id] && (
                          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700 animate-fade-in max-h-48 overflow-y-auto">
                            {msg.sources.map((src: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-xl bg-white border border-slate-100 space-y-1">
                                <span className="font-bold text-slate-900 block text-[11px]">
                                  📄 Document: {src.file_name || src.title || 'University Record'} (Page {src.page_number || 1})
                                </span>
                                <p className="text-[11px] text-slate-600 font-mono leading-relaxed bg-slate-50 p-2 rounded-lg">
                                  "{src.content}"
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center gap-3 text-xs font-bold text-slate-500 bg-slate-50 p-4 rounded-2xl w-max animate-pulse">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                <span>AI Assistant is generating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          <div className="p-3 bg-slate-50/70 border-t border-slate-100 flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider shrink-0 px-2">Suggestions:</span>
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-3 py-1 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-600 text-xs font-medium shrink-0 transition-all shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isLLM ? "Ask LLM Mode (General knowledge, DSA, React, SQL)..." : "Ask RAG Mode (Hostel rules, library policies, attendance criteria)..."}
              className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="p-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
