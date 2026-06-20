// Basic in-memory chat backend for demo purposes
// Replace with Firebase/Firestore or other real backend for production

export type ChatMessage = {
  from: string;
  to: string;
  text: string;
  timestamp: number;
};

// Simulated chat store
const chatStore: Record<string, ChatMessage[]> = {};

export function getChatKey(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("-");
}

export function sendChatMessage(from: string, to: string, text: string) {
  const key = getChatKey(from, to);
  const msg: ChatMessage = { from, to, text, timestamp: Date.now() };
  if (!chatStore[key]) chatStore[key] = [];
  chatStore[key].push(msg);
}

export function getChatMessages(uid1: string, uid2: string): ChatMessage[] {
  const key = getChatKey(uid1, uid2);
  return chatStore[key] ? [...chatStore[key]] : [];
}
