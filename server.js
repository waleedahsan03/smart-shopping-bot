require('dotenv').config();
const express = require('express');
const path = require('path');

// 🔥 Import your bot code directly
require('./bot/index');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve a simple homepage
app.get('/', (req, res) => {
    res.send('<h1>Smart Shopping Assistant is Running </h1><p>The bot is actively working in the server backend.</p>');
});

// Start Express server
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
});
