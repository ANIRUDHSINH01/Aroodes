import { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } from 'discord.js';
import { 
  deleteUser, 
  resetUserPathway, 
  forceSetSequence, 
  givePoints,
  setUserPathway,
  getUserProfile,
  getUser
} from '../data/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('admin')
    .setDescription('Admin commands for managing beyonders')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(subcommand =>
      subcommand
        .setName('setpathway')
        .setDescription('Force set a user pathway')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('pathway')
            .setDescription('Pathway name')
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
        .setName('setsequence')
        .setDescription('Force set sequence level')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('sequence')
            .setDescription('Sequence (0-9)')
            .setRequired(true)
            .setMinValue(0)
            .setMaxValue(9)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('givepoints')
        .setDescription('Give spiritual points')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))
        .addIntegerOption(option =>
          option.setName('points')
            .setDescription('Amount of points')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('reset')
        .setDescription('Reset user pathway')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('delete')
        .setDescription('Delete user from database')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('View user profile (admin)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('Target user')
            .setRequired(true))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');

    try {
      await interaction.deferReply({ ephemeral: true });

      switch(subcommand) {
        case 'setpathway': {
          const pathway = interaction.options.getString('pathway');
          await setUserPathway(
            targetUser.id, 
            targetUser.username, 
            pathway,
            targetUser.discriminator,
            targetUser.avatar
          );
          
          const embed = new EmbedBuilder()
            .setColor(0xd4af37)
            .setTitle('✅ Pathway Set')
            .setDescription(`Successfully set pathway for ${targetUser.username}`)
            .addFields(
              { name: 'User', value: targetUser.username, inline: true },
              { name: 'Pathway', value: pathway.charAt(0).toUpperCase() + pathway.slice(1), inline: true },
              { name: 'Sequence', value: '9', inline: true }
            )
            .setTimestamp();
          
          await interaction.editReply({ embeds: [embed] });
          break;
        }

        case 'setsequence': {
          const sequence = interaction.options.getInteger('sequence');
          const user = await forceSetSequence(targetUser.id, sequence);
          
          if (user) {
            const embed = new EmbedBuilder()
              .setColor(0xd4af37)
              .setTitle('✅ Sequence Updated')
              .setDescription(`Successfully set sequence for ${targetUser.username}`)
              .addFields(
                { name: 'User', value: targetUser.username, inline: true },
                { name: 'New Sequence', value: sequence.toString(), inline: true },
                { name: 'Rank', value: user.beyonder_rank, inline: true }
              )
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: '❌ User not found in database' });
          }
          break;
        }

        case 'givepoints': {
          const points = interaction.options.getInteger('points');
          const user = await givePoints(targetUser.id, points);
          
          if (user) {
            const embed = new EmbedBuilder()
              .setColor(0xd4af37)
              .setTitle('✅ Points Given')
              .setDescription(`Successfully gave points to ${targetUser.username}`)
              .addFields(
                { name: 'User', value: targetUser.username, inline: true },
                { name: 'Points Given', value: points.toString(), inline: true },
                { name: 'Total Points', value: user.spiritual_points.toString(), inline: true }
              )
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: '❌ User not found in database' });
          }
          break;
        }

        case 'reset': {
          const user = await resetUserPathway(targetUser.id);
          
          if (user) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('🔄 Pathway Reset')
              .setDescription(`Successfully reset pathway for ${targetUser.username}`)
              .addFields(
                { name: 'User', value: targetUser.username, inline: true },
                { name: 'Status', value: 'All progress cleared', inline: true }
              )
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: '❌ User not found in database' });
          }
          break;
        }

        case 'delete': {
          const deleted = await deleteUser(targetUser.id);
          
          if (deleted) {
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setTitle('🗑️ User Deleted')
              .setDescription(`Successfully deleted ${targetUser.username} from database`)
              .addFields(
                { name: 'User', value: targetUser.username, inline: true },
                { name: 'Status', value: 'Permanently removed', inline: true }
              )
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: '❌ User not found in database' });
          }
          break;
        }

        case 'view': {
          const userData = await getUserProfile(targetUser.id);
          
          if (userData) {
            const embed = new EmbedBuilder()
              .setColor(0xd4af37)
              .setTitle(`📊 ${userData.username}'s Profile`)
              .setThumbnail(targetUser.displayAvatarURL())
              .addFields(
                { name: 'Pathway', value: userData.pathway || 'None', inline: true },
                { name: 'Sequence', value: userData.sequence?.toString() || 'N/A', inline: true },
                { name: 'Rank', value: userData.beyonder_rank || 'N/A', inline: true },
                { name: 'Spiritual Points', value: userData.spiritual_points?.toString() || '0', inline: true },
                { name: 'Advancements', value: userData.total_advancements?.toString() || '0', inline: true },
                { name: 'Days Active', value: userData.days_active?.toString() || '0', inline: true },
                { name: 'Messages', value: userData.total_messages?.toString() || '0', inline: true },
                { name: 'Rituals', value: userData.rituals_completed?.toString() || '0', inline: true },
                { name: 'Control Risk', value: `${userData.lose_control_risk || 5}%`, inline: true }
              )
              .setFooter({ text: `Last Active: ${new Date(userData.last_active).toLocaleString()}` })
              .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: '❌ User not found in database' });
          }
          break;
        }

        default:
          await interaction.editReply({ content: '❌ Unknown subcommand' });
      }
    } catch (error) {
      console.error('Admin command error:', error);
      
      try {
        await interaction.editReply({ 
          content: '❌ Command failed: ' + error.message 
        });
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    }
  }
};
