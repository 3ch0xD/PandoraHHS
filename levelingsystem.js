const fs = require('fs');

// Load XP data from file
function loadXPData() {
  try {
    const data = fs.readFileSync('xp.json');
    return JSON.parse(data);
  } catch (error) {
    return {};
  }
}

// Save XP data to file
function saveXPData(data) {
  fs.writeFileSync('xp.json', JSON.stringify(data, null, 2));
}

// Update XP data for a user
function updateXPData(userId, xp) {
  const xpData = loadXPData();
  xpData[userId] = xp;
  saveXPData(xpData);
}

// Get XP points for a user
function getXP(userId) {
  const xpData = loadXPData();
  return xpData[userId] || 0;
}

// Get level based on XP points
function getLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

// Get XP data for all users
function getXPData() {
  return loadXPData();
}

// Initialize the leveling system
function init(client) {
  client.on('messageCreate', (message) => {
    if (message.author.bot) return; // Ignore messages from bots

    // Update XP for user
    const xp = getXP(message.author.id);
    updateXPData(message.author.id, xp + 2); // Add 2 XP per message

    const level = getLevel(xp + 2); // Calculate new level
    const newLevel = getLevel(xp + 2);
    if (newLevel > level) {
      client.emit('levelUp', message.author, newLevel); // Emit levelUp event
    }
  });
}

module.exports = {
  init,
  getLevel,
  getXP,
  getXPData,
  updateXPData, // Export updateXPData function
};
