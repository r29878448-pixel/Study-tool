
import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, Mic, Image as ImageIcon } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

declare var process: { env: { API_KEY: string } };

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string;
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Namaste student! Main hoon aapka AI Teacher. Padhai mein main aapki kaise madad kar sakta hoon?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Max height 150px
    }
  }, [inputValue]);

  // Voice Input Logic
  const startListening = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN'; // Changed to Indian English/Hindi context
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        alert('Voice input failed. Please check microphone permissions.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      alert('Voice recognition is not supported in this browser.');
    }
  };

  // Image Input Logic
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !selectedImage) return;

    const userMessage = inputValue;
    const currentImage = selectedImage;

    // Optimistically add user message
    const updatedMessages: Message[] = [...messages, { role: 'user', text: userMessage, image: currentImage || undefined }];
    setMessages(updatedMessages);
    
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);
    
    // Reset height
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const contents = updatedMessages.map(msg => {
          const parts: any[] = [{ text: msg.text }];
          if (msg.image) {
             const base64Data = msg.image.split(',')[1];
             const mimeType = msg.image.split(';')[0].split(':')[1];
             parts.push({
                inlineData: { mimeType, data: base64Data }
             });
          }
          return {
             role: msg.role,
             parts: parts
          };
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: {
          systemInstruction: "You are an expert school teacher named 'AI Teacher'. Your goal is to help students learn effectively. \n\n**IMPORTANT RULES:**\n1. **Language:** You must strictly answer in **Hinglish** (a mix of Hindi and English) by default. Example: 'Haan, main samajha sakta hoon. Is concept ko aise samjho...'\n2. **No Unnecessary Code:** Do not use markdown code blocks (```) or write programming code unless the student EXPLICITLY asks for a coding solution (like 'Write a Java program'). For normal questions, just use text.\n3. **Tone:** Speak naturally, kindly, and professionally. Do not sound like a robot.\n4. **Teaching Style:** Use real-world analogies suitable for Indian students. Guide them to the answer conceptually before giving the solution.\n5. **Subjects:** Help with Math, Science, English, and Social Studies.",
        },
      });

      const text = response.text;
      if (text) {
        setMessages(prev => [...prev, { role: 'model', text: text }]);
      }
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Maaf kijiye, main abhi server se connect nahi kar pa raha hoon. Kripya apna internet check karein." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-20 right-4 w-14 h-14 bg-brand rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:scale-105 transition-transform ${isOpen ? 'hidden' : 'flex'}`}
      >
        <MessageCircle className="w-8 h-8" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 w-full max-w-sm h-[500px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col border border-gray-200 overflow-hidden animate-fade-in mx-4 md:mx-0">
          {/* Header */}
          <div className="bg-brand p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">AI Teacher</h3>
                <p className="text-[10px] opacity-80">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                {msg.image && (
                   <div className="mb-2 p-1 bg-white border rounded-lg max-w-[80%]">
                     <img src={msg.image} alt="Uploaded" className="max-h-40 rounded-lg" />
                   </div>
                )}
                {msg.text && (
                  <div 
                    className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                      msg.role === 'user' 
                        ? 'bg-brand text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-gray-100">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t p-2">
            
            {/* Image Preview */}
            {selectedImage && (
              <div className="flex items-center gap-2 p-2 mb-2 bg-gray-50 rounded-lg border border-gray-100 relative">
                <img src={selectedImage} alt="Preview" className="h-12 w-12 object-cover rounded" />
                <span className="text-xs text-gray-500">Image selected</span>
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute top-1 right-1 bg-gray-200 rounded-full p-0.5"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>
              </div>
            )}

            <div className="flex gap-2 items-end">
              {/* Image Button */}
              <input 
                type="file" 
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImageSelect}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors mb-0.5"
                title="Upload Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>

              {/* Text Input */}
              <textarea 
                ref={textareaRef}
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/50 text-gray-900 placeholder:text-gray-500 resize-none no-scrollbar overflow-hidden"
                placeholder="Ask in Hinglish..."
                rows={1}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                   if(e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleSendMessage();
                   }
                }}
                style={{ minHeight: '44px' }}
              />

              {/* Voice Button */}
              <button 
                onClick={startListening}
                className={`p-2.5 rounded-full transition-colors mb-0.5 ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                title="Voice Input"
              >
                <Mic className="w-5 h-5" />
              </button>

              {/* Send Button */}
              <button 
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && !selectedImage)}
                className="p-2.5 bg-brand text-white rounded-full hover:bg-brand-dark disabled:opacity-50 transition-colors mb-0.5"
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
