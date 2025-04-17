const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');
const configureCloudinary = require('./config/cloudinary');
const errorHandler = require('./middleware/error');
const authRoutes = require('./routes/auth');
const gymRoutes = require('./routes/gym');
const memberRoutes = require('./routes/member');
const chatRoutes = require('./routes/chat');
const announcementRoutes = require('./routes/announcement');
const adminRoutes = require('./routes/admin');
const scheduleRoutes = require('./routes/schedule');
const contactRoutes = require('./routes/contact');
const analyticsRoutes = require('./routes/analytics');
const reviewRoutes = require('./routes/review');

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:5173',
        methods: ['GET', 'POST'],
    },
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB and Cloudinary
connectDB();
configureCloudinary();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/gym', gymRoutes);
app.use('/api/member', memberRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/announcement', announcementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/review', reviewRoutes);

// Error Handler Middleware
app.use(errorHandler);

// Test Route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running' });
});

// WebSocket for Chat
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('joinGym', (gymId) => {
        if (!gymId) {
            console.error('Invalid gymId:', gymId);
            return;
        }
        socket.join(gymId);
        console.log(`User ${socket.id} joined gym ${gymId}`);
    });

    socket.on('sendMessage', async ({ gymId, senderId, senderModel, message }) => {
        try {
            if (!gymId || !senderId || !senderModel || !message) {
                console.error('Missing required fields for chat message:', { gymId, senderId, senderModel, message });
                return;
            }

            const ChatMessage = require('./models/ChatMessage');
            const chatMessage = new ChatMessage({
                gym: gymId,
                sender: senderId,
                senderModel,
                message,
            });
            await chatMessage.save();

            const populatedMessage = await ChatMessage.findById(chatMessage._id)
                .populate('sender', 'name')
                .exec();

            io.to(gymId).emit('receiveMessage', populatedMessage);
            console.log(`Message sent to gym ${gymId}:`, populatedMessage);
        } catch (error) {
            console.error('Error saving or emitting message:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));