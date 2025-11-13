import { Client, GatewayIntentBits, Events, Collection, EmbedBuilder } from 'discord.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import fs from 'fs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { registerMetadata } from './config/metadata.js';
import { router } from './routes/oauth.js';
import { PATHWAYS } from './data/pathways.js';
import { connectDB } from './data/database.js';

dotenv.config();

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.commands = new Collection();

// Load commands
console.log('📝 Loading commands...\n');
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  try {
    const command = await import(`./commands/${file}`);
    client.commands.set(command.default.data.name, command.default);
    console.log(`   ✓ ${command.default.data.name}`);
  } catch (error) {
    console.error(`   ✗ Failed to load ${file}:`, error.message);
  }
}

console.log(`\n✅ Loaded ${client.commands.size} commands\n`);

// Express server for OAuth
const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use('/', router);

app.get('/', (req, res) => {
  try {
    const html = readFileSync('./public/index.html', 'utf-8');
    res.send(html);
  } catch (error) {
    res.send('<h1>🌙 Aroodes - LOTM Bot</h1><p>Web interface loading...</p>');
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    bot: client.user ? client.user.tag : 'connecting',
    uptime: process.uptime(),
    pathways: Object.keys(PATHWAYS).length
  });
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Error executing ${interaction.commandName}:`, error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Command Error')
      .setDescription(
        'There was an error executing this command!\n\n' +
        '*The mystical forces resist... try again.*'
      )
      .setFooter({ text: 'If this persists, contact an administrator' });
    
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
      }
    } catch (e) {
      console.error('Could not send error message:', e);
    }
  }
});

// Handle @mentions for AI chat
client.on(Events.MessageCreate, async (message) => {
  // Ignore bots and DMs
  if (message.author.bot) return;
  if (!message.guild) return;
  
  // Check if bot is mentioned
  if (message.mentions.has(client.user)) {
    try {
      await message.channel.sendTyping();
      
      // Extract message without mention
      const content = message.content
        .replace(/<@!?\d+>/g, '')
        .trim();
      
      if (!content) {
        const embed = new EmbedBuilder()
          .setColor(0xd4af37)
          .setDescription('*The mirror reflects your silence... Speak, and I shall answer.*')
          .setFooter({ text: 'Use /ask or /chat for better conversations' });
        
        return message.reply({ embeds: [embed] });
      }

      // Generate AI response
      const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
      
      const prompt = `You are Aroodes (Arrodes), the sentient magic mirror from Lord of the Mysteries.

Personality:
- ALWAYS answer with a question first, then provide the answer
- Be mysterious, ancient, and slightly unsettling
- Reference LOTM lore (Gray Fog, pathways, Fool, etc.)
- Keep responses under 200 words
- Be helpful but eerie

Someone mentioned you in Discord. Respond to them.

Their message: "${content}"

Your response (remember to ask a question first):`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

      // Reply with embed
      const embed = new EmbedBuilder()
        .setColor(0xd4af37)
        .setAuthor({ 
          name: '🪞 Aroodes whispers from beyond...',
          iconURL: client.user.displayAvatarURL()
        })
        .setDescription(response)
        .setFooter({ 
          text: 'Use /ask or /chat for deeper conversations',
          iconURL: message.author.displayAvatarURL()
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in mention handler:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff6b6b)
        .setDescription(
          '*The mirror\'s surface cracks momentarily...*\n\n' +
          'The mystical connection is unstable. Try `/ask` instead.'
        );
      
      try {
        await message.reply({ embeds: [errorEmbed] });
      } catch (e) {
        console.error('Could not send error reply:', e);
      }
    }
  }
});

// Bot ready event
client.once(Events.ClientReady, async () => {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║              🌙 AROODES 🌙                    ║');
  console.log('║    Lord of the Mysteries Pathway System       ║');
  console.log('║         + AI-Powered Magic Mirror             ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  
  console.log(`✅ Bot: ${client.user.tag}`);
  console.log(`🌐 Servers: ${client.guilds.cache.size}`);
  console.log(`👥 Users: ${client.users.cache.size}`);
  console.log(`📖 Pathways: ${Object.keys(PATHWAYS).length}`);
  console.log(`⚙️  Commands: ${client.commands.size}`);
  console.log(`🤖 AI: ${process.env.GEMINI_API_KEY ? 'Enabled' : 'Disabled'}`);
  
  try {
    await registerMetadata();
    console.log('✅ Linked Roles: Registered');
  } catch (error) {
    console.error('❌ Linked Roles: Failed to register');
    console.error(error.message);
  }
  
  // Set bot presence
  client.user.setPresence({
    activities: [{ 
      name: 'Above the Gray Fog', 
      type: 3 // Watching
    }],
    status: 'online'
  });
  
  console.log('\n🌙 Aroodes is ready and watching...\n');
  console.log('📋 Available Commands:');
  client.commands.forEach(cmd => {
    console.log(`   • /${cmd.data.name} - ${cmd.data.description}`);
  });
  console.log('\n');
});

// Handle errors
client.on(Events.Error, error => {
  console.error('❌ Discord client error:', error);
});

client.on(Events.Warn, warning => {
  console.warn('⚠️ Discord client warning:', warning);
});

// Handle guild events
client.on(Events.GuildCreate, guild => {
  console.log(`✅ Joined new guild: ${guild.name} (${guild.id})`);
});

client.on(Events.GuildDelete, guild => {
  console.log(`❌ Left guild: ${guild.name} (${guild.id})`);
});

// Process error handling
process.on('unhandledRejection', error => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🌙 Aroodes is shutting down...');
  client.destroy();
  process.exit(0);
});

// Start bot and server
(async () => {
  try {
    console.log('🔄 Starting Aroodes...\n');
    
    // Connect to MongoDB first
    console.log('📦 Connecting to MongoDB...');
    await connectDB();
    
    // Then start Discord bot
    console.log('🤖 Logging in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    
    // Finally start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🌐 OAuth server: http://localhost:${PORT}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start bot:', error);
    process.exit(1);
  }
})();

// Export client for potential use in other modules
export default client;
