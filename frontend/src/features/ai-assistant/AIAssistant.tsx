import { useState } from 'react'
import { Send, Sparkles, HelpCircle } from 'lucide-react'
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
      text: 'Hi John! I am your CampusOS Academic Assistant. You can ask me to explain concepts, suggest electives, draft study plans, or query campus rules (RAG). How can I assist you?',
      timestamp: '16:00',
    },
  ])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSend = async () => {
    const query = inputValue.trim()
    if (!query || isLoading) return

    const userMsg: Message = {
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
    setMessages((prev) => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)

    try {
      const res = await chatWithAgent(query)
      const botMsg: Message = {
        sender: 'assistant',
        text: res.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, botMsg])
    } catch (err) {
      const errorMsg: Message = {
        sender: 'assistant',
        text: 'I ran into an issue communicating with the CampusOS agents. Please ensure the backend server is running.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }


  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] animate-fade-in space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" /> AI Academic Assistant
          </h1>
          <p className="text-xs text-slate-400">Powered by LangGraph, OpenAI GPT & RAG Search</p>
        </div>
      </div>

      {/* Main chat window */}
      <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col">
        {/* Messages list */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[70%] p-4 rounded-xl text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white rounded-br-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <p>{msg.text}</p>
                <span className="text-[10px] text-slate-500 block text-right mt-1.5">{msg.timestamp}</span>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 text-slate-400 p-4 rounded-xl rounded-bl-none text-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          )}

        </div>

        {/* Suggested Queries */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Suggestions:
          </span>
          <button
            onClick={() => setInputValue("What are the hostel late entry rules?")}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-full px-3 py-1 transition-colors"
          >
            "Hostel late entry rules?"
          </button>
          <button
            onClick={() => setInputValue("Explain Dijkstra's Algorithm step by step.")}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-full px-3 py-1 transition-colors"
          >
            "Explain Dijkstra's Algorithm"
          </button>
        </div>

        {/* Input box */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type your question or RAG query..."
            className="flex-1 px-4 py-2.5 rounded-lg border border-slate-800 bg-slate-900 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleSend}
            className="px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
