const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const config = require('./config.json');

// Initialize Discord client
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// Load XP data
let xpData = {};
const xpFile = './xpData.json';

if (fs.existsSync(xpFile)) {
  xpData = JSON.parse(fs.readFileSync(xpFile));
}

// Save XP data to file
function saveXpData() {
  fs.writeFileSync(xpFile, JSON.stringify(xpData, null, 2));
}

// Calculate level based on XP
function calculateLevel(xp) {
  return Math.floor(xp / config.levelUpXp);
}

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', message => {
  // Ignore messages from bots
  if (message.author.bot) return;

  const userId = message.author.id;
  const guildId = message.guild.id;

  // Initialize user data if not present
  if (!xpData[guildId]) xpData[guildId] = {};
  if (!xpData[guildId][userId]) {
    xpData[guildId][userId] = {
      xp: 0,
      level: 0
    };
  }

  // Add XP
  xpData[guildId][userId].xp += config.xpPerMessage;
  const newLevel = calculateLevel(xpData[guildId][userId].xp);

  // Check for level up
  if (newLevel > xpData[guildId][userId].level) {
    xpData[guildId][userId].level = newLevel;
    message.channel.send(`🎉 ${message.author}, you leveled up to level ${newLevel}!`);
  }

  saveXpData();

  // Command handling
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  if (command === 'rank') {
    const userData = xpData[guildId][userId];
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Rank`)
      .addFields(
        { name: 'Level', value: `${userData.level}`, inline: true },
        { name: 'XP', value: `${userData.xp}`, inline: true }
      )
      .setColor(0x00AE86);
    message.channel.send({ embeds: [embed] });
  }
});

client.login(config.token);
