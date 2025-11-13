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

    try {
      if (subcommand === 'check') {
        await checkLoseControl(interaction);
      } else if (subcommand === 'history') {
        await showHistory(interaction);
      }
    } catch (error) {
      console.error('Error in lose-control command:', error);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
          content: `❌ Error: ${error.message}`,
          ephemeral: true
        });
      }
    }
  }
};

async function checkLoseControl(interaction) {
  await interaction.deferReply();

  const userData = await getUser(interaction.user.id);

  if (!userData || !userData.pathway) {
    const embed = new EmbedBuilder()
      .setColor(0xff6b6b)
      .setTitle('❌ Not a Beyonder')
      .setDescription(`
You are not a Beyonder yet!

You must have a pathway assigned before you can check for lose control.
Ask an administrator to assign you a pathway.
      `);

    return await interaction.editReply({ embeds: [embed] });
  }

  const pathway = PATHWAYS[userData.pathway.toUpperCase()];
  const seqInfo = getSequence(pathway, userData.sequence);

  // Sequence 0 (True Gods) cannot lose control
  if (userData.sequence === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xffd700)
      .setTitle('⚜️ True God Immunity')
      .setDescription(`
As a **True God** at Sequence 0, you are beyond the mortal concept of losing control.

The beyonder characteristics within you are perfectly harmonized with your spiritual body.
      `)
      .addFields({
        name: 'Your Status',
        value: `${pathway.emoji} ${pathway.name} - Sequence 0`,
        inline: false
      });

    return await interaction.editReply({ embeds: [embed] });
  }

  const risk = seqInfo.risk;
  const roll = Math.random() * 100;
  const lostControl = roll < risk;

  // Log to database
  await logLoseControl(
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
      { name: 'Risk Threshold', value: `${risk}%`, inline: true },
      { name: 'Your Roll', value: `🎲 ${roll.toFixed(2)}`, inline: true },
      { name: 'Required', value: `> ${risk.toFixed(2)}`, inline: true },
      { name: 'Result', value: lostControl ? '❌ **FAILED**' : '✅ **PASSED**', inline: true }
    )
    .setTimestamp();

  if (lostControl) {
    embed.setColor(0xff0000);
    embed.setDescription(`
⚠️ **YOU HAVE LOST CONTROL!**

\`\`\`
Your mind fragments as corruption spreads...
Madness begins to consume your consciousness...
\`\`\`

**Immediate effects:**
• Spiritual body destabilizing
• Risk of mutation increasing
• Mental corruption detected

*Seek containment from an administrator immediately!*
    `);

    embed.addFields({
      name: '💀 Total Times Lost Control',
      value: `${(userData.lose_control_count || 0) + 1} times`,
      inline: false
    });

    embed.setFooter({
      text: `Warning: Repeated loss of control may result in permanent corruption`
    });

  } else {
    embed.setColor(0x43b581);
    embed.setDescription(`
✨ **You successfully maintained control!**

\`\`\`
You suppress the chaotic characteristics within.
Your spiritual body remains stable...
\`\`\`

**Your mental defenses held strong:**
• Beyonder characteristics contained
• Spiritual body stable
• Mind clear and focused

*Remember: The higher your sequence, the greater the danger.*
    `);

    embed.setFooter({
      text: 'Stay vigilant, Beyonder. The path ahead only grows more perilous...'
    });
  }

  await interaction.editReply({ embeds: [embed] });

  // If lost control, send follow-up warning
  if (lostControl) {
    setTimeout(async () => {
      const warningEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('⚠️ LOSE CONTROL ALERT')
        .setDescription(`
${interaction.user} has **lost control** of their beyonder characteristics!

**Pathway:** ${pathway.emoji} ${pathway.name}
**Sequence:** ${userData.sequence} - ${seqInfo.name}
**Risk:** ${risk}% | **Roll:** ${roll.toFixed(2)}

*Administrators should investigate immediately.*
        `)
        .setTimestamp();

      try {
        await interaction.followUp({ embeds: [warningEmbed] });
      } catch (error) {
        console.log('Could not send follow-up warning');
      }
    }, 2000);
  }
}

async function showHistory(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const history = await getUserLoseControlHistory(interaction.user.id, 15);

  if (history.length === 0) {
    const embed = new EmbedBuilder()
      .setColor(0xd4af37)
      .setTitle('📜 No History')
      .setDescription(`
You have no lose control checks yet.

Use \`/lose-control check\` to test your stability!
      `);

    return await interaction.editReply({ embeds: [embed] });
  }

  const embed = new EmbedBuilder()
    .setColor(0xd4af37)
    .setTitle('📜 Your Lose Control History')
    .setDescription('Recent stability checks:');

  let historyText = '';
  history.forEach((entry, index) => {
    const pathway = PATHWAYS[entry.pathway.toUpperCase()] || { emoji: '❓', name: entry.pathway };
    const result = entry.lost_control ? '❌ **LOST CONTROL**' : '✅ Maintained';
    const date = new Date(entry.timestamp).toLocaleDateString();
    const time = new Date(entry.timestamp).toLocaleTimeString();

    historyText += `
**${index + 1}.** ${date} ${time}
   ${pathway.emoji} Sequence ${entry.sequence} | Risk: ${entry.risk_percentage}% | Roll: ${entry.roll_result.toFixed(2)}
   ${result}\n`;
  });

  embed.setDescription(historyText);

  const totalLost = history.filter(h => h.lost_control).length;
  const successRate = ((history.length - totalLost) / history.length * 100).toFixed(1);

  embed.addFields(
    { name: '✅ Success Rate', value: `${successRate}%`, inline: true },
    { name: '📊 Total Checks', value: `${history.length}`, inline: true },
    { name: '❌ Times Lost', value: `${totalLost}`, inline: true }
  );

  if (successRate < 50) {
    embed.setColor(0xff0000);
    embed.addFields({
      name: '⚠️ Warning',
      value: 'Your success rate is dangerously low! Seek stabilization immediately.',
      inline: false
    });
  } else if (successRate > 90) {
    embed.setColor(0x43b581);
    embed.addFields({
      name: '✨ Excellent',
      value: 'You have exceptional control over your beyonder characteristics!',
      inline: false
    });
  }

  embed.setFooter({ text: 'Remember: Each advancement increases the risk' });

  await interaction.editReply({ embeds: [embed] });
}
