const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// Basic API routes
app.get('/api/bots', (req, res) => {
    res.json([
        {
            name: "Uzi-Doorman",
            description: "Roleplays as Uzi Doorman from Murder Drones",
            prefix: "/",
            status: "online"
        },
        {
            name: "SD-N",
            description: "Roleplays as SD-N from Murder Drones",
            prefix: "/",
            status: "online"
        },
        {
            name: "SD-V",
            description: "Roleplays as SD-V from Murder Drones",
            prefix: "/",
            status: "online"
        }
    ]);
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Discord bot status endpoint
app.get('/api/discord-status', (req, res) => {
    try {
        const client = require('./index.js');
        res.json({
            loggedIn: client.user ? true : false,
            username: client.user ? client.user.tag : 'Not logged in',
            guilds: client.guilds ? client.guilds.cache.size : 0,
            users: client.users ? client.users.cache.size : 0
        });
    } catch (error) {
        res.json({
            loggedIn: false,
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});

// Catch-all handler: send back index.html
// ✅ Fixed to avoid PathError by naming the wildcard
app.get('/:path(*)', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Web server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the bot dashboard`);
});

// Start the Discord bot
try {
    require('./index.js');
    console.log('Discord bot started successfully');
} catch (error) {
    console.error('Failed to start Discord bot:', error);
}

module.exports = app;
