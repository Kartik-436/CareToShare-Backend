const mongoose = require('mongoose');

const FileSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    content: {
        type: Buffer,
        required: true
    },
    mimetype: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    thumbnail: {
        type: Buffer,
        required: true
    },
    groupId: {
        type: String,
        required: true,
        index: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        index: { expires: 86400 } // 86400 seconds = 24 hours
    }
});

module.exports = mongoose.model('File', FileSchema);