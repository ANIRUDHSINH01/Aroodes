import { REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const commands = [];
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

console.log('📝 Loading commands for deployment...\n');

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  commands.push(command.default.data.toJSON());
  console.log(`   ✓ ${command.default.data.name}`);
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log(`\n🚀 Deploying ${commands.length} slash commands...\n`);
    
    const data = await rest.put(
      Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
      { body: commands }
    );
    
    console.log(`✅ Successfully deployed ${data.length} commands!\n`);
    
    console.log('Deployed commands:');
    data.forEach(cmd => {
      console.log(`   • /${cmd.name} - ${cmd.description}`);
    });
    
    console.log('\n🌙 Commands are now available globally!\n');
    
  } catch (error) {
    console.error('❌ Error deploying commands:', error);
  }
})();
