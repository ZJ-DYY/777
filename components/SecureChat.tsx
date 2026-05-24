
import React, { useState, useRef, useEffect } from 'react';
import { Send, ShieldCheck, Lock, User, Stethoscope, X, MessageSquare, ChevronRight, Minimize2 } from 'lucide-react';
import { Message, UserRole } from '../types';
import { clsx } from 'clsx';

interface SecureChatProps {
  messages: Message[];
  currentUserRole: UserRole;
  currentUserName?: string;
  onSendMessage: (text: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const SecureChat: React.FC<SecureChatProps> = ({ messages, currentUserRole, currentUserName, onSendMessage, isOpen, onToggle }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
        scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
        {/* Toggle Button (Visible when closed) */}
        {!isOpen && (
             <button 
             onClick={onToggle}
             className="fixed bottom-1/2 right-0 translate-y-1/2 bg-indigo-600 rounded-l-2xl shadow-2xl p-4 flex flex-col items-center justify-center hover:bg-indigo-700 transition-all z-50 group w-12 h-32"
           >
               <MessageSquare className="w-6 h-6 text-white mb-2" />
               <div className="text-[10px] text-white font-bold tracking-widest uppercase writing-vertical-lr" style={{writingMode: 'vertical-rl'}}>
                   医患沟通
               </div>
               {/* Red Dot */}
               <div className="absolute top-3 right-3 w-3 h-3 bg-red-500 rounded-full border-2 border-indigo-600" />
           </button>
        )}

        {/* Chat Drawer */}
        <div className={clsx(
            "fixed top-0 right-0 h-full w-[400px] bg-white shadow-2xl z-50 transition-transform duration-300 ease-in-out border-l border-slate-200 flex flex-col",
            isOpen ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        {currentUserRole === UserRole.PATIENT ? <Stethoscope className="w-5 h-5 text-indigo-600" /> : <User className="w-5 h-5 text-indigo-600" />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800">{currentUserRole === UserRole.PATIENT ? '主治医生团队' : currentUserName}</h3>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 在线
                        </p>
                    </div>
                </div>
                <button onClick={onToggle} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50">
                <div className="text-center my-4">
                    <span className="text-xs text-slate-400 bg-slate-200/50 px-3 py-1 rounded-full">
                        LungCare 安全加密连接
                    </span>
                </div>
                
                {(messages || []).map((msg) => {
                    const isMe = (currentUserRole === UserRole.PATIENT && msg.sender === 'PATIENT') ||
                                 (currentUserRole === UserRole.DOCTOR && msg.sender === 'DOCTOR');

                    return (
                        <div key={msg.id} className={clsx("flex gap-3", isMe ? "justify-end" : "justify-start")}>
                            {!isMe && (
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                                    {msg.sender === 'DOCTOR' ? <Stethoscope className="w-4 h-4 text-slate-600" /> : <User className="w-4 h-4 text-slate-600" />}
                                </div>
                            )}
                            
                            <div className={clsx(
                                "max-w-[75%] p-3.5 rounded-2xl text-sm shadow-sm leading-relaxed",
                                isMe 
                                    ? "bg-indigo-600 text-white rounded-tr-none" 
                                    : "bg-white text-slate-700 border border-slate-200 rounded-tl-none"
                            )}>
                                <p>{msg.content}</p>
                                <div className={clsx("text-[10px] mt-1 text-right", isMe ? "text-indigo-200" : "text-slate-400")}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-100 bg-white">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="输入消息..."
                        className="flex-1 pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                    />
                    <button 
                        onClick={handleSend}
                        disabled={!newMessage.trim()}
                        className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-lg shadow-indigo-100"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    </>
  );
};

export default SecureChat;
