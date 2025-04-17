const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
    gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, refPath: 'senderModel', required: true },
    senderModel: { type: String, enum: ['Member', 'Trainer', 'Gym'], required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema);