import { useParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ChatBox from '../components/chat/ChatBox';
import { useAuth } from '../context/AuthContext';
import { useOrders } from '../context/OrderContext';
import { useChat } from '../context/ChatContext';

export default function ChatPage() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const { getOrderById } = useOrders();
  const { getMessagesByOrder, sendMessage } = useChat();

  const order = getOrderById(orderId);

  if (!order) {
    return (
      <div className="section-padding page-padding text-center">
        <p className="text-6xl mb-4">🔒</p>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Chat Unavailable</h2>
        <p className="text-gray-500 dark:text-gray-400">
          This chat doesn't exist or the order was not found. You can only chat after placing an order.
        </p>
      </div>
    );
  }

  const isBuyer = order.buyer.username === user?.username;
  const otherUser = isBuyer ? order.seller.username : order.buyer.username;
  const messages = getMessagesByOrder(orderId);

  const handleSend = (text) => {
    sendMessage(orderId, user.username, text);
  };

  return (
    <div className="section-padding py-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto"
        style={{ height: 'calc(100vh - 120px)' }}
      >
        <ChatBox
          messages={messages}
          order={order}
          currentUser={user?.username}
          otherUser={otherUser}
          onSend={handleSend}
        />
      </motion.div>
    </div>
  );
}
