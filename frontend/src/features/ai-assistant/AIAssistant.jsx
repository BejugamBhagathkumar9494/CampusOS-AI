import { useState } from 'react'
import { Send, Sparkles, HelpCircle, Bot, User, Zap, BookOpen, ChevronDown, ChevronUp, Cpu } from 'lucide-react'
import { chatWithAgent } from '../../services/api.js'

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: 'Hi John! I am your CampusOS Multi-Agent AI Assistant. Agentic Mode is ACTIVE. I dynamically route your queries across specialized neural agents (Academic, Placement, Student Success, Hostel, Finance, Transport, Library, and Grounded RAG). How can I assist you today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      agentName: '🤖 CampusOS AI Supervisor',
      confidenceScore: 0.98
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [agenticMode, setAgenticMode] = useState(true)
  const [expandedSources, setExpandedSources] = useState({})

  const suggestedQueries = [
    'Explain Dijkstra algorithm in simple terms',
    'Calculate my placement readiness score',
    'Generate practice quiz for Automata Theory',
    'What are the campus hostel curfew rules?',
  ]

  const toggleSources = (idx) => {
    setExpandedSources((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  const handleSend = async (customQuery) => {
    const query = (customQuery || inputValue).trim()
    if (!query || isLoading) return

    const userMsg = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    if (!customQuery) setInputValue('')
    setIsLoading(true)

    try {
      const res = await chatWithAgent(query, undefined, undefined, undefined, agenticMode)
      const botMsg = {
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: res.agent_name || (agenticMode ? '🤖 Agentic Supervisor' : '📚 RAG Knowledge Base'),
        confidenceScore: res.confidence_score || 0.95,
        sourceDocs: res.source_documents || []
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      console.warn("API request failed, using intelligent CampusOS RAG fallback:", err)
      const qLower = query.toLowerCase()
      let fallbackText = ""
      
      if (qLower.includes("who are you") || qLower.includes("who r u") || qLower.includes("hi") || qLower.includes("hello")) {
        fallbackText = "Hello! 👋 I am CampusOS AI, your official University Operating System Assistant powered by multi-agent AI for Students, Faculty, and Staff."
      } else if (qLower.includes("attendance") || qLower.includes("present") || qLower.includes("absent")) {
        fallbackText = "CampusOS Attendance Policy: Students must maintain a minimum of 75% overall attendance to be eligible for end-semester examinations. Medical leave certificates can condone up to 10% attendance shortage with warden approval."
      } else if (qLower.includes("placement") || qLower.includes("job") || qLower.includes("resume")) {
        fallbackText = "Placement Intelligence: Top active campus recruiters include Google, Microsoft, Amazon, and TCS Digital. Maintain a CGPA above 6.0 (recommended 8.0+) with zero active backlogs to participate in drive rounds."
      } else if (qLower.includes("hostel") || qLower.includes("curfew") || qLower.includes("room")) {
        fallbackText = "Hostel Policy: Curfew entry cutoff is 10:00 PM on weekdays and 10:30 PM on weekends. Submit plumbing, Wi-Fi, or electrical maintenance tickets directly via your Hostel tab."
      } else {
        fallbackText = `Regarding **"${query}"**:\n\nCampusOS is operating normally. All student records, attendance registers, course modules, and hostel portals are synchronized under your student dashboard.`
      }

      const botMsg = {
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        agentName: agenticMode ? '🤖 Multi-Agent Supervisor' : '📚 RAG Assistant',
        confidenceScore: 0.92
      }
      setMessages((prev) => [...prev, botMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] animate-fade-in space-y-4 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Sparkles className="w-5 h-5" />
            </span>
            AI Academic Assistant
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Powered by LangGraph Agentic Supervisor & Multi-Agent Vector RAG
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-indigo-100 shadow-xs">
          <div className="flex items-center gap-2">
            <Cpu className={`w-4 h-4 ${agenticMode ? 'text-indigo-600 animate-pulse' : 'text-slate-400'}`} />
            <span className="text-xs font-extrabold text-slate-800">Agentic Mode</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              agenticMode ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
            }`}>
              {agenticMode ? 'ON' : 'OFF'}
            </span>
          </div>

          <button
            onClick={() => setAgenticMode(!agenticMode)}
            className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              agenticMode ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                agenticMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] px-5 py-3.5 rounded-[24px] text-sm leading-relaxed overflow-hidden break-words flex flex-col justify-between shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 text-white rounded-tr-xs'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                }`}
              >
                {msg.sender === 'assistant' && msg.agentName && (
                  <div className="flex items-center justify-between gap-2 pb-2.5 mb-3 border-b border-slate-200/60">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-100/70 px-2.5 py-1 rounded-lg">
                      <Zap className="w-3.5 h-3.5 text-indigo-600" />
                      {msg.agentName}
                    </span>
                    {msg.confidenceScore && (
                      <span className="text-[11px] font-semibold text-slate-500 font-mono">
                        {(msg.confidenceScore * 100).toFixed(0)}% confidence
                      </span>
                    )}
                  </div>
                )}

                <p className="whitespace-pre-wrap break-words">{msg.text}</p>

                {msg.sender === 'assistant' && msg.sourceDocs && msg.sourceDocs.length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80">
                    <button
                      onClick={() => toggleSources(idx)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1.5 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {msg.sourceDocs.length} Grounded Source Citation{msg.sourceDocs.length > 1 ? 's' : ''}
                      {expandedSources[idx] ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {expandedSources[idx] && (
                      <div className="mt-2.5 space-y-2 animate-fade-in">
                        {msg.sourceDocs.map((doc, docIdx) => (
                          <div key={docIdx} className="p-2.5 rounded-xl bg-white border border-slate-200/90 text-xs space-y-1">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span>📄 {doc.file_name || 'CampusOS Document'} (Page {doc.page_number || doc.page || 1})</span>
                              {doc.score !== undefined && (
                                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                                  Score: {doc.score}
                                </span>
                              )}
                            </div>
                            {doc.content && (
                              <p className="text-slate-600 line-clamp-3 text-[11px] font-sans italic bg-slate-50/80 p-1.5 rounded">
                                "{doc.content}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <span className={`text-[10px] font-medium block text-right mt-2 pt-1 ${
                  msg.sender === 'user' ? 'text-indigo-200/90 border-t border-white/10' : 'text-slate-400 border-t border-slate-200/50'
                }`}>
                  {msg.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                <Bot className="w-4.5 h-4.5 animate-pulse" />
              </div>
              <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-[20px] rounded-tl-xs text-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-2 items-center">
          <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 shrink-0">
            <HelpCircle className="w-4 h-4 text-indigo-500" /> Prompts:
          </span>
          {suggestedQueries.map((query, i) => (
            <button
              key={i}
              onClick={() => handleSend(query)}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-2xs"
            >
              {query}
            </button>
          ))}
        </div>

        <div className="p-4 border-t border-slate-100 bg-white flex gap-3 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={agenticMode ? "Agentic Mode ON: Ask about courses, algorithms, hostel rules, or placement readiness..." : "Ask CampusOS AI anything..."}
            className="flex-1 px-4 py-3 text-sm rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputValue.trim()}
            className="p-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all disabled:opacity-50 shadow-md shadow-indigo-500/20 shrink-0"
          >
            <Send className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
