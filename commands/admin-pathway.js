import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { PATHWAYS, getPathway, getSequence, getAllPathwayNames } from '../data/pathways.js';
import { 
  getUser, 
  setUserPathway, 
  updateUserSequence, 
  deleteUser, 
  getAllUsers,
  getAdvancementHistory 
} from '../data/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin-pathway')
    .setDescription('Admin commands for pathway management')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('advance')
        .setDescription('Advance a user to next sequence')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to advance')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-sequence')
        .setDescription('Set user to specific sequence')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to modify')
            .setRequired(true)
        )
        .addIntegerOption(option =>
          option
            .setName('sequence')
            .setDescription('Sequence level (0-9)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(9)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('set-pathway')
        .setDescription('Assign pathway to user')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to assign')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('pathway')
            .setDescription('Choose pathway')
            .setRequired(true)
            .addChoices(
              ...getAllPathwayNames().map(p => ({
                name: p.display,
                value: p.name
              }))
            )
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View user pathway info')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to view')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset user pathway progress')
        .addUserOption(option =>
          option
            .setName('user')
            .setDescription('User to reset')
            .setRequired(true)
        )
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all beyonders in server')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    switch(subcommand) {
      case 'advance':
        await advanceUser(interaction);
        break;
      case 'set-sequence':
        await setSequence(interaction);
        break;
      case 'set-pathway':
        await assignPathway(interaction);
        break;
      case 'view':
        await viewUser(interaction);
        break;
      case 'reset':
        await resetUser(interaction);
        break;
      case 'list':
        await listBeyonders(interaction);
        break;
    }
  }
};

async function advanceUser(interaction) {
  const targetUser = interaction.options.getUser('user');
  const userData = getUser(targetUser.id);

  if (!userData || !userData.pathway) {
    return await interaction.reply({
      content: `❌ ${targetUser} doesn't have a pathway assigned yet! Use \`/admin-pathway set-pathway\` first.`,
      ephemeral: true
    });
  }

  if (userData.sequence === 0) {
    return await interaction.reply({
      content: `❌ ${targetUser} is already at Sequence 0 (True God)!`,
      ephemeral: true
    });
  }

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
  const oldSequence = userData.sequence;
  const newSequence = oldSequence - 1;

  updateUserSequence(targetUser.id, newSequence, interaction.user.id);

  const oldSeqInfo = getSequence(pathway, oldSequence);
  const newSeqInfo = getSequence(pathway, newSequence);

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('✨ Sequence Advancement!')
    .setDescription(`${targetUser} has been advanced in the ${pathway.emoji} **${pathway.name}** pathway!`)
    .addFields(
      { 
        name: 'Previous Sequence', 
        value: `Sequence ${oldSequence} - ${oldSeqInfo.name}`, 
        inline: true 
      },
      { 
        name: 'New Sequence', 
        value: `**Sequence ${newSequence} - ${newSeqInfo.name}**`, 
        inline: true 
      },
      { 
        name: 'Advanced By', 
        value: interaction.user.toString(), 
        inline: false 
      }
    )
    .setFooter({ text: 'Above the Gray Fog' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  // Notify user via DM
  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xd4af37)
      .setTitle('🌙 You Have Advanced!')
      .setDescription(
        `Congratulations! You've been promoted to **Sequence ${newSequence} - ${newSeqInfo.name}** ` +
        `in the ${pathway.emoji} ${pathway.name} pathway!\n\n` +
        `**New Lose Control Risk:** ${newSeqInfo.risk}%`
      )
      .setFooter({ text: `Promoted by ${interaction.user.tag}` })
      .setTimestamp();

    await targetUser.send({ embeds: [dmEmbed] });
  } catch (error) {
    console.log(`Couldn't DM ${targetUser.tag}`);
  }
}

async function setSequence(interaction) {
  const targetUser = interaction.options.getUser('user');
  const sequence = interaction.options.getInteger('sequence');
  
  let userData = getUser(targetUser.id);

  if (!userData || !userData.pathway) {
    return await interaction.reply({
      content: `❌ ${targetUser} doesn't have a pathway assigned. Use \`/admin-pathway set-pathway\` first.`,
      ephemeral: true
    });
  }

  updateUserSequence(targetUser.id, sequence, interaction.user.id);
  userData = getUser(targetUser.id);

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
  const seqInfo = getSequence(pathway, sequence);

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('⚙️ Sequence Modified')
    .setDescription(`${targetUser}'s sequence has been set to **Sequence ${sequence} - ${seqInfo.name}**`)
    .addFields(
      { name: 'Pathway', value: `${pathway.emoji} ${pathway.name}`, inline: true },
      { name: 'Lose Control Risk', value: `${seqInfo.risk}%`, inline: true },
      { name: 'Modified By', value: interaction.user.toString(), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function assignPathway(interaction) {
  const targetUser = interaction.options.getUser('user');
  const pathwayName = interaction.options.getString('pathway');

  setUserPathway(targetUser.id, targetUser.username, pathwayName, interaction.user.id);
  const userData = getUser(targetUser.id);

  const pathway = PATHWAYS[pathwayName.toUpperCase()];
  const seqInfo = getSequence(pathway, userData.sequence);

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('🎭 Pathway Assigned!')
    .setDescription(
      `${targetUser} has been assigned to the **${pathway.emoji} ${pathway.name} Pathway**\n\n` +
      `Starting at **Sequence ${userData.sequence} - ${seqInfo.name}**`
    )
    .addFields(
      { name: 'Divine Group', value: pathway.group, inline: true },
      { name: 'Initial Risk', value: `${seqInfo.risk}%`, inline: true },
      { name: 'Assigned By', value: interaction.user.toString(), inline: true }
    )
    .setFooter({ text: 'The journey begins...' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });

  // Notify user
  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0xd4af37)
      .setTitle('🌙 Welcome, Beyonder!')
      .setDescription(
        `You have been assigned to the **${pathway.emoji} ${pathway.name} Pathway** ` +
        `at **Sequence ${userData.sequence} - ${seqInfo.name}**!\n\n` +
        `Your mystical journey begins now. Use \`/pathway status\` to check your progress.`
      )
      .setFooter({ text: `Assigned by ${interaction.user.tag}` });

    await targetUser.send({ embeds: [dmEmbed] });
  } catch (error) {
    console.log(`Couldn't DM ${targetUser.tag}`);
  }
}

async function viewUser(interaction) {
  const targetUser = interaction.options.getUser('user');
  const userData = getUser(targetUser.id);

  if (!userData || !userData.pathway) {
    return await interaction.reply({
      content: `${targetUser} is not a Beyonder yet.`,
      ephemeral: true
    });
  }

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
  const seqInfo = getSequence(pathway, userData.sequence);
  const history = getAdvancementHistory(targetUser.id, 5);

  const daysSince = userData.assigned_at 
    ? Math.floor((Date.now() - new Date(userData.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle(`🌙 ${targetUser.username}'s Pathway Info`)
    .setThumbnail(targetUser.displayAvatarURL())
    .addFields(
      { name: 'Pathway', value: `${pathway.emoji} ${pathway.name}`, inline: true },
      { name: 'Sequence', value: `**${userData.sequence} - ${seqInfo.name}**`, inline: true },
      { name: 'Status', value: userData.sequence <= 3 ? '👼 Angel' : '🔮 Beyonder', inline: true },
      { name: 'Lose Control Risk', value: `${seqInfo.risk}%`, inline: true },
      { name: 'Times Lost Control', value: `${userData.lose_control_count || 0}`, inline: true },
      { name: 'Days as Beyonder', value: `${daysSince} days`, inline: true }
    );

  if (history.length > 0) {
    const historyText = history.map(h => 
      `Seq ${h.from_sequence} → ${h.to_sequence} (${new Date(h.timestamp).toLocaleDateString()})`
    ).join('\n');
    embed.addFields({ name: 'Recent Advancements', value: historyText || 'None', inline: false });
  }

  embed.setFooter({ text: 'Pathway Information' }).setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function resetUser(interaction) {
  const targetUser = interaction.options.getUser('user');
  
  const userData = getUser(targetUser.id);
  if (!userData) {
    return await interaction.reply({
      content: `${targetUser} has no pathway data to reset.`,
      ephemeral: true
    });
  }

  deleteUser(targetUser.id);

  const embed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle('🔄 Pathway Reset')
    .setDescription(`${targetUser}'s pathway progress has been completely reset.`)
    .addFields(
      { name: 'Reset By', value: interaction.user.toString(), inline: true }
    )
    .setTimestamp();

  await interaction.reply({ embeds: [embed] });
}

async function listBeyonders(interaction) {
  const allUsers = getAllUsers();

  if (allUsers.length === 0) {
    return await interaction.reply({
      content: 'No Beyonders in this server yet.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📜 Server Beyonders Registry')
    .setFooter({ text: `Total Beyonders: ${allUsers.length}` })
    .setTimestamp();

  let description = '';
  for (const user of allUsers.slice(0, 25)) {
    const pathway = PATHWAYS[user.pathway.toUpperCase()];
    const status = user.sequence <= 3 ? '👼' : '🔮';
    const seqInfo = getSequence(pathway, user.sequence);
    description += `${status} <@${user.user_id}> - ${pathway.emoji} ${pathway.name} Seq ${user.sequence} (${seqInfo.name})\n`;
  }

  embed.setDescription(description || 'No Beyonders yet.');

  await interaction.reply({ embeds: [embed] });
                                        }
