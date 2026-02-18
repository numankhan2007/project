import { createContext, useContext, useState } from 'react';
import { MOCK_MESSAGES } from '../constants';
import { generateId } from '../utils/helpers';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);

  const getMessagesByOrder = (orderId) => {
    return messages.filter((m) => m.orderId === orderId);
  };

  const sendMessage = (orderId, sender, text) => {
    const newMessage = {
      id: generateId('msg'),
      orderId,
      sender,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  return (
    <ChatContext.Provider
      value={{
        messages,
        getMessagesByOrder,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

export default ChatContext;
