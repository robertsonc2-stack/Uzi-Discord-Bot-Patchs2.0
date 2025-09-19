const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Parse JSON bodies
app.use(express.json());

// --- API Routes ---

// List available bots
app.get('/api/bots', (req, res) => {
    res.json([
        { name: "Uzi-Doorman", description: "Roleplays as Uzi Doorman from Murder Drones", prefix: "/", status: "online" },
        { name: "SD-N", description: "Roleplays as SD-N from Murder Drones", prefix: "/", status: "online" },
        { name: "SD-V", description: "Roleplays as SD-V from Murder Drones", prefix: "/", status: "online" }
    ]);
});

// Server status
app.get('/api/status', (req, res) => {
    res.json({
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

// Discord bot status
app.get('/api/discord-status', (req, res) => {
    try {
        const client = require('./index.js');
        res.json({
            loggedIn: !!client.user,
            username: client.user?.tag || 'Not logged

