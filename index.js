import { Client, GatewayIntentBits, Events, Collection, EmbedBuilder } from 'discord.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { registerMetadata } from './config/metadata.js';
import { router } from './routes/oauth.js';
import { PATHWAYS } from './data/pathways.js';
import { connectDB } from './data/database.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Express server
const app = express();

// Static file serving - IMPORTANT for images
app.use(express.static('public'));
app.use('/pathways', express.static(path.join(__dirname, 'public', 'pathways')));

app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use('/', router);

// Root route - redirect based on auth
app.get('/', (req, res) => {
  const token = req.cookies.auth_token;
  
  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET || 'change-this');
      return res.redirect('/dashboard');
    } catch (error) {
      // Invalid token
    }
  }
  
  // Show main page
  try {
    const html = readFileSync('./public/index.html', 'utf-8');
    res.send(html);
  } catch (error) {
    res.redirect('/login');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    bot: client.user ? client.user.tag : 'connecting',
    uptime: process.uptime(),
    pathways: Object.keys(PATHWAYS).length
  });
});

// Add pathway selection endpoint
app.post('/api/select-pathway', async (req, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'change-this');
    const { pathwayId } = req.body;
    
    // Check if user already has pathway
    const existingUser = await getUser(decoded.userId);
    if (existingUser && existingUser.pathway) {
      return res.status(400).json({ error: 'Pathway already selected' });
    }
    
    // Set pathway
    await setUserPathway(decoded.userId, decoded.username, pathwayId, decoded.discriminator, decoded.avatar);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to select pathway' });
  }
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
      .setDescription('There was an error executing this command!')
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

// Handle @mentions for AI chat and staff auto-reply
client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;
  
  // Check if specific user (1390868532669054976) is mentioned - AUTO REPLY
  const STAFF_USER_ID = '1390868532669054976';
  if (message.mentions.users.has(STAFF_USER_ID)) {
    const autoReplyEmbed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('📢 Auto Reply')
      .setDescription('For general questions, please contact the staff team.\n\nThey will assist you shortly!')
      .setFooter({ text: 'This is an automated message' })
      .setTimestamp();
    
    return message.reply({ embeds: [autoReplyEmbed] });
  }
  
  // AI chat for bot mentions
  if (message.mentions.has(client.user)) {
    try {
      await message.channel.sendTyping();
      
      const content = message.content.replace(/<@!?\d+>/g, '').trim();
      
      if (!content) {
        const embed = new EmbedBuilder()
          .setColor(0xd4af37)
          .setDescription('*The mirror reflects your silence... Speak, and I shall answer.*')
          .setFooter({ text: 'Use /ask or /chat for better conversations' });
        
        return message.reply({ embeds: [embed] });
      }

      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      
      const prompt = `You are Aroodes (Arrodes), the sentient magic mirror from Lord of the Mysteries.

Personality:
- ALWAYS answer with a question first, then provide the answer
- Be mysterious, ancient, and slightly unsettling
- Reference LOTM lore (Gray Fog, pathways, Fool, etc.)
- Keep responses under 200 words

Their message: "${content}"

Your response:`;

      const result = await model.generateContent(prompt);
      const response = result.response.text();

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
    console.error('❌ Linked Roles: Failed');
  }
  
  // Set DND (Do Not Disturb) status
  client.user.setPresence({
    activities: [{ name: 'Above the Gray Fog', type: 3 }],
    status: 'dnd'
  });
  
  console.log('\n🌙 Aroodes is ready!\n');
});

// Error handling
client.on(Events.Error, error => console.error('❌ Discord error:', error));
client.on(Events.Warn, warning => console.warn('⚠️ Discord warning:', warning));

process.on('unhandledRejection', error => console.error('❌ Unhandled rejection:', error));
process.on('uncaughtException', error => {
  console.error('❌ Uncaught exception:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🌙 Shutting down...');
  client.destroy();
  process.exit(0);
});

// Start bot and server
(async () => {
  try {
    console.log('🔄 Starting Aroodes...\n');
    
    console.log('📦 Connecting to MongoDB...');
    await connectDB();
    
    console.log('🤖 Logging in to Discord...');
    await client.login(process.env.DISCORD_TOKEN);
    
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🌐 Web server: http://localhost:${PORT}`);
      console.log(`🔐 Login: http://localhost:${PORT}/login`);
      console.log(`📊 Dashboard: http://localhost:${PORT}/dashboard`);
      console.log(`🖼️  Images: http://localhost:${PORT}/pathways/`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start:', error);
    process.exit(1);
  }
})();

export default client;
