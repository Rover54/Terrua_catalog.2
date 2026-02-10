
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Product, ChatMessage } from '../types';

interface ChatBotProps {
  products: Product[];
}

export const ChatBot: React.FC<ChatBotProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      const systemInstruction = `
        You are the "Terrua Concierge", a sophisticated shopping assistant for Terrua Store.
        Your tone is professional, helpful, and premium.
        
        You have access to the following product catalog:
        ${JSON.stringify(products.map(p => ({
          name: p.name,
          code: p.productCode,
          category: p.category,
          price: p.price,
          description: p.description,
          tags: p.tags
        })))}
        
        Rules:
        1. Always suggest products from the catalog that match the user's needs.
        2. If a user asks for recommendations, analyze the descriptions and prices to find the best fit.
        3. If you suggest a product, mention its name and why it fits.
        4. If the user asks about something not in the catalog, politely guide them to what is available.
        5. Keep responses concise but elegant.
      `;

      const chat = ai.chats.create({
        model: 'gemini-3-pro-preview',
        config: {
          systemInstruction,
        }
      });

      // We send the current history minus the last message to keep context
      // and then the actual message
      const response = await chat.sendMessage({
        message: input
      });

      const modelText = response.text || "I'm sorry, I couldn't process that. How else can I assist you with our catalog?";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm experiencing a technical hiccup. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-end">
      {isOpen && (
        <div className="mb-4 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-[2rem] shadow-2xl flex flex-col border border-[#E7E5E4] overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-6 bg-[#064e3b] text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-sm">Terrua Concierge</h3>
                <p className="text-[10px] opacity-70 uppercase tracking-widest font-black">AI Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-lg transition">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9F8F6] no-scrollbar">
            {messages.length === 0 && (
              <div className="text-center py-10">
                <p className="text-[#064e3b] font-bold text-lg mb-2">Welcome to Terrua</p>
                <p className="text-gray-500 text-xs px-10">How can I assist your shopping journey today? Ask me about our latest inventory.</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                  ? 'bg-[#E7E5E4] text-[#44403c] rounded-tr-none' 
                  : 'bg-[#064e3b] text-white rounded-tl-none shadow-md'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-[#064e3b] text-white px-4 py-3 rounded-2xl rounded-tl-none shadow-md flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 bg-white border-t border-[#E7E5E4] flex gap-2">
            <input 
              type="text" 
              placeholder="Type your question..."
              className="flex-1 bg-[#F5F5F4] border-transparent focus:ring-1 focus:ring-[#064e3b] rounded-xl px-4 py-2 text-sm text-[#064e3b]"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isTyping || !input.trim()}
              className="w-10 h-10 bg-[#064e3b] text-white rounded-xl flex items-center justify-center hover:opacity-90 transition disabled:opacity-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-[#064e3b] text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border-4 border-white"
      >
        <span className="material-icons text-3xl">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
          </svg>
        </span>
        {/* Tooltip */}
        {!isOpen && (
          <div className="absolute right-20 bg-[#064e3b] text-white px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            Chat with Terrua AI
          </div>
        )}
      </button>
    </div>
  );
};
