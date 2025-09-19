// Array of sample Discord bots
const bots = [
    {
        name: "Uzi-Doorman",
        description: "Roleplays as Uzi Doorman.",
        prefix: "/"
    },
    {
        name: "SD-N,
        description: "Roleplays as SD-N.",
        prefix: "/"
    },
    {
        name: "SD-V",
        description: "Roleplays as SD-V.",
        prefix: "/"
    }
];

// Function to display bots on the webpage
function displayBots() {
    const botList = document.getElementById("bot-list");
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

// Function to show more info about a bot
function moreInfo(index) {
    const bot = bots[index];
    alert(`More info about ${bot.name}:\n\nDescription: ${bot.description}\nPrefix: ${bot.prefix}`);
}

// Event listener for DOM load
document.addEventListener("DOMContentLoaded", () => {
    displayBots();
});

