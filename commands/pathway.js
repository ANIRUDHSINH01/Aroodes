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
  }
};

async function showStatus(interaction) {
  const userData = getUser(interaction.user.id);

  if (!userData || !userData.pathway) {
    return await interaction.reply({
      content: '❌ You are not a Beyonder yet! Ask an admin to assign you a pathway using `/admin-pathway set-pathway`.',
      ephemeral: true
    });
  }

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
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
    .setFooter({ text: 'Use /lose-control to check your stability' })
    .setTimestamp();

  if (userData.sequence <= 3) {
    embed.addFields({ 
      name: '👼 Angel Status', 
      value: 'You have reached Angel level! Your power is extraordinary.', 
      inline: false 
    });
  }

  await interaction.reply({ embeds: [embed] });
}

async function listPathways(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📚 All 22 Beyonder Pathways')
    .setDescription('Complete list of all pathways in the mystical world:');

  // Group pathways by divine authority
  const groups = {};
  Object.values(PATHWAYS).forEach(p => {
    if (!groups[p.group]) groups[p.group] = [];
    groups[p.group].push(`${p.emoji} **${p.name}**`);
  });

  for (const [group, pathways] of Object.entries(groups)) {
    embed.addFields({
      name: group,
      value: pathways.join('\n'),
      inline: true
    });
  }

  embed.setFooter({ text: 'Use /pathway info <pathway> for detailed information' });

  await interaction.reply({ embeds: [embed] });
}

async function pathwayInfo(interaction) {
  const pathwayName = interaction.options.getString('pathway');
  const pathway = getPathway(pathwayName);

  if (!pathway) {
    return await interaction.reply({
      content: '❌ Pathway not found!',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle(`${pathway.emoji} ${pathway.name} Pathway`)
    .setDescription(`**Divine Group:** ${pathway.group}\n\n**Sequence Progression:**`);

  // Show all sequences
  let sequences = '';
  pathway.sequences.forEach(seq => {
    const status = seq.seq <= 3 ? '👼' : '🔮';
    sequences += `${status} **Seq ${seq.seq}** - ${seq.name} (Risk: ${seq.risk}%)\n`;
  });

  embed.addFields({ name: 'Sequences', value: sequences, inline: false });
  embed.setFooter({ text: 'Each sequence brings greater power and greater risk' });

  await interaction.reply({ embeds: [embed] });
}

async function showStats(interaction) {
  const pathwayStats = getPathwayStats();
  const sequenceStats = getSequenceDistribution();

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📊 Server Pathway Statistics')
    .setDescription('Current distribution of Beyonders in this server:');

  if (pathwayStats.length > 0) {
    const pathwayText = pathwayStats.map(stat => {
      const pathway = getPathway(stat.pathway);
      return `${pathway.emoji} ${pathway.name}: **${stat.count}** Beyonders`;
    }).join('\n');

    embed.addFields({ name: 'By Pathway', value: pathwayText, inline: false });
  }

  if (sequenceStats.length > 0) {
    const sequenceText = sequenceStats.map(stat => {
      const status = stat.sequence <= 3 ? '👼 Angel' : '🔮 Beyonder';
      return `Sequence ${stat.sequence}: **${stat.count}** ${status}`;
    }).join('\n');

    embed.addFields({ name: 'By Sequence', value: sequenceText, inline: false });
  }

  const totalBeyonders = pathwayStats.reduce((sum, stat) => sum + stat.count, 0);
  embed.setFooter({ text: `Total Beyonders: ${totalBeyonders}` });
  embed.setTimestamp();

  await interaction.reply({ embeds: [embed] });
    }
                        
