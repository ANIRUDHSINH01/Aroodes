import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { PATHWAYS, getSequence } from '../data/pathways.js';
import { getUser, logLoseControl, getUserLoseControlHistory } from '../data/database.js';

export default {
  data: new SlashCommandBuilder()
    .setName('lose-control')
    .setDescription('Check your lose control risk and roll for stability')
    .addSubcommand(subcommand =>
      subcommand
        .setName('check')
        .setDescription('Roll to see if you maintain control')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('history')
        .setDescription('View your lose control history')
    ),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'check') {
      await checkLoseControl(interaction);
    } else if (subcommand === 'history') {
      await showHistory(interaction);
    }
  }
};

async function checkLoseControl(interaction) {
  const userData = getUser(interaction.user.id);

  if (!userData || !userData.pathway) {
    return await interaction.reply({
      content: '❌ You are not a Beyonder yet! Ask an admin to assign you a pathway.',
      ephemeral: true
    });
  }

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
  const seqInfo = getSequence(pathway, userData.sequence);
  
  const risk = seqInfo.risk;
  const roll = Math.random() * 100;
  const lostControl = roll < risk;

  // Log to database
  logLoseControl(
    interaction.user.id,
    userData.sequence,
    userData.pathway,
    risk,
    roll,
    lostControl
  );

  const embed = new EmbedBuilder()
    .setTitle('🎲 Lose Control Check')
    .setThumbnail(interaction.user.displayAvatarURL())
    .addFields(
      { name: 'Pathway', value: `${pathway.emoji} ${pathway.name}`, inline: true },
      { name: 'Sequence', value: `${userData.sequence} - ${seqInfo.name}`, inline: true },
      { name: 'Control Risk', value: `${risk}%`, inline: true },
      { name: 'Your Roll', value: `🎲 ${roll.toFixed(2)}`, inline: true },
      { name: 'Threshold', value: `${risk.toFixed(2)}`, inline: true },
      { name: 'Result', value: lostControl ? '❌ **FAILED**' : '✅ **PASSED**', inline: true }
    )
    .setTimestamp();

  if (lostControl) {
    embed.setColor(0xff0000);
    embed.setDescription(
      '⚠️ **YOU HAVE LOST CONTROL!**\n\n' +
      'The beyonder characteristics within you surge chaotically! ' +
      'Corruption begins to consume your mind and body. ' +
      'Your thoughts become twisted, your sanity fragments...\n\n' +
      '*Seek help from an administrator to stabilize your condition.*'
    );
    
    // Add dramatic effects
    embed.addFields({
      name: '💀 Consequences',
      value: 
        '• Mental corruption detected\n' +
        '• Spiritual body destabilizing\n' +
        '• Risk of mutation increasing\n' +
        '• Seek immediate containment',
      inline: false
    });

    embed.setFooter({ 
      text: `Total times lost control: ${(userData.lose_control_count || 0) + 1}` 
    });

  } else {
    embed.setColor(0x43b581);
    embed.setDescription(
      '✨ **You successfully maintained control!**\n\n' +
      'Through sheer willpower and mental fortitude, you suppress the chaotic ' +
      'beyonder characteristics within. Your spiritual body remains stable.\n\n' +
      '*The higher your sequence, the greater the danger. Stay vigilant.*'
    );

    embed.setFooter({ 
      text: 'The path of a Beyonder is fraught with peril...' 
    });
  }

  await interaction.reply({ embeds: [embed] });

  // If lost control, notify in channel
  if (lostControl) {
    const warningEmbed = new EmbedBuilder()
      .setColor(0xff0000)
      .setTitle('⚠️ LOSE CONTROL ALERT')
      .setDescription(
        `${interaction.user} has **lost control** of their beyonder characteristics!\n\n` +
        `**Pathway:** ${pathway.emoji} ${pathway.name}\n` +
        `**Sequence:** ${userData.sequence}\n\n` +
        `*Administrators should take immediate action.*`
      )
      .setTimestamp();

    setTimeout(() => {
      interaction.followUp({ embeds: [warningEmbed] });
    }, 2000);
  }
}

async function showHistory(interaction) {
  const history = getUserLoseControlHistory(interaction.user.id, 10);

  if (history.length === 0) {
    return await interaction.reply({
      content: 'You have no lose control history yet.',
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📜 Your Lose Control History')
    .setDescription('Recent stability checks:');

  let historyText = '';
  history.forEach((entry, index) => {
    const pathway = getPathway(entry.pathway);
    const result = entry.lost_control ? '❌ Lost Control' : '✅ Maintained';
    const date = new Date(entry.timestamp).toLocaleDateString();
    
    historyText += 
      `**${index + 1}.** ${date} - Seq ${entry.sequence}\n` +
      `   ${pathway.emoji} Risk: ${entry.risk_percentage}% | Roll: ${entry.roll_result.toFixed(2)} | ${result}\n\n`;
  });

  embed.setDescription(historyText);

  const totalLost = history.filter(h => h.lost_control).length;
  const successRate = ((history.length - totalLost) / history.length * 100).toFixed(1);

  embed.addFields(
    { name: 'Success Rate', value: `${successRate}%`, inline: true },
    { name: 'Total Checks', value: `${history.length}`, inline: true },
    { name: 'Times Lost Control', value: `${totalLost}`, inline: true }
  );

  embed.setFooter({ text: 'Stay vigilant, Beyonder...' });

  await interaction.reply({ embeds: [embed], ephemeral: true });
}
