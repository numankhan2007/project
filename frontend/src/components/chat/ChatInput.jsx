import { useState } from 'react';
import { Send, Smile, Loader2 } from 'lucide-react';

export default function ChatInput({ onSend, loading = false }) {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.trim() && !loading) {
      const text = message.trim();
      setMessage('');
      try {
        await onSend(text);
      } catch (err) {
        // Restore message if send fails
        setMessage(text);
      }
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-center gap-2 p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700"
    >
      <button
        type="button"
        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
      >
        <Smile size={20} />
      </button>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={loading}
        className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-gray-700 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!message.trim() || loading}
        className="p-2.5 gradient-bg text-white rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
      </button>
    </form>
  );
}
