import { useState } from 'react'
import { Send, Sparkles, HelpCircle, Bot, User } from 'lucide-react'
import { chatWithAgent } from '../../services/api'

interface Message {
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: 'Hi John! I am your CampusOS Academic & Success Agent. You can ask me to explain algorithms, recommend electives, draft personalized study plans, analyze placement probability, or query campus rulebooks. How can I help you today?',
      timestamp: '16:00',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const suggestedQueries = [
    'Explain Dijkstra algorithm in simple terms',
    'Calculate my placement readiness score',
    'Generate practice quiz for Automata Theory',
    'What are the campus hostel curfew rules?',
  ]

  const handleSend = async (customQuery?: string) => {
    const query = (customQuery || inputValue).trim()
    if (!query || isLoading) return

    const userMsg: Message = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    if (!customQuery) setInputValue('')
    setIsLoading(true)

    try {
      const res = await chatWithAgent(query)
      const botMsg: Message = {
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch {
      const errorMsg: Message = {
        sender: 'assistant',
        text: 'I ran into an issue communicating with the CampusOS agents. Please verify the backend server is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] animate-fade-in space-y-4 font-sans">
      <div className="flex items-center justify-between">
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
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 bg-white rounded-[24px] border border-slate-100 shadow-sm shadow-slate-200/50 flex flex-col overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-9 h-9 rounded-2xl flex items-center justify-center text-xs font-bold shrink-0 shadow-xs ${
                msg.sender === 'user'
                  ? 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white'
                  : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
              }`}>
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4.5 h-4.5" />}
              </div>

              <div
                className={`max-w-[75%] p-4 rounded-[20px] text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-xs shadow-sm'
                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-xs'
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.text}</p>
                <span className={`text-[10px] block text-right mt-2 ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
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

        {/* Suggested Queries */}
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

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-white flex gap-3 items-center">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask CampusOS AI anything about courses, placements, attendance, or hostel rules..."
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
