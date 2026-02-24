import React, { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useDraft } from '../hooks/use-draft';
import { useRealtime } from '../hooks/use-realtime';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';

interface Message {
  id: string;
  body: string;
  subject?: string;
  direction: 'inbound' | 'outbound';
  provider: string;
  createdAt: string;
  openedAt?: string;
  clickedAt?: string;
  trackingId?: string;
}

interface ConversationThreadProps {
  leadId: string;
  leadEmail?: string;
  leadName?: string;
}

export function ConversationThread({ leadId, leadEmail, leadName }: ConversationThreadProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const draft = useDraft({ leadId, autoSave: true, autoSaveDelay: 500 });
  const { subscribe } = useRealtime();

  // Fetch messages
  const { data: messageData, mutate: refetchMessages } = useSWR(
    `/api/messages/${leadId}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    }
  );

  // Update messages from data
  useEffect(() => {
    if (messageData?.messages) {
      setMessages(messageData.messages);
    }
  }, [messageData]);

  // Subscribe to real-time message updates
  useEffect(() => {
    const unsubscribe = subscribe('messages_updated', (payload: any) => {
      console.log('[v0] Real-time message update:', payload);
      
      if (payload.action === 'INSERT' && payload.message?.leadId === leadId) {
        // New message received - add to thread
        setMessages(prev => [...prev, payload.message]);
        // Auto-scroll to new message
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 0);
      } else if (payload.action === 'UPDATE' && payload.message?.leadId === leadId) {
        // Message updated (e.g., opened status)
        setMessages(prev => 
          prev.map(m => m.id === payload.message.id ? payload.message : m)
        );
      }
    });

    return unsubscribe;
  }, [leadId, subscribe]);

  // Auto-scroll to bottom on new messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Send message
  const handleSendMessage = async () => {
    if (!draft.content.trim()) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/messages/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: draft.content,
          subject: draft.subject,
          channel: draft.channel
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to send message');
      }

      const result = await res.json();
      console.log('[v0] Message sent:', result);

      // Clear draft after successful send
      await draft.deleteDraft();
      
      // Refresh messages
      await refetchMessages();
    } catch (error) {
      console.error('[v0] Send message error:', error);
      alert(`Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Format timestamp
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) return 'Today';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
  };

  // Group messages by date
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach(msg => {
    const dateKey = formatDate(msg.createdAt);
    if (!groupedMessages[dateKey]) {
      groupedMessages[dateKey] = [];
    }
    groupedMessages[dateKey].push(msg);
  });

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Thread Header */}
      <div className="border-b p-4 bg-card">
        <h2 className="text-lg font-semibold">{leadName || leadEmail || 'Unknown'}</h2>
        <p className="text-sm text-muted-foreground">{leadEmail}</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {Object.entries(groupedMessages).map(([dateKey, dateMessages]) => (
          <div key={dateKey}>
            <div className="flex items-center justify-center mb-4">
              <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                {dateKey}
              </div>
            </div>

            <div className="space-y-3">
              {dateMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-sm p-3 ${
                      msg.direction === 'outbound'
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-muted text-foreground rounded-bl-none'
                    }`}
                  >
                    {msg.subject && (
                      <p className="text-xs font-semibold mb-1 opacity-90">{msg.subject}</p>
                    )}
                    <p className="text-sm break-words">{msg.body}</p>
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <p className="text-xs opacity-70">
                        {formatTime(msg.createdAt)}
                      </p>
                      {msg.direction === 'outbound' && (
                        <div className="flex items-center gap-1 text-xs">
                          {msg.openedAt && (
                            <span title={`Opened: ${new Date(msg.openedAt).toLocaleString()}`}>
                              👁️ Read
                            </span>
                          )}
                          {msg.clickedAt && (
                            <span title={`Clicked: ${new Date(msg.clickedAt).toLocaleString()}`}>
                              🔗
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Compose Area */}
      <div className="border-t p-4 bg-card space-y-2">
        {draft.subject && draft.channel === 'email' && (
          <Input
            value={draft.subject}
            onChange={(e) => draft.setSubject(e.target.value)}
            placeholder="Subject line..."
            className="text-sm"
          />
        )}

        <textarea
          value={draft.content}
          onChange={(e) => draft.setContent(e.target.value)}
          placeholder={draft.isDraft ? 'Continue draft...' : 'Type your message...'}
          className="w-full h-24 p-3 border rounded-lg bg-background text-foreground placeholder-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={isSending}
        />

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <select
              value={draft.channel}
              onChange={(e) => draft.setChannel(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-background text-sm"
              disabled={isSending}
            >
              <option value="email">Email</option>
              <option value="instagram">Instagram</option>
            </select>
            {draft.isDraft && (
              <span className="text-xs text-muted-foreground self-center">Draft saved</span>
            )}
          </div>

          <Button
            onClick={handleSendMessage}
            disabled={isSending || !draft.content.trim()}
            className="min-w-24"
          >
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </div>
    </div>
  );
}
