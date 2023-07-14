const { Client, Intents, MessageEmbed, MessageActionRow, MessageButton } = require('discord.js');
const puppeteer = require('puppeteer');
const axios = require('axios');
const levelingSystem = require('./levelingsystem');
//Muting SysteM
const mutingSystem = require('./mutingSystem');

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
  ],
});

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
  levelingSystem.init(client);
});

client.on('messageCreate', (message) => {
  mutingSystem.checkSpam(message);
  if (message.content.startsWith('+')) {
    const args = message.content.slice(1).trim().split(/ +/);
    const command = args.shift().toLowerCase();

    if (command === 'help') {
      const embed = new MessageEmbed()
        .setTitle('Bot Commands')
        .setDescription('List of available commands:')
        .addField('+help', 'Displays this help message', false)
        .addField('+command1', 'Description of command 1', false)
        .addField('+command2', 'Description of command 2', false);
      // Add more commands as needed

      message.author.send({ embeds: [embed] })
        .then(() => {
          message.channel.send('📬 Sent you a DM with the list of commands.');
        })
        .catch((error) => {
          console.error(`Failed to send DM to ${message.author.tag}:`, error);
          message.channel.send('❌ Failed to send you a DM with the list of commands.');
        });
    } else if (command === 'meme') {
      axios.get('https://meme-api.com/gimme')
        .then((response) => {
          const { title, url, subreddit, postLink } = response.data;
          const embed = new MessageEmbed()
            .setTitle(title)
            .setURL(postLink)
            .setImage(url)
            .setFooter(`Subreddit: ${subreddit}`);

          message.channel.send({ embeds: [embed] });
        })
        .catch((error) => {
          console.error('Failed to fetch meme:', error);
          message.channel.send('❌ Failed to fetch a meme. Please try again later.');
        });
    } else if (command === 'level') {
      const user = message.mentions.users.first() || message.author;
      const xp = levelingSystem.getXP(user.id);
      const level = levelingSystem.getLevel(xp); // Calculate level based on XP
      message.channel.send(`**${user.tag}** is currently at Level ${level}.`);
    } else if (command === 'xp') {
      const user = message.mentions.users.first() || message.author;
      const xp = levelingSystem.getXP(user.id);
      message.channel.send(`**${user.tag}** has **${xp}** XP points.`);
    } else if (command === 'leaderboard') {
      const xpData = levelingSystem.getXPData();
      const leaderboard = Object.entries(xpData)
        .sort((a, b) => b[1] - a[1])
        .map(([userId, xp], index) => `**${index + 1}.** <@${userId}> - ${xp} XP`)
        .join('\n');

      const embed = new MessageEmbed()
        .setTitle('Leaderboard')
        .setDescription(leaderboard);

      message.channel.send({ embeds: [embed] });
    } else if (command === 'start') {
      startAternosServer()
        .then(() => {
          message.channel.send('Aternos server started successfully.');
        })
        .catch((error) => {
          console.error('An error occurred:', error);
          message.channel.send('An error occurred while starting the Aternos server.');
        });
    }
  }
});


const boardSize = 3;
const emptyCell = '\u200B';
const playerSymbols = {
  1: '❌',
  2: '⭕',
};

let gameInProgress = false;
let currentPlayer = null;
let gameBoard = null;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', (message) => {
  if (message.content.startsWith('+tic-tac-toe') && !gameInProgress) {
    const mention = message.mentions.users.first();
    if (!mention) {
      message.reply('Please mention a player to start the game.');
      return;
    }

    const player1 = message.author;
    const player2 = mention;

    gameInProgress = true;
    currentPlayer = player1.id;
    gameBoard = createEmptyBoard(boardSize);

    const embed = createBoardEmbed(gameBoard, currentPlayer, player1, player2);
    const buttons = createButtonGrid(boardSize);
    message.channel.send({ embeds: [embed], components: buttons });
  }
});

client.on('interactionCreate', (interaction) => {
  if (!gameInProgress || interaction.user.id !== currentPlayer || !interaction.isButton()) return;

  const [row, column] = interaction.customId.split('_').map(Number);
  if (isValidMove(row, column)) {
    makeMove(row, column);
    currentPlayer = getOpponent();

    const embed = createBoardEmbed(gameBoard, currentPlayer);
    const buttons = createButtonGrid(boardSize);
    interaction.update({ embeds: [embed], components: buttons });

    const winner = getWinner();
    if (winner) {
      gameInProgress = false;
      interaction.channel.send(`Player <@${winner}> wins!`);
    } else if (isBoardFull()) {
      gameInProgress = false;
      interaction.channel.send("It's a draw!");
    }
  } else {
    interaction.reply({ content: 'Invalid move. Please try again.', ephemeral: true });
  }
});

function createEmptyBoard(size) {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => emptyCell));
}

function createBoardEmbed(board, currentPlayer, player1, player2) {
  const embed = new MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Tic-Tac-Toe')
    .setDescription(`Current Player: <@${currentPlayer}>`)
    .addField('\u200B', board.map(row => row.join(' ')).join('\n'));

  if (player1 && player2) {
    embed.setFooter(`${player1.tag} vs ${player2.tag}`);
  }

  return embed;
}

function createButtonGrid(size) {
  const buttons = [];
  for (let row = 0; row < size; row++) {
    const rowButtons = [];
    for (let column = 0; column < size; column++) {
      const button = new MessageButton()
        .setCustomId(`${row}_${column}`)
        .setLabel(emptyCell)
        .setStyle('SECONDARY');
      rowButtons.push(button);
    }
    buttons.push(new MessageActionRow().addComponents(rowButtons));
  }

  return buttons;
}

function isValidMove(row, column) {
  return gameBoard[row] && gameBoard[row][column] === emptyCell;
}

function makeMove(row, column) {
  gameBoard[row][column] = playerSymbols[currentPlayer];
}

function getOpponent() {
  return currentPlayer === 1 ? 2 : 1;
}

function getWinner() {
  const lines = [
    // Rows
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // Columns
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // Diagonals
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]],
  ];

  for (const line of lines) {
    const [a, b, c] = line;
    if (
      gameBoard[a[0]][a[1]] === gameBoard[b[0]][b[1]] &&
      gameBoard[a[0]][a[1]] === gameBoard[c[0]][c[1]] &&
      gameBoard[a[0]][a[1]] !== emptyCell
    ) {
      return currentPlayer;
    }
  }

  return null;
}

function isBoardFull() {
  for (const row of gameBoard) {
    if (row.includes(emptyCell)) {
      return false;
    }
  }
  return true;
}



client.login(process.env.token);
