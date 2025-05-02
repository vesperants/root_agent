'use client';
import React, { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import ChatHeader from "@/components/ChatHeader";
import ChatInputArea from "@/components/ChatInputArea";
// Note: message sending and bot reply handled inside ChatInputArea via callbacks

interface Message {
  sender: 'user' | 'bot';
  text: string;
  id: string;
}

export default function ChatPage() {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  // Local message state and textarea ref (always call hooks in same order)
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Secure access - if not authenticated, redirect to login.
  useEffect(() => {
    if (!loading && (!user || !user.emailVerified)) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Redirect or render during auth state changes
  // Show loader while auth state is initializing
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Loading...</div>
      </div>
    );
  }
  // If not authenticated or email not verified, bail out (redirect will happen in effect)
  if (!user || !user.emailVerified) {
    return null;
  }



  return (
    <div className="flex flex-col min-h-screen bg-white">
      <ChatHeader
        title="Chat"
        onProfileClick={() => { /* Optional: open profile panel */ }}
        onSignOut={async () => {
          await signOut();
        }}
        onEditProfile={() => { /* Optional: navigate to edit profile */ }}
        isShelfOpen={false}
        avatarButtonRef={React.createRef<HTMLButtonElement>()}
      />
      <div className="flex-1 flex flex-col items-center justify-end px-2">
        <div className="w-full max-w-[920px] mx-auto flex flex-col flex-1">
          {/* Chat message list */}
          <div className="flex-1 overflow-y-auto py-4 pb-[100px]">
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
              </div>
            )}
          </div>
          {/* The input area sticks at the bottom */}
          <div className="py-4 mb-[100px]">
            <ChatInputArea
              ref={textareaRef}
              message={message}
              setMessage={setMessage}
              selectedFiles={[]}
              removeSelectedFile={(id: string) => {}}
              handleFileChange={(e: React.ChangeEvent<HTMLInputElement>) => {}}
              placeholder="Type your message..."
              onUserSend={msg =>
                setMessages(prev => [
                  ...prev,
                  { text: msg, sender: 'user', id: Date.now().toString() }
                ])
              }
              onBotReply={reply =>
                setMessages(prev => [
                  ...prev,
                  { text: reply, sender: 'bot', id: Date.now().toString() }
                ])
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}