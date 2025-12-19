
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from './Icons';
import { GoogleGenAI } from "@google/genai";

declare var process: { env: { API_KEY: string } };

interface Message {
  role: 'user' | 'model';
  text: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am your AI Study Assistant. How can I help you with your lessons today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue;
    const newMessages: Message[] = [...messages, { role: 'user', text: userMessage }];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const contents = newMessages.map(msg => ({
         role: msg.role,
         parts: [{ text: msg.text }]
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: contents,
        config: {
          systemInstruction: "You are a professional educational tutor. Be helpful, clear, and encouraging. Focus on simplifying complex topics for students.",
        },
      });

      const text = response.text;
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sorry, I had trouble processing that. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 w-12 h-12 bg-brand rounded-full shadow-lg flex items-center justify-center text-white z-40 transition-all hover:scale-105 active:scale-95 ${isOpen ? 'scale-0' : 'scale-100'}`}
        aria-label="Open AI Assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-20 md:right-4 md:w-80 md:h-[500px] bg-white z-50 flex flex-col shadow-2xl md:rounded-2xl border border-gray-200 overflow-hidden animate-fade-in">
          <div className="bg-brand p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <span className="font-bold">AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-brand text-white' : 'bg-white text-gray-800 border border-gray-100 shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex gap-1 items-center">
                  <div className="w-1.5 h-1.5 bg-brand/50 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-brand/50 rounded-full animate-bounce delay-100"></div>
                  <div className="w-1.5 h-1.5 bg-brand/50 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input 
                className="flex-1 bg-gray-100 px-4 py-2 text-sm rounded-xl focus:outline-none focus:bg-white border border-transparent focus:border-brand transition-all"
                placeholder="Ask me anything..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              />
              <button 
                onClick={handleSendMessage} 
                disabled={isLoading || !inputValue.trim()} 
                className="p-2 bg-brand text-white rounded-xl disabled:opacity-50 hover:bg-brand-dark transition-colors"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
