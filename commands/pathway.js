import { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } from 'discord.js';
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
              { name: 'The Fool', value: 'fool' },
              { name: 'Error', value: 'error' },
              { name: 'Door', value: 'door' },
              { name: 'Visionary', value: 'visionary' },
              { name: 'The Sun', value: 'sun' },
              { name: 'Tyrant', value: 'tyrant' },
              { name: 'White Tower', value: 'white_tower' },
              { name: 'Hanged Man', value: 'hanged_man' },
              { name: 'Darkness', value: 'darkness' },
              { name: 'Death', value: 'death' },
              { name: 'Twilight Giant', value: 'twilight' },
              { name: 'Demoness', value: 'demoness' },
              { name: 'Red Priest', value: 'red_priest' },
              { name: 'The Moon', value: 'moon' },
              { name: 'Mother', value: 'mother' },
              { name: 'Abyss', value: 'abyss' },
              { name: 'Chained', value: 'chained' },
              { name: 'Justiciar', value: 'justiciar' },
              { name: 'Paragon', value: 'paragon' },
              { name: 'Black Emperor', value: 'black_emperor' },
              { name: 'The Hermit', value: 'hermit' },
              { name: 'Wheel of Fortune', value: 'wheel' }
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
              { name: 'The Fool', value: 'fool' },
              { name: 'Error', value: 'error' },
              { name: 'Door', value: 'door' },
              { name: 'Visionary', value: 'visionary' },
              { name: 'The Sun', value: 'sun' },
              { name: 'Tyrant', value: 'tyrant' },
              { name: 'White Tower', value: 'white_tower' },
              { name: 'Hanged Man', value: 'hanged_man' },
              { name: 'Darkness', value: 'darkness' },
              { name: 'Death', value: 'death' },
              { name: 'Twilight Giant', value: 'twilight' },
              { name: 'Demoness', value: 'demoness' },
              { name: 'Red Priest', value: 'red_priest' },
              { name: 'The Moon', value: 'moon' },
              { name: 'Mother', value: 'mother' },
              { name: 'Abyss', value: 'abyss' },
              { name: 'Chained', value: 'chained' },
              { name: 'Justiciar', value: 'justiciar' },
              { name: 'Paragon', value: 'paragon' },
              { name: 'Black Emperor', value: 'black_emperor' },
              { name: 'The Hermit', value: 'hermit' },
              { name: 'Wheel of Fortune', value: 'wheel' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('View all 22 pathways')),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

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
      await interaction.reply({
        content: '❌ An error occurred while processing your request.',
        ephemeral: true
      });
    }
  }
};

async function handleSelect(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const pathwayId = interaction.options.getString('pathway');
  const pathway = PATHWAYS[pathwayId];

  if (!pathway) {
    await interaction.editReply({ content: '❌ Invalid pathway selected.' });
    return;
  }

  // Check if user already has a pathway
  const existingUser = await getUser(interaction.user.id);
  
  if (existingUser && existingUser.pathway) {
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('⚠️ Pathway Already Selected')
      .setDescription(`You have already chosen the **${existingUser.pathway}** pathway at Sequence ${existingUser.sequence}.`)
      .addFields(
        { name: 'Current Pathway', value: existingUser.pathway, inline: true },
        { name: 'Sequence', value: existingUser.sequence.toString(), inline: true },
        { name: 'Note', value: 'Contact an admin if you need to change your pathway.', inline: false }
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
    .setColor(0xd4af37)
    .setTitle('🎭 Pathway Selected!')
    .setDescription(`You have embarked on the **${pathway.name}** pathway!`)
    .addFields(
      { name: 'Pathway', value: pathway.name, inline: true },
      { name: 'Starting Sequence', value: '9', inline: true },
      { name: 'Spiritual Points', value: '0', inline: true },
      { name: 'Description', value: pathway.description || 'A mystical path to divinity...', inline: false }
    )
    .setFooter({ text: 'Use /profile to view your progression' })
    .setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleInfo(interaction) {
  await interaction.deferReply();

  const pathwayId = interaction.options.getString('pathway');
  const pathway = PATHWAYS[pathwayId];

  if (!pathway) {
    await interaction.editReply({ content: '❌ Invalid pathway.' });
    return;
  }

  // Get pathway stats
  const stats = await getPathwayStats(pathwayId);

  const embed = new EmbedBuilder()
    .setColor(pathway.color || 0xd4af37)
    .setTitle(`🎭 ${pathway.name} Pathway`)
    .setDescription(pathway.description || 'One of the 22 pathways to divinity.')
    .addFields(
      { name: 'Sequence 9', value: pathway.sequences?.[9] || 'Initiate', inline: true },
      { name: 'Sequence 0', value: pathway.sequences?.[0] || 'True God', inline: true },
      { name: '\u200B', value: '\u200B', inline: true }
    );

  if (stats) {
    embed.addFields(
      { name: 'Total Beyonders', value: stats.totalUsers?.toString() || '0', inline: true },
      { name: 'Average Sequence', value: stats.averageSequence?.toString() || 'N/A', inline: true },
      { name: 'Total Points', value: stats.totalPoints?.toString() || '0', inline: true }
    );
  }

  embed.setFooter({ text: 'Use /pathway select to choose this pathway' });
  embed.setTimestamp();

  await interaction.editReply({ embeds: [embed] });
}

async function handleList(interaction) {
  await interaction.deferReply();

  const stats = await getServerStats();
  
  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('🎭 The 22 Pathways to Divinity')
    .setDescription('*Above the Gray Fog, twenty-two pathways lead to godhood...*')
    .setTimestamp();

  // Group pathways by category (if available) or show all
  const pathwayList = Object.entries(PATHWAYS)
    .map(([id, pathway]) => {
      const pathwayData = stats?.pathwayDistribution?.find(p => p.pathway === id);
      const count = pathwayData?.count || 0;
      return `**${pathway.name}** - ${count} beyonder${count !== 1 ? 's' : ''}`;
    })
    .join('\n');

  embed.setDescription(
    '*Above the Gray Fog, twenty-two pathways lead to godhood...*\n\n' +
    pathwayList +
    '\n\n*Use `/pathway select` to begin your journey*'
  );

  await interaction.editReply({ embeds: [embed] });
}
