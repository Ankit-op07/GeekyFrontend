// components/ai-chatbot.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, Loader2, Sparkles } from "lucide-react";

interface Message {
  id: number;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Hi there! I'm your AI assistant for Geeky Frontend. I can help answer questions about our interview prep kits, curriculum, pricing, and more!",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced response system with your website content
  const getAIResponse = async (userInput: string): Promise<string> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerInput = userInput.toLowerCase();
    
    // JavaScript Kit questions
    if (lowerInput.includes("javascript") || lowerInput.includes("js")) {
      if (lowerInput.includes("content") || lowerInput.includes("include") || lowerInput.includes("what")) {
        return "Our JavaScript Kit includes 500+ questions covering closures, async/await, prototypes, ES6+ features, module systems, and more. It's perfect for mastering JS fundamentals for interviews at just ₹49.";
      }
      if (lowerInput.includes("price") || lowerInput.includes("cost")) {
        return "The JavaScript Interview Kit is available for just ₹49 (50% off the original ₹99). It's a one-time payment with lifetime access and updates.";
      }
      return "Our JavaScript Kit focuses on deep JS concepts that are frequently asked in interviews. It includes company-specific question patterns and quick revision sheets.";
    }
    
    // Complete Frontend Kit questions
    if (lowerInput.includes("complete") || lowerInput.includes("frontend") || lowerInput.includes("react")) {
      if (lowerInput.includes("content") || lowerInput.includes("include")) {
        return "The Complete Frontend Kit includes everything from the JS Kit plus React patterns, hooks, state management, HTML/CSS, performance optimization, DSA in JavaScript, machine coding, and system design. All for just ₹149.";
      }
      if (lowerInput.includes("price") || lowerInput.includes("cost")) {
        return "The Complete Frontend Kit is available for ₹149 (50% off the original ₹299). It's our most popular option with comprehensive coverage.";
      }
      if (lowerInput.includes("difference") || lowerInput.includes("vs") || lowerInput.includes("compare")) {
        return "The Complete Frontend Kit includes everything in the JS Kit plus React, DSA, machine coding, and system design. The JS Kit focuses only on JavaScript fundamentals.";
      }
      return "Our Complete Frontend Kit is the most comprehensive package, covering all aspects of frontend interviews. It's designed to prepare you for any frontend role.";
    }
    
    // Interview Experiences questions
    if (lowerInput.includes("experience") || lowerInput.includes("company") || lowerInput.includes("faang")) {
      if (lowerInput.includes("content") || lowerInput.includes("include")) {
        return "The Interview Experiences pack includes 30+ real interview experiences, company patterns, round-wise breakdowns, negotiation tips, and common pitfalls. It's available for ₹399.";
      }
      if (lowerInput.includes("price") || lowerInput.includes("cost")) {
        return "The Interview Experiences pack is available for ₹399. It provides insider knowledge from engineers who've cracked top company interviews.";
      }
      return "Our Interview Experiences pack gives you real insights from engineers who've been through the interview process at companies like Google, Amazon, Microsoft, and many startups.";
    }
    
    // Curriculum questions
    if (lowerInput.includes("curriculum") || lowerInput.includes("syllabus") || lowerInput.includes("content")) {
      return "Our 8-week curriculum covers: Week 1-2: JavaScript, Week 3-4: React, Week 5: HTML/CSS, Week 6: Performance, Week 7: Machine Coding, Week 8: DSA. Each section has detailed roadmaps and company-specific question banks.";
    }
    
    // Pricing questions
    if (lowerInput.includes("price") || lowerInput.includes("cost") || lowerInput.includes("how much")) {
      return "We have three options: JavaScript Interview Kit (₹49), Complete Frontend Kit (₹149), and Interview Experiences (₹399). All come with a 50% limited-time discount and lifetime access!";
    }
    
    // Access questions
    if (lowerInput.includes("access") || lowerInput.includes("get") || lowerInput.includes("download")) {
      return "After payment, you'll receive instant download links with lifetime access to all materials, including future updates. You can access them anytime, anywhere.";
    }
    
    // General questions
    if (lowerInput.includes("hi") || lowerInput.includes("hello") || lowerInput.includes("hey")) {
      return "Hello! I'm here to help you with any questions about our interview preparation materials. What would you like to know?";
    }
    
    if (lowerInput.includes("help") || lowerInput.includes("support")) {
      return "I can help you with information about our courses, pricing, curriculum, and more. You can also contact us directly on Instagram @geeky_frontend for personalized support.";
    }
    
    // Default response
    return "I'm here to help with questions about our interview prep materials. You can ask about pricing, curriculum, content access, or specific topics like JavaScript or React. What would you like to know?";
  };

  const handleSendMessage = async () => {
    if (inputText.trim() === "" || isLoading) return;

    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages([...messages, userMessage]);
    setInputText("");
    setIsLoading(true);

    try {
      // Get AI response
      const botResponse = await getAIResponse(inputText);
      
      const botMessage: Message = {
        id: messages.length + 2,
        text: botResponse,
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Error generating response:", error);
      
      const errorMessage: Message = {
        id: messages.length + 2,
        text: "Sorry, I'm having trouble right now. Please try again in a moment or contact us on Instagram @geeky_frontend.",
        sender: "bot",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const suggestedQuestions = [
    "What's in the JavaScript Kit?",
    "Tell me about the Complete Frontend Kit",
    "How much does it cost?",
    "What's the curriculum structure?",
  ];

  return (
    <>
      {/* Chatbot toggle button - matches your design */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all"
        aria-label="Open chat"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageCircle size={24} />
            <Sparkles size={12} className="absolute -top-1 -right-1 text-secondary" />
          </div>
        )}
      </button>

      {/* Chatbot container - matches your design system */}
      {isOpen && (
        <div className="fixed bottom-24 right-2 left-2 sm:right-6 sm:left-auto sm:w-96 z-40 h-96 bg-card border border-border rounded-xl shadow-xl flex flex-col">
          {/* Header - matches your primary color */}
          <div className="p-4 border-b bg-primary text-primary-foreground rounded-t-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1 bg-primary-foreground/20 rounded-full">
                <Bot size={16} />
              </div>
              <h3 className="font-semibold">Geeky Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-primary-foreground/20"
              aria-label="Close chat"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    message.sender === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-3 bg-muted">
                  <div className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-primary" />
                    <p className="text-sm">Thinking...</p>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested questions */}
          {messages.length <= 1 && (
            <div className="px-4 pb-2">
              <p className="text-xs text-muted-foreground mb-2">Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setInputText(question);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                    className="text-xs bg-secondary/10 text-secondary-foreground px-2 py-1 rounded-md hover:bg-secondary/20 transition-colors"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input area */}
          <div className="p-3 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your question..."
                className="flex-1 text-sm py-2 px-3 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || inputText.trim() === ""}
                className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}