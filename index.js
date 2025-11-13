import { Client, GatewayIntentBits, Events, Collection, EmbedBuilder } from 'discord.js';
import express from 'express';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import fs from 'fs';
import { registerMetadata } from './config/metadata.js';
import { router } from './routes/oauth.js';
import { PATHWAYS } from './data/pathways.js';
import { connectDB } from './data/database.js'; // MongoDB connection

dotenv.config();

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
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  client.commands.set(command.default.data.name, command.default);
  console.log(`📝 Loaded command: ${command.default.data.name}`);
}

// Express server for OAuth
const app = express();
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(express.json());
app.use('/', router);

app.get('/', (req, res) => {
  const html = readFileSync('./public/index.html', 'utf-8');
  res.send(html);
});

// Handle slash commands
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    
    const errorEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('❌ Command Error')
      .setDescription('There was an error executing this command!')
      .setFooter({ text: 'Please try again later' });
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
    } else {
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  }
});

// Bot ready event
client.once(Events.ClientReady, async () => {
  console.log('\n╔═══════════════════════════════════════════════╗');
  console.log('║              🌙 AROODES 🌙                    ║');
  console.log('║    Lord of the Mysteries Pathway System       ║');
  console.log('╚═══════════════════════════════════════════════╝\n');
  
  console.log(`✅ Bot logged in as ${client.user.tag}`);
  console.log(`📖 Loaded ${Object.keys(PATHWAYS).length} pathways`);
  console.log(`⚙️  Loaded ${client.commands.size} commands`);
  console.log(`🌐 Serving ${client.guilds.cache.size} servers`);
  
  try {
    await registerMetadata();
  } catch (error) {
    console.error('Failed to register metadata:', error);
  }
  
  client.user.setPresence({
    activities: [{ 
      name: 'Above the Gray Fog', 
      type: 3 
    }],
    status: 'online'
  });
  
  console.log('\n🌙 Aroodes is ready!\n');
});

// Error handling
client.on(Events.Error, error => {
  console.error('Discord client error:', error);
});

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
});

// Start bot and server
(async () => {
  try {
    // Connect to MongoDB first
    await connectDB();
    
    // Then start Discord bot
    await client.login(process.env.DISCORD_TOKEN);
    
    // Finally start Express server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`🌐 OAuth server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start bot:', error);
    process.exit(1);
  }
})();
