// serverSettings.js
const serverSettings = {};  // { guildId: { botPrefix, statusMessage } }
const accessControl = {};   // { guildId: [userId1, userId2] }

module.exports = {
  getSettings: (guildId) => serverSettings[guildId] || { botPrefix: "!", statusMessage: "Uzi is online" },
  setSettings: (guildId, settings) => {
    serverSettings[guildId] = { ...module.exports.getSettings(guildId), ...settings };
  },
  getAllowedUsers: (guildId) => accessControl[guildId] || [],
  addAllowedUser: (guildId, userId) => {
    if (!accessControl[guildId]) accessControl[guildId] = [];
    if (!accessControl[guildId].includes(userId)) accessControl[guildId].push(userId);
  },
  removeAllowedUser: (guildId, userId) => {
    if (!accessControl[guildId]) return;
    accessControl[guildId] = accessControl[guildId].filter(id => id !== userId);
  }
};
