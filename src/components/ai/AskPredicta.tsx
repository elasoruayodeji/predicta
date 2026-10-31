// ============================================================
// Ask PREDICTA - AI Research Assistant
// ============================================================
import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../common';
import { 
  Send, Bot, User, Loader2, AlertCircle, Sparkles, 
  TrendingUp, FileText, Target, Zap
} from 'lucide-react';

interface AskPredictaProps {
  onNavigate: (page: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export function AskPredicta({ onNavigate }: AskPredictaProps) {
  const { user, isConfigured } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history from localStorage
  useEffect(() => {
    if (user) {
      const saved = localStorage.getItem(`predicta_chat_${user.id}`);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    }
  }, [user]);

  // Save conversation history
  const saveMessages = (newMessages: Message[]) => {
    if (user) {
      localStorage.setItem(`predicta_chat_${user.id}`, JSON.stringify(newMessages));
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    saveMessages(newMessages);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Call AI backend (placeholder - would integrate with actual AI service)
      const response = await callAI(userMessage.content);
      
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date().toISOString(),
        sources: response.sources,
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveMessages(updatedMessages);
    } catch (err: any) {
      setError(err.message || 'Failed to get response from AI');
    } finally {
      setIsLoading(false);
    }
  };

  // Placeholder AI call - would integrate with actual AI service
  const callAI = async (query: string): Promise<{ content: string; sources?: string[] }> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if AI is configured
    const aiConfigured = false; // Would check for AI API key

    if (!aiConfigured) {
      return {
        content: `**AI Research Assistant Not Configured**

To enable the AI research assistant, you need to configure an AI provider API key in your environment variables.

**Example queries you could ask:**
- "What is the P/E ratio of DANGCEM?"
- "Compare GTCO and ZENITHBANK"
- "What is the dividend yield of MTNN?"
- "Analyse the technical indicators for ACCESSCORP"
- "What are the risks of investing in banking sector?"

**Current capabilities without AI:**
- Use the Stock Research pages for individual stock analysis
- Use the Valuation Workbench for DCF and multiples analysis
- Use the Stock Screener to filter stocks by criteria
- Use Market Signals for unusual activity detection

The AI assistant will provide intelligent analysis, comparisons, and research insights once configured.`,
        sources: [],
      };
    }

    // This would be replaced with actual AI API call
    return {
      content: 'AI response would appear here when configured.',
      sources: [],
    };
  };

  const handleClearChat = () => {
    if (confirm('Clear all messages? This cannot be undone.')) {
      setMessages([]);
      if (user) {
        localStorage.removeItem(`predicta_chat_${user.id}`);
      }
    }
  };

  const suggestedQueries = [
    { icon: TrendingUp, text: 'What is the P/E ratio of DANGCEM?', category: 'Fundamentals' },
    { icon: Target, text: 'Compare GTCO and ZENITHBANK', category: 'Comparison' },
    { icon: FileText, text: 'Analyse the technical indicators for ACCESSCORP', category: 'Technical' },
    { icon: Zap, text: 'What are the risks of investing in banking sector?', category: 'Research' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">Ask PREDICTA</h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            AI-powered research assistant for Nigerian market intelligence
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearChat}>
            Clear Chat
          </Button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4 mb-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-[var(--color-accent-blue-glow)] flex items-center justify-center mb-4">
              <Sparkles size={32} className="text-[var(--color-accent-blue)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Welcome to Ask PREDICTA
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 max-w-md">
              Your AI-powered research assistant for Nigerian market intelligence. Ask questions about stocks, 
              get comparisons, analyse fundamentals, and receive research insights.
            </p>

            {/* Suggested Queries */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
              {suggestedQueries.map((query, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(query.text)}
                  className="flex items-start gap-3 p-3 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg hover:border-[var(--color-accent-blue)]/30 transition-colors text-left"
                >
                  <query.icon size={16} className="text-[var(--color-accent-blue)] mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">{query.category}</p>
                    <p className="text-sm text-[var(--color-text-primary)]">{query.text}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue-glow)] flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-[var(--color-accent-blue)]" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-xl p-4 ${
                    message.role === 'user'
                      ? 'bg-[var(--color-accent-blue)] text-white'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)]'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[var(--color-border-primary)]">
                      <p className="text-xs font-semibold text-[var(--color-text-muted)] mb-1">Sources:</p>
                      <ul className="text-xs text-[var(--color-text-secondary)] space-y-1">
                        {message.sources.map((source, idx) => (
                          <li key={idx}>• {source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="mt-2 text-[10px] opacity-60">
                    {new Date(message.timestamp).toLocaleString()}
                  </div>
                </div>
                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-[var(--color-bg-tertiary)] flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[var(--color-accent-blue-glow)] flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-[var(--color-accent-blue)]" />
                </div>
                <div className="bg-[var(--color-bg-tertiary)] rounded-xl p-4">
                  <Loader2 size={16} className="animate-spin text-[var(--color-accent-blue)]" />
                </div>
              </div>
            )}
            {error && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-[var(--color-negative-dim)] flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={16} className="text-[var(--color-negative)]" />
                </div>
                <div className="bg-[var(--color-negative-dim)] border border-[var(--color-negative)]/20 rounded-xl p-4 max-w-[80%]">
                  <p className="text-sm text-[var(--color-negative)]">{error}</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask about stocks, fundamentals, technicals, or market analysis..."
            className="flex-1 px-4 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-accent-blue)]/50"
            disabled={isLoading}
          />
          <Button
            variant="primary"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Send size={16} />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
          Press Enter to send. AI responses are based on available data and may not be fully accurate. 
          Always verify important information from official sources.
        </p>
      </div>
    </div>
  );
}
