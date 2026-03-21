import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messagesApi } from '../api/messages';
import { useAuth } from '../context/AuthContext';
import type { SendMessageRequest } from '../types';

export default function InboxPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedThread, setSelectedThread] = useState<{ otherUserId: string; carId?: number } | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const { data: threads, isLoading } = useQuery({
    queryKey: ['inbox'],
    queryFn: messagesApi.getInbox,
  });

  const { data: messages } = useQuery({
    queryKey: ['thread', selectedThread?.otherUserId, selectedThread?.carId],
    queryFn: () => messagesApi.getThread(selectedThread!.otherUserId, selectedThread?.carId),
    enabled: !!selectedThread,
  });

  const sendMutation = useMutation({
    mutationFn: (data: SendMessageRequest) => messagesApi.send(data),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['thread'] });
      queryClient.invalidateQueries({ queryKey: ['inbox'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
    },
  });

  const handleSend = () => {
    if (!newMessage.trim() || !selectedThread) return;
    sendMutation.mutate({
      receiverId: selectedThread.otherUserId,
      carId: selectedThread.carId,
      subject: 'Re: Car Discussion',
      body: newMessage.trim(),
    });
  };

  if (isLoading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <div className="flex bg-white rounded-xl shadow-sm overflow-hidden" style={{ height: '600px' }}>
        {/* Thread List */}
        <div className="w-1/3 border-r overflow-y-auto">
          {!threads?.length ? (
            <p className="text-gray-500 text-center py-8 text-sm">No messages yet</p>
          ) : (
            threads.map((thread) => (
              <button
                key={`${thread.otherUserId}-${thread.carId}`}
                onClick={() => setSelectedThread({ otherUserId: thread.otherUserId, carId: thread.carId ?? undefined })}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition ${
                  selectedThread?.otherUserId === thread.otherUserId && selectedThread?.carId === thread.carId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <p className="font-semibold text-sm">{thread.otherUserName}</p>
                  {thread.unreadCount > 0 && (
                    <span className="bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {thread.unreadCount}
                    </span>
                  )}
                </div>
                {thread.carName && <p className="text-xs text-blue-600 mt-0.5">{thread.carName}</p>}
                <p className="text-xs text-gray-500 mt-1 truncate">{thread.lastMessagePreview}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(thread.lastMessageAt).toLocaleDateString()}</p>
              </button>
            ))
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col">
          {selectedThread ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages?.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                      msg.senderId === user?.id ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      <p className="text-sm">{msg.body}</p>
                      <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t p-4 flex space-x-2">
                <input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Type a message..."
                  className="flex-1 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button onClick={handleSend} disabled={sendMutation.isPending} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
