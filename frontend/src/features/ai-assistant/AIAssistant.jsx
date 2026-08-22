import { useState, useEffect, useRef } from 'react';
import {
  Send, Sparkles, HelpCircle, Bot, User, BookOpen,
  ChevronDown, ChevronUp, Copy, Check, RefreshCw, Trash2,
  Database, Zap, Brain, Layers
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth.js';
import { chatWithLLM, chatWithRAG } from '../../services/api.js';

export default function AIAssistant() {
  const { profile } = useAuth();

  // Default mode is LLM as required
  const [mode, setMode] = useState(() => {
    return localStorage.getItem('campusos_ai_mode') || 'llm';
  });

  // Separate conversation history for LLM Mode
  const [llmMessages, setLlmMessages] = useState(() => {
    const saved = localStorage.getItem('campusos_chat_history_llm');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Could not parse saved LLM chat history');
      }
    }
    return [
      {
        id: 'msg-welcome-llm',
        role: 'assistant',
        sender: 'assistant',
        content: `Hi ${profile?.full_name || 'Student'}! Welcome to ✨ LLM Mode powered by Gemini. Ask me general programming, academic concepts, reasoning, or technical interview questions!`,
        mode: 'llm',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: '✨ Gemini 2.5 Flash'
      }
    ];
  });

  // Separate conversation history for RAG Mode
  const [ragMessages, setRagMessages] = useState(() => {
    const saved = localStorage.getItem('campusos_chat_history_rag');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Could not parse saved RAG chat history');
      }
    }
    return [
      {
        id: 'msg-welcome-rag',
        role: 'assistant',
        sender: 'assistant',
        content: `Hi ${profile?.full_name || 'Student'}! Welcome to 📚 RAG Mode. Ask questions grounded strictly in official university handbooks, hostel rules, attendance, and placement guidelines!`,
        mode: 'rag',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: '📚 RAG Knowledge Base'
      }
    ];
  });

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedSources, setExpandedSources] = useState({});
  const messagesEndRef = useRef(null);

  // Active messages based on current mode
  const messages = mode === 'llm' ? llmMessages : ragMessages;

  // Helper setter to update current mode messages
  const updateMessages = (newMessagesOrFn) => {
    if (mode === 'llm') {
      setLlmMessages(newMessagesOrFn);
    } else {
      setRagMessages(newMessagesOrFn);
    }
  };

  // Save mode selection to localStorage
  useEffect(() => {
    localStorage.setItem('campusos_ai_mode', mode);
  }, [mode]);

  // Persist LLM messages history
  useEffect(() => {
    try {
      localStorage.setItem('campusos_chat_history_llm', JSON.stringify(llmMessages));
    } catch (e) {
      console.warn('Failed to persist LLM chat messages', e);
    }
  }, [llmMessages]);

  // Persist RAG messages history
  useEffect(() => {
    try {
      localStorage.setItem('campusos_chat_history_rag', JSON.stringify(ragMessages));
    } catch (e) {
      console.warn('Failed to persist RAG chat messages', e);
    }
  }, [ragMessages]);

  // Auto-scroll to bottom on message change
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

  const toggleSources = (msgId) => {
    setExpandedSources((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    if (window.confirm(`Are you sure you want to clear ${mode.toUpperCase()} chat history?`)) {
      const resetWelcome = [
        {
          id: `msg-welcome-${mode}-${Date.now()}`,
          role: 'assistant',
          sender: 'assistant',
          content: mode === 'llm'
            ? `LLM Chat history cleared. ✨ Ask me general questions, programming problems, or switch to 📚 RAG Mode for campus policy search!`
            : `RAG Chat history cleared. 📚 Ask questions grounded strictly in official university documents!`,
          mode: mode,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          agentName: mode === 'llm' ? '✨ Gemini 2.5 Flash' : '📚 RAG Knowledge Base'
        }
      ];
      updateMessages(resetWelcome);
      localStorage.removeItem(`campusos_chat_history_${mode}`);
    }
  };

  const handleSend = async (customQuery) => {
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

    updateMessages((prev) => [...prev, userMsg]);
    if (!customQuery) setInputValue('');
    setIsLoading(true);

    try {
      let responseData;
      if (currentMode === 'llm') {
        const historyContext = llmMessages.slice(-6).map(m => ({
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

      updateMessages((prev) => [...prev, botMsg]);
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

      updateMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerate = () => {
    if (messages.length < 2 || isLoading) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user' || m.sender === 'user');
    if (lastUserMsg && lastUserMsg.content) {
      handleSend(lastUserMsg.content);
    }
  };

  const isLLM = mode === 'llm';

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] animate-fade-in space-y-4 font-sans max-w-7xl mx-auto w-full">
      {/* Top Header with Segmented Toggle & Mode Status */}
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

          {/* Active Mode Badge */}
          <div className="inline-flex items-center gap-2">
            <span className={`px-3 py-1 rounded-full text-xs font-extrabold border transition-all ${
              isLLM
                ? 'bg-purple-500/10 text-purple-700 border-purple-200/80'
                : 'bg-sky-500/10 text-sky-700 border-sky-200/80'
            }`}>
              {isLLM ? '✨ LLM Mode Active — General AI powered by Gemini' : '📚 RAG Mode Active — Grounded Knowledge Search'}
            </span>
          </div>
        </div>

        {/* Right Header Controls: Segmented Toggle & Clear Chat */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Segmented Toggle (LLM | RAG) */}
          <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1 border border-slate-200/60 shadow-inner">
            <button
              onClick={() => setMode('llm')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                isLLM
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              ✨ LLM (Default)
            </button>

            <button
              onClick={() => setMode('rag')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                !isLLM
                  ? 'bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-md shadow-sky-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              📚 RAG
            </button>
          </div>

          <button
            onClick={handleClearChat}
            className="px-3.5 py-2 rounded-2xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs"
            title="Clear current mode chat history"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main Chat Conversation Container */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-100 p-4 sm:p-6 shadow-sm overflow-y-auto flex flex-col space-y-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user' || msg.sender === 'user';
          const msgIsLLM = msg.mode === 'llm' || msg.mode === 'LLM';

          return (
            <div
              key={msg.id || idx}
              className={`flex gap-3 max-w-[85%] sm:max-w-[75%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
            >
              {/* Avatar Icon */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs font-bold text-xs ${
                  isUser
                    ? 'bg-slate-900'
                    : msgIsLLM
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-sky-600 to-blue-600'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : msgIsLLM ? <Sparkles className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
              </div>

              {/* Message Bubble Container */}
              <div
                className={`p-4 rounded-[22px] shadow-2xs relative group transition-all ${
                  isUser
                    ? isLLM
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-200/60 rounded-tl-none'
                }`}
              >
                {/* Assistant Metadata Badge */}
                {!isUser && (
                  <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-200/50">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        msgIsLLM
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-sky-100 text-sky-800 border border-sky-200'
                      }`}>
                        {msgIsLLM ? '✨ LLM' : '📚 RAG'}
                      </span>

                      <span className="text-xs font-bold text-slate-800">
                        {msg.agentName || (msgIsLLM ? '✨ Gemini 2.5 Flash' : '📚 RAG Knowledge Base')}
                      </span>
                    </div>

                    {/* Copy Response Action */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopy(msg.content || msg.text, msg.id || idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-all"
                        title="Copy Message"
                      >
                        {copiedId === (msg.id || idx) ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Message Content */}
                <div className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed space-y-2">
                  {msg.content || msg.text}
                </div>

                {/* Grounded Source Citations for RAG mode */}
                {!isUser && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="text-xs font-extrabold text-sky-800 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-sky-600" />
                      Retrieved Sources ({msg.sources.length}):
                    </div>
                    <div className="space-y-2">
                      {msg.sources.map((doc, docIdx) => (
                        <div key={docIdx} className="p-3 rounded-xl bg-white border border-slate-200/90 text-xs space-y-1 shadow-2xs">
                          <div className="flex flex-wrap items-center justify-between font-bold text-slate-800 gap-1">
                            <span>📄 {doc.file_name || doc.title || 'CampusOS Document'} (Page {doc.page_number || doc.page || 1})</span>
                            {doc.score !== undefined && (
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 font-mono font-bold">
                                Relevance Score: {(doc.score * 100).toFixed(0)}%
                              </span>
                            )}
                          </div>
                          {doc.content && (
                            <p className="text-slate-600 line-clamp-3 text-[11px] italic bg-slate-50 p-2 rounded-lg border border-slate-100 mt-1">
                              "{doc.content}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Timestamp & User label */}
                <div className={`text-[10px] font-medium block text-right mt-2 pt-1 ${
                  isUser ? 'text-white/80 border-t border-white/10' : 'text-slate-400 border-t border-slate-200/50'
                }`}>
                  {msg.timestamp || 'Just now'}
                </div>
              </div>
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 max-w-[75%] mr-auto animate-pulse">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white ${
              isLLM ? 'bg-purple-600' : 'bg-sky-600'
            }`}>
              {isLLM ? <Sparkles className="w-4 h-4 animate-spin" /> : <BookOpen className="w-4 h-4 animate-bounce" />}
            </div>
            <div className="p-4 rounded-[22px] bg-slate-50 border border-slate-200/60 text-slate-500 text-xs font-semibold flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
              {isLLM ? 'Gemini 2.5 Flash is thinking...' : 'Searching CampusOS vector embedding index...'}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
          <HelpCircle className="w-3.5 h-3.5" /> Prompts:
        </span>
        {suggestedQueries.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border whitespace-nowrap transition-all shadow-2xs ${
              isLLM
                ? 'bg-purple-50/60 hover:bg-purple-100 text-purple-700 border-purple-200/60'
                : 'bg-sky-50/60 hover:bg-sky-100 text-sky-700 border-sky-200/60'
            }`}
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white p-2 sm:p-3 rounded-[24px] border border-slate-100 shadow-sm flex items-center gap-2"
      >
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={
            isLLM
              ? '✨ Ask Gemini anything (General AI, Programming, Math, Reasoning)...'
              : '📚 Ask CampusOS Knowledge Base (Attendance, Hostel Rules, Placements)...'
          }
          className="flex-1 px-4 py-3 bg-slate-50 hover:bg-slate-100/80 focus:bg-white text-slate-900 placeholder-slate-400 text-sm font-medium rounded-2xl outline-hidden border border-transparent focus:border-slate-200 transition-all"
        />

        {messages.length > 1 && !isLoading && (
          <button
            type="button"
            onClick={handleRegenerate}
            className="p-3 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-2xl transition-all"
            title="Regenerate Last Response"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className={`p-3.5 rounded-2xl text-white font-bold transition-all shadow-md flex items-center justify-center ${
            !inputValue.trim() || isLoading
              ? 'bg-slate-200 text-slate-400 shadow-none cursor-not-allowed'
              : isLLM
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/20'
              : 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-500/20'
          }`}
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
