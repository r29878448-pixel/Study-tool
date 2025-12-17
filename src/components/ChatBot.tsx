
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Sparkles } from './Icons';
import { GoogleGenAI } from "@google/genai";

declare var process: { env: { API_KEY: string } };

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your AI Study Assistant. Ask me anything about your course!' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 100)}px`;
    }
  }, [inputValue]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contents = newMessages.map(msg => ({
         role: msg.role,
         parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: "You are a helpful, encouraging, and knowledgeable tutor for students. Keep answers concise and easy to understand. Use emojis occasionally.",
        },
      });

      const text = response.text;
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "I'm having trouble connecting right now. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-brand to-purple-600 rounded-full shadow-glow flex items-center justify-center text-white z-50 hover:scale-110 transition-transform duration-300 ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white"></span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[90vw] max-w-[380px] h-[550px] max-h-[70vh] bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl z-50 flex flex-col border border-white/50 overflow-hidden animate-fade-in origin-bottom-right ring-1 ring-black/5">
          {/* Header */}
          <div className="bg-gradient-to-r from-brand to-purple-600 p-4 flex justify-between items-center text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
                <Bot className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base">AI Tutor</h3>
                <div className="flex items-center gap-1.5 opacity-90">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <p className="text-[10px] font-medium tracking-wide uppercase">Online</p>
                </div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-gray-50/50 to-white/50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slide-up`}>
                <div 
                  className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-brand text-white rounded-tr-sm' 
                      : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 px-1">
                    {msg.role === 'user' ? 'You' : 'AI'}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm border border-gray-100 flex gap-2 items-center">
                  <div className="w-2 h-2 bg-brand/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-brand/50 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-brand/50 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white/80 backdrop-blur-md border-t border-gray-100">
            <div className="flex gap-2 items-end bg-gray-100/80 p-1.5 rounded-[24px] border border-transparent focus-within:border-brand/30 focus-within:bg-white transition-all focus-within:shadow-md focus-within:shadow-brand/5">
              <textarea 
                ref={textareaRef}
                className="flex-1 bg-transparent px-4 py-3 text-sm focus:outline-none text-gray-800 placeholder:text-gray-400 resize-none no-scrollbar max-h-[100px]"
                placeholder="Ask a question..."
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage();
                   }
                }}
              />
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="p-3 bg-brand text-white rounded-full hover:bg-brand-dark disabled:opacity-50 disabled:hover:bg-brand transition-all hover:scale-105 active:scale-95 shadow-md shadow-brand/20"
              >
                {isLoading ? <Sparkles className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
