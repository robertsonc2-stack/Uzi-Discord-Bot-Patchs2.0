const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- Middleware ---

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// --- API Routes ---

// List bots
app.get('/api/bots', function (req, res) {
    res.json([
        { name: "Uzi-Doorman", description: "Roleplays as Uzi Doorman from Murder Drones", prefix: "/", status: "online" },
        { name: "SD-N", description: "Roleplays as SD-N from Murder Drones", prefix: "/", status: "online" },
        { name: "SD-V", description: "Roleplays as SD-V from Murder Drones", prefix: "/", status: "online" }
    ]);
});

// Server status
app.get('/api/status', function (req, res) {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Discord bot status
app.get('/api/discord-status', function (req, res) {
    try {
        var client = require('./index.js');
        res.json({
            loggedIn: client.user ? true : false,
            username: client.user ? client.user.tag : 'Not logged in',
            guilds: client.guilds ? client.guilds.cache.size : 0,
            users: client.users ? client.users.cache.size : 0
        });
    } catch (err) {
        res.json({ loggedIn: false, error: err.message });
    }
});

// Health check
app.get('/health', function (req, res) {
    res.json({ status: 'healthy' });
});

// --- Catch-all for SPA ---
// Works for React/Vue/Angular client-side routing
app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Error Handling ---
app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// --- Start Server ---
app.listen(PORT, function () {
    console.log('Web server running on port ' + PORT);
    console.log('Visit http://localhost:' + PORT + ' to view the bot dashboard');
});

// --- Start Discord Bot ---
try {
    require('./index.js');
    console.log('Discord bot started successfully');
} catch (err) {
    console.error('Failed to start Discord bot:', err);
}

module.exports = app;


