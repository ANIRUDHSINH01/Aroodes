import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getUser, setUserPathway, getPathwayStats, getServerStats } from '../data/database.js';
import { PATHWAYS } from '../data/pathways.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pathway')
    .setDescription('Select your beyonder pathway')
    .addSubcommand(subcommand =>
      subcommand
        .setName('select')
        .setDescription('Choose your pathway to divinity')
        .addStringOption(option =>
          option.setName('pathway')
            .setDescription('Choose your pathway')
            .setRequired(true)
            .addChoices(
              { name: '🎭 The Fool', value: 'fool' },
              { name: '⚠️ Error', value: 'error' },
              { name: '🚪 Door', value: 'door' },
              { name: '👁️ Visionary', value: 'visionary' },
              { name: '☀️ The Sun', value: 'sun' },
              { name: '⚡ Tyrant', value: 'tyrant' },
              { name: '🗼 White Tower', value: 'white_tower' },
              { name: '🎪 Hanged Man', value: 'hanged_man' },
              { name: '🌑 Darkness', value: 'darkness' },
              { name: '💀 Death', value: 'death' },
              { name: '⚔️ Twilight Giant', value: 'twilight' },
              { name: '🌹 Demoness', value: 'demoness' },
              { name: '🔥 Red Priest', value: 'red_priest' },
              { name: '🌙 The Moon', value: 'moon' },
              { name: '🌸 Mother', value: 'mother' },
              { name: '🕳️ Abyss', value: 'abyss' },
              { name: '⛓️ Chained', value: 'chained' },
              { name: '⚖️ Justiciar', value: 'justiciar' },
              { name: '⚙️ Paragon', value: 'paragon' },
              { name: '👑 Black Emperor', value: 'black_emperor' },
              { name: '📚 The Hermit', value: 'hermit' },
              { name: '🎰 Wheel of Fortune', value: 'wheel' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('info')
        .setDescription('View information about a pathway')
        .addStringOption(option =>
          option.setName('pathway')
            .setDescription('Pathway to view')
            .setRequired(true)
            .addChoices(
              { name: '🎭 The Fool', value: 'fool' },
              { name: '⚠️ Error', value: 'error' },
              { name: '🚪 Door', value: 'door' },
              { name: '👁️ Visionary', value: 'visionary' },
              { name: '☀️ The Sun', value: 'sun' },
              { name: '⚡ Tyrant', value: 'tyrant' },
              { name: '🗼 White Tower', value: 'white_tower' },
              { name: '🎪 Hanged Man', value: 'hanged_man' },
              { name: '🌑 Darkness', value: 'darkness' },
              { name: '💀 Death', value: 'death' },
              { name: '⚔️ Twilight Giant', value: 'twilight' },
              { name: '🌹 Demoness', value: 'demoness' },
              { name: '🔥 Red Priest', value: 'red_priest' },
              { name: '🌙 The Moon', value: 'moon' },
              { name: '🌸 Mother', value: 'mother' },
              { name: '🕳️ Abyss', value: 'abyss' },
              { name: '⛓️ Chained', value: 'chained' },
              { name: '⚖️ Justiciar', value: 'justiciar' },
              { name: '⚙️ Paragon', value: 'paragon' },
              { name: '👑 Black Emperor', value: 'black_emperor' },
              { name: '📚 The Hermit', value: 'hermit' },
              { name: '🎰 Wheel of Fortune', value: 'wheel' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('View all 22 pathways')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    // Defer immediately to prevent timeout
    await interaction.deferReply({ ephemeral: subcommand === 'select' });

    try {
      if (subcommand === 'select') {
        await handleSelect(interaction);
      } else if (subcommand === 'info') {
        await handleInfo(interaction);
      } else if (subcommand === 'list') {
        await handleList(interaction);
      }
    } catch (error) {
      console.error('Pathway command error:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('❌ Error')
        .setDescription('An error occurred while processing your request.')
        .setFooter({ text: 'Please try again later' });

      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [errorEmbed] });
        } else {
          await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
        }
      } catch (replyError) {
        console.error('Could not send error message:', replyError.message);
      }
    }
  }
};

async function handleSelect(interaction) {
  const pathwayId = interaction.options.getString('pathway');
  const pathway = PATHWAYS[pathwayId.toUpperCase()];

  if (!pathway) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription('❌ Invalid pathway selected.');
    
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Check if user already has a pathway
  const existingUser = await getUser(interaction.user.id);
  
  if (existingUser && existingUser.pathway) {
    const existingPathway = PATHWAYS[existingUser.pathway.toUpperCase()];
    
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('⚠️ Pathway Already Selected')
      .setDescription(`You have already chosen the **${existingPathway?.name || existingUser.pathway}** pathway at Sequence ${existingUser.sequence}.`)
      .addFields(
        { name: 'Current Pathway', value: existingPathway?.name || existingUser.pathway, inline: true },
        { name: 'Sequence', value: existingUser.sequence.toString(), inline: true },
        { name: '💡 Note', value: 'Contact an admin if you need to change your pathway.', inline: false }
      )
      .setFooter({ text: 'You cannot change pathways once selected' })
      .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Set pathway
  await setUserPathway(
    interaction.user.id,
    interaction.user.username,
    pathwayId,
    interaction.user.discriminator,
    interaction.user.avatar
  );

  const embed = new EmbedBuilder()
    .setColor(pathway.color || 0xd4af37)
    .setTitle(`${pathway.emoji || '🎭'} Pathway Selected!`)
    .setDescription(`You have embarked on the **${pathway.name}** pathway!\n\n*${pathway.description || 'A mystical path to divinity...'}*`)
    .addFields(
      { name: '📖 Pathway', value: pathway.name, inline: true },
      { name: '🔢 Starting Sequence', value: '9', inline: true },
      { name: '✨ Spiritual Points', value: '0', inline: true }
    )
    .setFooter({ text: 'Use /profile to view your progression' })
    .setTimestamp();

  if (pathway.thumbnail) {
    embed.setThumbnail(pathway.thumbnail);
  }

  await interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction) {
  const pathwayId = interaction.options.getString('pathway');
  const pathway = PATHWAYS[pathwayId.toUpperCase()];

  if (!pathway) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription('❌ Invalid pathway.');
    
    await interaction.editReply({ embeds: [embed] });
    return;
  }

  // Get pathway stats (with timeout protection)
  let stats = null;
  try {
    stats = await Promise.race([
      getPathwayStats(pathwayId),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
  } catch (error) {
    console.warn('Stats query timeout or error:', error.message);
  }

  const embed = new EmbedBuilder()
    .setColor(pathway.color || 0xd4af37)
    .setTitle(`${pathway.emoji || '🎭'} ${pathway.name} Pathway`)
    .setDescription(pathway.description || 'One of the 22 pathways to divinity.')
    .addFields(
      { name: '📊 Sequence 9', value: pathway.sequences?.[9] || 'Initiate', inline: true },
      { name: '👑 Sequence 0', value: pathway.sequences?.[0] || 'True God', inline: true },
      { name: '\u200B', value: '\u200B', inline: true }
    );

  if (stats) {
    embed.addFields(
      { name: '👥 Total Beyonders', value: stats.totalUsers?.toString() || '0', inline: true },
      { name: '📈 Average Sequence', value: stats.averageSequence?.toFixed(1) || 'N/A', inline: true },
      { name: '✨ Total Points', value: stats.totalPoints?.toString() || '0', inline: true }
    );
  }

  if (pathway.thumbnail) {
    embed.setThumbnail(pathway.thumbnail);
  }

  embed.setFooter({ text: 'Use /pathway select to choose this pathway' });
  embed.setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleList(interaction) {
  // Get server stats (with timeout protection)
  let stats = null;
  try {
    stats = await Promise.race([
      getServerStats(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
    ]);
  } catch (error) {
    console.warn('Stats query timeout or error:', error.message);
  }
  
  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('🎭 The 22 Pathways to Divinity')
    .setDescription('*Above the Gray Fog, twenty-two pathways lead to godhood...*')
    .setTimestamp();

  // Group pathways into chunks to avoid hitting embed limits
  const pathwayEntries = Object.entries(PATHWAYS);
  const pathwayFields = [];

  for (let i = 0; i < pathwayEntries.length; i += 11) {
    const chunk = pathwayEntries.slice(i, i + 11);
    const pathwayList = chunk
      .map(([id, pathway]) => {
        const pathwayData = stats?.pathwayDistribution?.find(p => p.pathway === id.toLowerCase());
        const count = pathwayData?.count || 0;
        return `${pathway.emoji || '🎭'} **${pathway.name}** - ${count} beyonder${count !== 1 ? 's' : ''}`;
      })
      .join('\n');

    pathwayFields.push({
      name: i === 0 ? '📖 Part 1' : '📖 Part 2',
      value: pathwayList,
      inline: false
    });
  }

  embed.addFields(...pathwayFields);
  embed.setFooter({ text: 'Use /pathway select to begin your journey' });

  await interaction.editReply({ embeds: [embed] });
}
