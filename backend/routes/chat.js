const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const ChatMessage = require('../models/ChatMessage');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');

// Get chat messages for a gym (Member or Trainer only)
router.get('/:gymId', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        const userModel = req.user.role === 'member' ? Member : Trainer;
        const user = await userModel.findById(req.user.id);
        if (!user || !user.gym || user.gym.toString() !== req.params.gymId) {
            return res.status(400).json({ message: 'User must be part of the gym to view chats' });
        }

        const messages = await ChatMessage.find({ gym: req.params.gymId })
            .populate('sender', 'name')
            .sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

module.exports = router;