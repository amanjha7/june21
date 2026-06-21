const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const UserRecord = require('./models/UserRecord');
const { calculateZodiac, getPrediction } = require('./utils/jyotish-logic');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// In-memory mock DB since mongod is not available
let mockDB = [];

// Mock Mongoose connection
const connectDB = async () => {
    try {
        // Attempting real connection if MONGO_URI is provided, else fallback to mock
        if (process.env.MONGO_URI) {
            await mongoose.connect(process.env.MONGO_URI);
            console.log('Connected to MongoDB');
        } else {
            console.log('MongoDB not available, using in-memory mock storage');
        }
    } catch (err) {
        console.error('Database connection error:', err);
    }
};

connectDB();

// API Routes
app.post('/api/predict', async (req, res) => {
    try {
        const { name, dob, pob, tob } = req.body;
        const zodiac = calculateZodiac(new Date(dob));
        const prediction = getPrediction(zodiac);

        const newRecord = {
            id: Date.now(),
            name,
            dob,
            pob,
            tob,
            zodiac,
            prediction,
            createdAt: new Date()
        };

        // Use mockDB for the sandbox environment
        mockDB.push(newRecord);

        // Also try to save to Mongoose if connected (optional for mock)
        if (mongoose.connection.readyState === 1) {
            const userRecord = new UserRecord(newRecord);
            await userRecord.save();
        }

        res.status(201).json(newRecord);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/records', (req, res) => {
    res.json(mockDB);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
