import { useState, useEffect, useRef } from 'react';
import {
  Send, Sparkles, Bot, User, BookOpen,
  ChevronDown, ChevronUp, RefreshCw,
  History, Plus, MessageSquare, X, GraduationCap
} from 'lucide-react';
import { useAuth } from '../../auth/hooks/useAuth';
import { chatWithLLM, chatWithRAG, fetchWithAuth } from '../../services/api';
import { examPrepService } from '../exam-prep/services/examPrepService';
import { StudyCollection } from '../exam-prep/types';

export default function AIAssistant() {
  const { profile } = useAuth();

  // Active chat session state
  const [sessionId, setSessionId] = useState<any>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  // Default mode (LLM, RAG, or SUBJECT_RAG)
  const isStudent = profile?.role === 'student';
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('campusos_ai_mode') || 'llm';
    return (saved === 'subject_rag' && profile?.role !== 'student') ? 'llm' : saved;
  });
  const [studyCollections, setStudyCollections] = useState<StudyCollection[]>([]);
  const [selectedColId, setSelectedColId] = useState<string>('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    async function loadCollections() {
      if (!isStudent) {
        setStudyCollections([]);
        if (mode === 'subject_rag') {
          setMode('llm');
          localStorage.setItem('campusos_ai_mode', 'llm');
        }
        return;
      }
      try {
        const cols = await examPrepService.getCollections();
        setStudyCollections(cols || []);
        if (cols && cols.length > 0 && !selectedColId) {
          setSelectedColId(cols[0].id);
        }
      } catch (e) {
        console.warn('Could not load study collections for AI assistant:', e);
      }
    }
    loadCollections();
  }, [profile?.id, isStudent]);

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
          agentName: mode === 'llm' ? 'Kimi-K3 (Featherless AI)' : 'Campus Knowledge Base'
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
        agentName: m.role === 'assistant' ? (m.mode === 'rag' ? 'Campus Knowledge Base' : 'Kimi-K3 (Featherless AI)') : null
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
            agentName: mode === 'llm' ? 'Kimi-K3 (Featherless AI)' : 'Campus Knowledge Base'
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
      let responseData: any;
      let agentLabel = 'Kimi-K3 (Featherless AI)';

      if (currentMode === 'llm') {
        const historyContext = messages.slice(-6).map(m => ({
          role: m.role || m.sender,
          content: m.content || m.text
        }));
        responseData = await chatWithLLM(query, historyContext, profile?.id);
        agentLabel = responseData.agent_name || 'Kimi-K3 (Featherless AI)';
      } else if (currentMode === 'subject_rag' && selectedColId) {
        responseData = await examPrepService.querySubject({
          collection_id: selectedColId,
          question: query,
        });
        const selectedCol = studyCollections.find(c => c.id === selectedColId);
        agentLabel = `${selectedCol?.subject_name || 'Subject Notes'} RAG`;
      } else {
        responseData = await chatWithRAG(query, profile?.role || 'student', profile?.id);
        agentLabel = responseData.agent_name || 'Campus Knowledge Base';
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
        agentName: agentLabel,
        confidenceScore: responseData.confidence_score || responseData.confidence || 0.95,
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
        ? "Unable to connect to Kimi-K3 (Featherless AI) Assistant right now. Please verify your internet connection or server FEATHERLESS_API_KEY configuration and try again."
        : "This information is not available in the university knowledge base.";

      const botMsg = {
        id: 'bot-err-' + Date.now(),
        role: 'assistant',
        sender: 'assistant',
        content: errorMsgText,
        mode: currentMode,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: currentMode === 'llm' ? 'Kimi-K3 (Featherless AI)' : 'Campus Knowledge Base',
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-[#EAE3D8] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-[#1C211F] tracking-tight flex items-center gap-2">
              <span className="p-2 rounded-xl bg-[#FDF2ED] text-[#C85A32] border border-[#C85A32]/20">
                {isLLM ? <Bot className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
              </span>
              CampusOS AI Assistant
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#5E6763] font-medium">
            {isLLM 
              ? 'General knowledge, coding, academic concepts, and technical reasoning powered by Kimi-K3 (Featherless AI).' 
              : 'Grounded university search. Answers restricted strictly to indexed campus handbooks & rules.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Chat History Sidebar Toggle Button */}
          <button
            onClick={() => setShowHistorySidebar(!showHistorySidebar)}
            className="px-3.5 py-2 rounded-xl bg-[#FAF7F2] hover:bg-[#F4EFEA] text-[#5E6763] text-xs font-bold transition-all flex items-center gap-1.5 border border-[#EAE3D8]"
            title="View AI Chat History"
          >
            <History className="w-4 h-4 text-[#C85A32]" />
            <span>Chat History ({pastSessions.length})</span>
          </button>

          <button
            onClick={startNewChatSession}
            className="px-3.5 py-2 rounded-xl bg-[#C85A32] hover:bg-[#B44E27] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs active:scale-95"
            title="Start New AI Chat Session"
          >
            <Plus className="w-4 h-4" />
            <span>New Session</span>
          </button>

          {/* Segmented Mode Selector Switch */}
          <div className="bg-[#FAF7F2] p-1 rounded-xl border border-[#EAE3D8] flex items-center gap-1">
            <button
              onClick={() => setMode('llm')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'llm' ? 'bg-white text-[#C85A32] shadow-xs border border-[#EAE3D8]' : 'text-[#8E9893] hover:text-[#1C211F]'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">LLM Mode</span>
              <span className="sm:hidden">LLM</span>
            </button>
            <button
              onClick={() => setMode('rag')}
              className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                mode === 'rag' ? 'bg-white text-[#C85A32] shadow-xs border border-[#EAE3D8]' : 'text-[#8E9893] hover:text-[#1C211F]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Campus RAG</span>
              <span className="sm:hidden">Campus</span>
            </button>
            {profile?.role === 'student' && (
              <button
                onClick={() => setMode('subject_rag')}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  mode === 'subject_rag' ? 'bg-white text-[#C85A32] shadow-xs border border-[#EAE3D8]' : 'text-[#8E9893] hover:text-[#1C211F]'
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Subject Notes</span>
                <span className="sm:hidden">Notes</span>
              </button>
            )}
          </div>

          {/* Subject Dropdown when in Subject RAG Mode */}
          {mode === 'subject_rag' && studyCollections.length > 0 && (
            <select
              value={selectedColId}
              onChange={(e) => setSelectedColId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-[#C85A32]/30 bg-[#FDF2ED] text-[#C85A32] text-xs font-bold outline-none"
            >
              {studyCollections.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.course_code}: {col.subject_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Main Chat Body with Collapsible Chat History Sidebar */}
      <div className="flex-1 flex gap-4 overflow-hidden relative">
        {/* Chat History Sidebar Overlay / Panel */}
        {showHistorySidebar && (
          <div className="absolute lg:relative z-40 inset-y-0 left-0 w-72 bg-white rounded-3xl p-4 border border-[#EAE3D8] shadow-xl lg:shadow-sm flex flex-col space-y-3 animate-fade-in shrink-0">
            <div className="flex items-center justify-between border-b border-[#F3ECE2] pb-3">
              <h3 className="text-sm font-extrabold text-[#1C211F] flex items-center gap-2">
                <History className="w-4 h-4 text-[#C85A32]" /> AI Chat History
              </h3>
              <button onClick={() => setShowHistorySidebar(false)} className="text-[#8E9893] hover:text-[#1C211F] p-1">
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={startNewChatSession}
              className="w-full py-2.5 px-3 rounded-xl bg-[#FDF2ED] text-[#C85A32] hover:bg-[#FAF0E9] text-xs font-bold flex items-center justify-center gap-2 border border-[#C85A32]/20 transition-all"
            >
              <Plus className="w-4 h-4" /> Start New Session
            </button>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {pastSessions.length === 0 ? (
                <p className="text-xs text-[#8E9893] p-4 text-center">No previous AI sessions recorded.</p>
              ) : (
                pastSessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => loadPastSessionMessages(s)}
                    className={`w-full text-left p-3 rounded-xl transition-all border text-xs font-medium space-y-1 block ${
                      sessionId === s.id
                        ? 'bg-[#FDF2ED] border-[#C85A32]/30 text-[#C85A32] font-bold'
                        : 'bg-[#FAF7F2] hover:bg-[#F4EFEA] border-[#EAE3D8] text-[#2D3330]'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <MessageSquare className="w-3.5 h-3.5 text-[#C85A32] shrink-0" />
                      <span className="truncate">{s.title || 'Chat Session'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#8E9893] font-mono">
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
        <div className="flex-1 bg-white rounded-2xl border border-[#EAE3D8] shadow-xs flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user' || msg.sender === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 sm:gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isUser ? 'bg-[#C85A32] text-white' : 'bg-[#FAF0E9] text-[#C85A32] border border-[#C85A32]/20'
                  }`}>
                    {isUser ? <User className="w-4 h-4 sm:w-5 sm:h-5" /> : <Bot className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </div>

                  <div className={`space-y-2 max-w-[85%] sm:max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 text-[11px] text-[#8E9893] font-medium ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <span className="font-bold text-[#1C211F]">{isUser ? 'You' : (msg.agentName || 'AI Assistant')}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>

                    <div className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isUser
                        ? 'bg-[#C85A32] text-white rounded-tr-xs shadow-xs font-medium'
                        : 'bg-[#FAF7F2] border border-[#EAE3D8] text-[#1C211F] rounded-tl-xs whitespace-pre-wrap'
                    }`}>
                      {msg.content}
                    </div>

                    {/* Grounded RAG Document Sources dropdown */}
                    {!isUser && msg.sources && msg.sources.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <button
                          onClick={() => toggleSources(msg.id)}
                          className="text-[11px] font-bold text-[#C85A32] bg-[#FDF2ED] border border-[#C85A32]/20 hover:bg-[#FAF0E9] px-3 py-1 rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <BookOpen className="w-3.5 h-3.5 text-[#C85A32]" />
                          <span>Sources & Document Citations ({msg.sources.length})</span>
                          {expandedSources[msg.id] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                        </button>

                        {expandedSources[msg.id] && (
                          <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EAE3D8] space-y-2 text-xs text-[#2D3330] animate-fade-in max-h-48 overflow-y-auto">
                            {msg.sources.map((src: any, i: number) => (
                              <div key={i} className="p-2.5 rounded-lg bg-white border border-[#EAE3D8] space-y-1">
                                <span className="font-bold text-[#1C211F] block text-[11px]">
                                  Document: {src.file_name || src.title || 'University Record'} (Page {src.page_number || 1})
                                </span>
                                <p className="text-[11px] text-[#5E6763] font-mono leading-relaxed bg-[#FAF7F2] p-2 rounded-lg">
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
              <div className="flex items-center gap-3 text-xs font-bold text-[#5E6763] bg-[#FAF7F2] p-4 rounded-2xl w-max animate-pulse border border-[#EAE3D8]">
                <RefreshCw className="w-4 h-4 animate-spin text-[#C85A32]" />
                <span>AI Assistant is generating response...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Prompts */}
          <div className="p-3 bg-[#FAF7F2] border-t border-[#F3ECE2] flex items-center gap-2 overflow-x-auto">
            <span className="text-[10px] font-extrabold uppercase text-[#8E9893] tracking-wider shrink-0 px-2">Suggestions:</span>
            {suggestedQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                className="px-3 py-1 rounded-xl bg-white border border-[#EAE3D8] hover:border-[#C85A32] text-[#5E6763] hover:text-[#C85A32] text-xs font-medium shrink-0 transition-all shadow-2xs"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-[#EAE3D8] flex items-center gap-3">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={isLLM ? "Ask LLM Mode (General knowledge, DSA, React, SQL)..." : "Ask RAG Mode (Hostel rules, library policies, attendance criteria)..."}
              className="flex-1 px-4 py-3 rounded-2xl bg-[#FAF7F2] border border-[#EAE3D8] text-xs sm:text-sm font-medium text-[#1C211F] focus:outline-none focus:ring-2 focus:ring-[#C85A32]/20 focus:border-[#C85A32] focus:bg-white transition-all"
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="p-3 rounded-2xl bg-[#C85A32] hover:bg-[#B44E27] text-white font-bold text-xs shadow-md shadow-[#C85A32]/20 disabled:opacity-40 transition-all active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
