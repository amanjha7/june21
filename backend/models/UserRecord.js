const mongoose = require('mongoose');

const UserRecordSchema = new mongoose.Schema({
    name: { type: String, required: true },
    dob: { type: Date, required: true },
    pob: { type: String, required: true },
    tob: { type: String, required: true },
    zodiac: { type: String },
    prediction: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UserRecord', UserRecordSchema);
