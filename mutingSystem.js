const { Collection } = require('discord.js');

// Collection to store timeouts for each user
const timeouts = new Collection();

function checkSpam(message) {
  const { author, content, channel } = message;

  // Check if the message author is already timed out
  if (timeouts.has(author.id)) {
    // Delete the message to prevent further spam
    message.delete();
    return;
  }

  // Set spam threshold and timeout duration (in milliseconds)
  const spamThreshold = 8; // Number of messages considered as spam
  const timeoutDuration = 60000; // 1 minute

  // Check for spam within the timeout duration
  const userMessages = channel.messages.cache.filter(
    (msg) => msg.author.id === author.id && msg.createdTimestamp > Date.now() - timeoutDuration
  );

  // If the user has sent more messages than the spam threshold, timeout the user
  if (userMessages.size > spamThreshold) {
    // Mute the user
    const mutedRole = message.guild.roles.cache.find((role) => role.name === 'Muted');
    if (mutedRole) {
      message.member.roles.add(mutedRole);
      timeouts.set(author.id, setTimeout(() => {
        // Remove the timeout and unmute the user after the timeout duration
        timeouts.delete(author.id);
        message.member.roles.remove(mutedRole);
      }, timeoutDuration));
    } else {
      console.error(`Failed to find the "Muted" role.`);
    }
  }
}

module.exports = {
  checkSpam,
};
