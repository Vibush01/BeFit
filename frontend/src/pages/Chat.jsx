import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import io from 'socket.io-client';
import { toast } from 'react-toastify';

const socket = io('http://localhost:5000');

const Chat = () => {
    const { user, userDetails } = useContext(AuthContext);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMessages = async () => {
            if (!userDetails?.gym) {
                setError('You must be part of a gym to view chats');
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const token = localStorage.getItem('token');
                const res = await axios.get(`http://localhost:5000/api/chat/${userDetails.gym}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setMessages(res.data);
            } catch (err) {
                setError('Failed to fetch messages');
                toast.error('Failed to fetch messages');
            } finally {
                setLoading(false);
            }
        };

        if (user?.role === 'member' || user?.role === 'trainer' || user?.role === 'gym') {
            fetchMessages();
        }

        // Join gym room
        if (userDetails?.gym) {
            socket.emit('joinGym', userDetails.gym);
        }

        // Listen for new messages
        socket.on('receiveMessage', (message) => {
            setMessages((prevMessages) => [...prevMessages, message]);
        });

        // Cleanup on unmount
        return () => {
            socket.off('receiveMessage');
        };
    }, [user, userDetails]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        if (!userDetails?.gym) {
            toast.error('You must be part of a gym to send messages');
            return;
        }

        const messageData = {
            gymId: userDetails.gym,
            senderId: user.id,
            senderModel: user.role.charAt(0).toUpperCase() + user.role.slice(1),
            message: newMessage,
        };

        socket.emit('sendMessage', messageData);
        setNewMessage('');
    };

    if (user?.role !== 'member' && user?.role !== 'trainer' && user?.role !== 'gym') {
        return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <p className="text-red-500">Access denied. This page is only for Members, Trainers, and Gyms.</p>
        </div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 py-6 sm:py-8 px-4">
            <div className="container mx-auto">
                <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 text-center">Gym Chat</h1>
                {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
                {loading ? (
                    <div className="flex justify-center">
                        <svg className="animate-spin h-8 w-8 text-blue-600" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                ) : (
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
                        <div className="max-h-96 overflow-y-auto mb-4">
                            {messages.map((msg) => (
                                <div key={msg._id} className={`mb-2 ${msg.sender._id === user.id ? 'text-right' : 'text-left'}`}>
                                    <p className={`inline-block p-2 rounded-lg ${msg.sender._id === user.id ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'} text-sm sm:text-base`}>
                                        <strong>{msg.sender.name}:</strong> {msg.message}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleString()}</p>
                                </div>
                            ))}
                        </div>
                        <form onSubmit={handleSendMessage} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                className="flex-1 p-2 border rounded"
                                placeholder="Type your message..."
                                required
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Chat;