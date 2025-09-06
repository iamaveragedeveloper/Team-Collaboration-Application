'use client';

import React, { useState, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient'; // Corrected import path
import type { Project } from '../types';

// Type definitions for clarity
interface Message {
  id: string;
  project_id: string;
  author: string;
  content: string;
  created_at: string;
  profiles?: {
    name?: string;
    email?: string;
  };
}

interface User {
  id: string;
  email?: string;
}

interface Profile {
  name?: string;
  email?: string;
}

interface ChatBoxProps {
  project: Project;
  user: User;
  profile: Profile | null;
  messages: Message[];
  loading: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function ChatBox({ project, user, profile, messages, loading, setMessages }: ChatBoxProps) {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Automatically scroll to the latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const content = newMessage.trim();
    if (!content) return;

    // A temporary ID for the optimistic message
    const tempId = crypto.randomUUID();

    // 1. Optimistic Update: Immediately add the message to the UI.
    const optimisticMessage: Message = {
      id: tempId,
      project_id: project.id,
      author: user.id,
      content: content,
      created_at: new Date().toISOString(),
      profiles: { // Use the current user's profile info
        name: profile?.name,
        email: profile?.email,
      },
    };
    setMessages(currentMessages => [...currentMessages, optimisticMessage]);

    // Reset the input field right away
    setNewMessage('');
    setIsSending(true);

    // 2. Send the message to the database in the background.
    const { error } = await supabase
      .from('messages')
      .insert({ 
        project_id: project.id, 
        author: user.id, 
        content: content 
      });
    
    setIsSending(false);

    // 3. If the database insert fails, roll back the optimistic update.
    if (error) {
      alert('Error sending message: ' + error.message);
      // Remove the message that failed to send
      setMessages(currentMessages => currentMessages.filter(m => m.id !== tempId));
      // Restore the user's typed message so they can try again
      setNewMessage(content); 
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const getInitials = (name?: string, email?: string) => {
    if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    if (email) return email[0].toUpperCase();
    return '?';
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-4xl mx-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Messages Display Area */}
      <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
        {loading && (
          <div className="text-center text-gray-500">Loading messages...</div>
        )}
        {!loading && messages.length === 0 && (
          <div className="text-center text-gray-500 pt-16">
            <h3 className="text-lg font-semibold">No messages yet</h3>
            <p>Be the first to start the conversation!</p>
          </div>
        )}
        
        <div className="space-y-6">
          {messages.map((msg) => {
            const isCurrentUser = msg.author === user.id;
            const userName = msg.profiles?.name || msg.profiles?.email || 'Unknown User';
            
            return (
              <div key={msg.id} className={`flex items-start gap-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                {/* Avatar for other users */}
                {!isCurrentUser && (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 flex-shrink-0">
                    {getInitials(msg.profiles?.name, msg.profiles?.email)}
                  </div>
                )}
                
                {/* Message Bubble */}
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                  <div className={`px-4 py-2 rounded-lg max-w-md ${isCurrentUser ? 'bg-primary-600 text-white rounded-br-none' : 'bg-white border rounded-bl-none'}`}>
                    {!isCurrentUser && (
                      <p className="text-xs font-bold text-primary-700 mb-1">{userName}</p>
                    )}
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <form onSubmit={handleSubmit} className="flex space-x-3">
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 transition-shadow"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            maxLength={1000}
          />
          <button
            type="submit"
            className="px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            disabled={isSending || !newMessage.trim()}
          >
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
}

