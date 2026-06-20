import React, { useState, useEffect } from 'react';
import { sendDirectMessage, subscribeToDirectMessages } from '../firebase';
import { ICONS } from './icons';

interface ChatPanelProps {
  currentUid: string;
  currentName: string;
  friendUid: string;
  friendName: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ currentUid, currentName, friendUid, friendName }) => {
  const [messages, setMessages] = useState<{ id: string; senderUid: string; senderName: string; text: string; timestamp: number }[]>([]);
  const [input, setInput] = useState('');

  // Subscribe to the live Firestore DM thread on mount / when users change.
  useEffect(() => {
    if (!currentUid || !friendUid) return;
    const unsub = subscribeToDirectMessages(currentUid, friendUid, setMessages);
    return () => unsub();
  }, [currentUid, friendUid]);

  const sendMessage = () => {
    if (input.trim()) {
      sendDirectMessage(currentUid, friendUid, currentName, input).catch(e => console.error('DM send failed', e));
      setInput('');
    }
  };

  return (
    <div className="chat-panel bg-black/60 rounded-xl p-4 flex flex-col h-64">
      <div className="font-bold text-white mb-2 flex items-center gap-2">
        <span><ICONS.Chat /></span>
        Chat with {friendName}
      </div>
      <div className="flex-1 overflow-y-auto mb-2">
        {messages.map((msg) => (
          <div key={msg.id} className={`mb-1 text-xs ${msg.senderUid === currentUid ? 'text-right text-[var(--accent-blue)]' : 'text-left text-white/80'}`}>
            <span className="block">{msg.text}</span>
            <span className="text-[10px] text-white/30">{new Date(msg.timestamp).toLocaleTimeString()}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          className="flex-1 rounded-lg px-2 py-1 text-xs bg-white/10 text-white border border-white/20"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          className="px-3 py-1 rounded-lg bg-[var(--accent-blue)] text-white font-bold text-xs"
          onClick={sendMessage}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
