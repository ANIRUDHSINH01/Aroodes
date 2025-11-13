import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PATHWAYS, getPathway, getSequence } from '../data/pathways.js';
import { getUser, getPathwayStats, getSequenceDistribution } from '../data/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pathway')
    .setDescription('Pathway information commands')
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('View your pathway status')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all 22 pathways')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('Get detailed info about a pathway')
        .addStringOption(option =>
          option
            .setName('pathway')
            .setDescription('Choose pathway')
            .setRequired(true)
            .addChoices(
              { name: '🃏 Fool', value: 'fool' },
              { name: '⚡ Error', value: 'error' },
              { name: '🚪 Door', value: 'door' },
              { name: '👁️ Visionary', value: 'visionary' },
              { name: '☀️ Sun', value: 'sun' },
              { name: '⚔️ Tyrant', value: 'tyrant' },
              { name: '🗼 White Tower', value: 'white_tower' },
              { name: '🎣 Hanged Man', value: 'hanged_man' },
              { name: '🌑 Darkness', value: 'darkness' },
              { name: '💀 Death', value: 'death' },
              { name: '⚒️ Twilight Giant', value: 'twilight_giant' },
              { name: '💃 Demoness', value: 'demoness' },
              { name: '🔥 Red Priest', value: 'red_priest' },
              { name: '🌙 Moon', value: 'moon' },
              { name: '🌾 Mother', value: 'mother' },
              { name: '🕳️ Abyss', value: 'abyss' },
              { name: '⛓️ Chained', value: 'chained' },
              { name: '⚖️ Justiciar', value: 'justiciar' },
              { name: '🛡️ Paragon', value: 'paragon' },
              { name: '👑 Black Emperor', value: 'black_emperor' },
              { name: '📚 Hermit', value: 'hermit' },
              { name: '🎰 Wheel of Fortune', value: 'wheel_of_fortune' }
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('View server pathway statistics')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    try {
      switch(subcommand) {
        case 'status':
          await showStatus(interaction);
          break;
        case 'list':
          await listPathways(interaction);
          break;
        case 'info':
          await pathwayInfo(interaction);
          break;
        case 'stats':
          await showStats(interaction);
          break;
      }
    } catch (error) {
      console.error('Error in pathway command:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ Error: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};

async function showStatus(interaction) {
  await interaction.deferReply();
  
  const userData = await getUser(interaction.user.id);

  if (!userData || !userData.pathway) {
    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle('❌ Not a Beyonder')
      .setDescription(
        'You are not a Beyonder yet!\n\n' +
        'Ask a server administrator to assign you a pathway using:\n' +
        '`/admin-pathway set-pathway @you <pathway>`'
      )
      .addFields({
        name: '📚 Learn More',
        value: 'Use `/pathway list` to see all available pathways!',
        inline: false
      })
      .setFooter({ text: 'The mystical world awaits...' });

    return await interaction.editReply({ embeds: [embed] });
  }

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
  
  if (!pathway) {
    return await interaction.editReply({
      content: '❌ Invalid pathway data. Please contact an administrator.'
    });
  }

  const seqInfo = getSequence(pathway, userData.sequence);
  
  const daysSince = userData.assigned_at 
    ? Math.floor((Date.now() - new Date(userData.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('🌙 Your Pathway Status')
    .setThumbnail(interaction.user.displayAvatarURL())
    .setDescription(
      `**Pathway:** ${pathway.emoji} ${pathway.name}\n` +
      `**Sequence:** ${userData.sequence} - ${seqInfo.name}\n` +
      `**Divine Group:** ${pathway.group}`
    )
    .addFields(
      { name: '📊 Lose Control Risk', value: `${seqInfo.risk}%`, inline: true },
      { name: '⚠️ Times Lost Control', value: `${userData.lose_control_count || 0}`, inline: true },
      { name: '📅 Days as Beyonder', value: `${daysSince}`, inline: true }
    )
    .setFooter({ text: 'Use /lose-control check to test your stability' })
    .setTimestamp();

  if (userData.sequence <= 3) {
    embed.addFields({ 
      name: '👼 Angel Status', 
      value: 'You have reached Angel level! Your power is extraordinary.', 
      inline: false 
    });
    embed.setColor(0xffd700); // Gold color for Angels
  }

  if (userData.sequence === 0) {
    embed.addFields({
      name: '⚜️ True God Status',
      value: 'You have ascended to True Godhood! You are beyond lose control.',
      inline: false
    });
    embed.setColor(0xff0000); // Red for True Gods
  }

  await interaction.editReply({ embeds: [embed] });
}

async function listPathways(interaction) {
  await interaction.deferReply();
  
  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📚 All 22 Beyonder Pathways')
    .setDescription('Complete list of all pathways in the mystical world:\n');

  // Group pathways by divine authority
  const groups = {};
  Object.values(PATHWAYS).forEach(p => {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(`${p.emoji} **${p.name}**`);
  });

  for (const [group, pathways] of Object.entries(groups)) {
    embed.addFields({
      name: `${group}`,
      value: pathways.join('\n'),
      inline: true
    });
  }

  embed.addFields({
    name: '\u200b',
    value: 
      '**Commands:**\n' +
      '• `/pathway info <pathway>` - Detailed pathway info\n' +
      '• `/pathway stats` - Server statistics\n' +
      '• `/pathway status` - Your current status',
    inline: false
  });

  embed.setFooter({ text: `Total Pathways: ${Object.keys(PATHWAYS).length}` });

  await interaction.editReply({ embeds: [embed] });
}

async function pathwayInfo(interaction) {
  await interaction.deferReply();
  
  const pathwayName = interaction.options.getString('pathway');
  const pathway = getPathway(pathwayName);

  if (!pathway) {
    return await interaction.editReply({
      content: '❌ Pathway not found!'
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle(`${pathway.emoji} ${pathway.name} Pathway`)
    .setDescription(`**Divine Group:** ${pathway.group}\n\n**Complete Sequence Progression:**`);

  // Show all sequences in a formatted way
  let sequencesText = '';
  pathway.sequences.forEach(seq => {
    const status = seq.seq === 0 ? '⚜️' : seq.seq <= 3 ? '👼' : '🔮';
    const risk = seq.risk === 0 ? 'None' : `${seq.risk}%`;
    sequencesText += `${status} **Sequence ${seq.seq}** - ${seq.name}\n`;
    sequencesText += `   └ Lose Control Risk: ${risk}\n`;
  });

  embed.addFields({ 
    name: 'Sequence Ladder', 
    value: sequencesText, 
    inline: false 
  });

  embed.addFields({
    name: '⚠️ Important',
    value: 
      '• Lower sequences = More power\n' +
      '• Higher sequences = Higher risk\n' +
      '• Sequence 0 = True God (No risk)\n' +
      '• Sequences 1-3 = Angel level',
    inline: false
  });

  embed.setFooter({ text: 'Each advancement brings greater power and greater danger' });

  await interaction.editReply({ embeds: [embed] });
}

async function showStats(interaction) {
  await interaction.deferReply();
  
  const pathwayStats = await getPathwayStats();
  const sequenceStats = await getSequenceDistribution();

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📊 Server Pathway Statistics')
    .setDescription('Current distribution of Beyonders in this server:');

  if (pathwayStats.length > 0) {
    const pathwayText = pathwayStats.slice(0, 10).map(stat => {
      const pathway = getPathway(stat.pathway);
      if (!pathway) return null;
      return `${pathway.emoji} ${pathway.name}: **${stat.count}** Beyonders`;
    }).filter(Boolean).join('\n');

    if (pathwayText) {
      embed.addFields({ 
        name: '🎭 Most Popular Pathways', 
        value: pathwayText, 
        inline: false 
      });
    }
  }

  if (sequenceStats.length > 0) {
    const sequenceText = sequenceStats.map(stat => {
      let status = '🔮';
      if (stat.sequence === 0) status = '⚜️';
      else if (stat.sequence <= 3) status = '👼';
      
      return `Sequence ${stat.sequence}: **${stat.count}** ${status}`;
    }).join('\n');

    embed.addFields({ 
      name: '📈 Sequence Distribution', 
      value: sequenceText, 
      inline: false 
    });
  }

  const totalBeyonders = pathwayStats.reduce((sum, stat) => sum + stat.count, 0);
  const angels = sequenceStats
    .filter(s => s.sequence <= 3 && s.sequence > 0)
    .reduce((sum, s) => sum + s.count, 0);
  const trueGods = sequenceStats.find(s => s.sequence === 0)?.count || 0;

  embed.addFields({
    name: '📊 Summary',
    value: 
      `Total Beyonders: **${totalBeyonders}**\n` +
      `Angels (Seq 1-3): **${angels}**\n` +
      `True Gods (Seq 0): **${trueGods}**`,
    inline: false
  });

  if (totalBeyonders === 0) {
    embed.setDescription('No Beyonders in this server yet. Be the first to start your mystical journey!');
  }

  embed.setFooter({ text: `Updated: ${new Date().toLocaleString()}` });
  embed.setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}
