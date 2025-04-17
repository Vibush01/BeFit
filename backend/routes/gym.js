const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');
const JoinRequest = require('../models/JoinRequest');
const Member = require('../models/Member');
const Trainer = require('../models/Trainer');
const authMiddleware = require('../middleware/auth');
const mongoose = require('mongoose');
const Analytics = require('../models/Analytics');

// Get all gyms (for Members and Trainers to browse)
router.get('/', async (req, res, next) => {
    try {
        const gyms = await Gym.find();
        res.json(gyms);
    } catch (error) {
        next(error);
    }
});

// Get gym by ID
router.get('/:id', async (req, res, next) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        const gym = await Gym.findById(req.params.id);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        res.json(gym);
    } catch (error) {
        next(error);
    }
});

// Create a join request (Member or Trainer)
router.post('/request/:gymId', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'member' && req.user.role !== 'trainer') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { role } = req.body;

    if (role !== req.user.role) {
        return res.status(400).json({ message: 'Role mismatch' });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.gymId)) {
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        const gym = await Gym.findById(req.params.gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }

        const userModel = role === 'member' ? Member : Trainer;
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.gym) {
            return res.status(400).json({ message: 'User is already part of a gym' });
        }

        const existingRequest = await JoinRequest.findOne({ user: req.user.id, gym: req.params.gymId });
        if (existingRequest) {
            return res.status(400).json({ message: 'Join request already exists' });
        }

        const joinRequest = new JoinRequest({
            user: req.user.id,
            gym: req.params.gymId,
            role,
            status: 'pending',
        });

        await joinRequest.save();

        // Log join request action
        const analyticsEntry = new Analytics({
            action: 'JoinRequest',
            userId: req.user.id,
            userModel: role.charAt(0).toUpperCase() + role.slice(1),
            details: { gymId: req.params.gymId },
        });
        await analyticsEntry.save();

        res.status(201).json({ message: 'Join request sent' });
    } catch (error) {
        next(error);
    }
});

// Get join requests for a gym (Gym only)
router.get('/requests/:gymId', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    try {
        // Validate gymId
        if (!mongoose.Types.ObjectId.isValid(req.params.gymId)) {
            return res.status(400).json({ message: 'Invalid gym ID' });
        }

        // Ensure the authenticated gym user matches the gymId
        const gym = await Gym.findById(req.params.gymId);
        if (!gym) {
            return res.status(404).json({ message: 'Gym not found' });
        }
        if (gym._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to view requests for this gym' });
        }

        const joinRequests = await JoinRequest.find({ gym: req.params.gymId })
            .populate('user', 'name email')
            .sort({ createdAt: -1 });

        res.json(joinRequests);
    } catch (error) {
        next(error);
    }
});

// Approve or reject a join request (Gym only)
router.put('/request/:requestId', authMiddleware, async (req, res, next) => {
    if (req.user.role !== 'gym') {
        return res.status(403).json({ message: 'Access denied' });
    }

    const { action } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
        return res.status(400).json({ message: 'Invalid action. Must be "approve" or "reject"' });
    }

    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.requestId)) {
            return res.status(400).json({ message: 'Invalid request ID' });
        }

        const joinRequest = await JoinRequest.findById(req.params.requestId).populate('user');
        if (!joinRequest) {
            return res.status(404).json({ message: 'Join request not found' });
        }

        const gym = await Gym.findById(joinRequest.gym);
        if (!gym || gym._id.toString() !== req.user.id) {
            return res.status(403).json({ message: 'You are not authorized to manage this request' });
        }

        if (joinRequest.status !== 'pending') {
            return res.status(400).json({ message: 'Request has already been processed' });
        }

        joinRequest.status = action;
        await joinRequest.save();

        if (action === 'approve') {
            const userModel = joinRequest.role === 'member' ? Member : Trainer;
            const user = await userModel.findById(joinRequest.user._id);
            if (user) {
                user.gym = joinRequest.gym;
                await user.save();
            }
        }

        res.json({ message: `Request ${action}ed successfully` });
    } catch (error) {
        next(error);
    }
});

module.exports = router;