//src/app/chat/page.tsx

'use client';
import ChatHeader from "@/components/ChatHeader";
import ChatInputArea from "@/components/ChatInputArea";
import React, { useRef, useState } from "react";
import { getAgentReply } from "@/services/agent";
import SearchChatWidget from '../../components/SearchChatWidget';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  id: string;
  cases?: string[];
}

export default function Home() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isBotReplying, setIsBotReplying] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Send message and receive Gemini bot reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedMsg = message.trim();
    if (!trimmedMsg) return;

    // Add user's message
    setMessages(prev => [
      ...prev,
      { text: trimmedMsg, sender: 'user', id: Date.now() + Math.random().toString() }
    ]);
    setMessage('');
    if (textareaRef.current) textareaRef.current.blur();

    setIsBotReplying(true);
    try {
      const botReply = await getAgentReply(trimmedMsg);
      setMessages(prev => [
        ...prev,
        { text: botReply, sender: 'bot', id: Date.now() + Math.random().toString() }
      ]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { text: "Agent error: Could not get reply.", sender: 'bot', id: Date.now() + Math.random().toString() }
      ]);
    } finally {
      setIsBotReplying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ChatHeader
        title="Chat"
        onProfileClick={() => {}}
        onToggleShelfClick={() => {}}
        isShelfOpen={false}
        avatarButtonRef={React.createRef<HTMLButtonElement>()}
      />
      <div className="flex-1 flex flex-col items-center justify-end px-2">
        <div className="w-full max-w-xl mx-auto flex flex-col flex-1">
          {/* Chat message list*/}
          <div className="flex-1 overflow-y-auto py-4">
            {messages.map(m =>
              <div
                key={m.id}
                className={`mb-2 flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <span className={`inline-block rounded-lg px-4 py-2 ${
                  m.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-900'
                }`}>
                  {m.text}
                </span>
                {/* If this is a bot message with cases, show the widget below */}
                {m.sender === 'bot' && m.cases && m.cases.length > 0 && (
                  <div style={{ width: '100%' }}>
                    <SearchChatWidget results={m.cases} />
                  </div>
                )}
              </div>
            )}
          </div>
          {/* The input area sticks at the bottom */}
          <div className="py-4 mb-[100px]">
            <ChatInputArea
              ref={textareaRef}
              message={message}
              setMessage={setMessage}
              isBotReplying={isBotReplying}
              placeholder="Type your message..."
              handleSendMessage={handleSendMessage}
              handleStopGenerating={() => setIsBotReplying(false)}
              handleKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                // Send message on Enter (without Shift)
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e as any);
                }
              }}
              handleFileChange={() => {}}
              removeSelectedFile={() => {}}
              selectedFiles={[]}
            />
          </div>
        </div>
      </div>
    </div>
  );
}