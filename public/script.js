// Array of sample Discord bots
const bots = [
    {
        name: "Uzi-Doorman",
        description: "Roleplays as Uzi Doorman from Murder Drones.",
        prefix: "/"
    },
    {
        name: "SD-N",
        description: "Roleplays as SD-N from Murder Drones.",
        prefix: "/"
    },
    {
        name: "SD-V",
        description: "Roleplays as SD-V from Murder Drones.",
        prefix: "/"
    }
];

// Function to display bots on the webpage
function displayBots() {
    const botList = document.getElementById("bot-list");
    if (!botList) return;

    botList.innerHTML = ""; // Clear previous list

    bots.forEach((bot, index) => {
        const botItem = document.createElement("div");
        botItem.className = "bot-item";

        botItem.innerHTML = `
            <h3>${bot.name}</h3>
            <p>${bot.description}</p>
            <p><strong>Command Prefix:</strong> ${bot.prefix}</p>
            <button onclick="moreInfo(${index})">More Info</button>
        `;

        botList.appendChild(botItem);
    });
}

// Function to show more information about a bot
function moreInfo(index) {
    const bot = bots[index];
    alert(`${bot.name}\n\n${bot.description}\n\nCommand Prefix: ${bot.prefix}\n\nThis bot is part of the Murder Drones roleplay collection.`);
}

// Function to load bot status from API
async function loadBotStatus() {
    try {
        const response = await fetch('/api/bots');
        const data = await response.json();
        console.log('Bot data loaded:', data);
    } catch (error) {
        console.error('Failed to load bot data:', error);
    }
}

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    displayBots();
    loadBotStatus();
});

// Add some interactive features
function updateStatus() {
    fetch('/api/status')
        .then(response => response.json())
        .then(data => {
            console.log('Server status:', data);
        })
        .catch(error => {
            console.error('Error checking status:', error);
        });
}

// Update status every 30 seconds
setInterval(updateStatus, 30000);