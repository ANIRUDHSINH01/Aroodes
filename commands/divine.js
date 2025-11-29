// commands/divine.js
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';

const RESPONSES = [
  'The signs point to yes.',
  'Without a doubt.',
  'The stars align favorably.',
  'The gray fog reveals... yes.',
  'Outlook not so good.',
  'My sources say no.',
  'The future is clouded.',
  'Very doubtful.',
  'Reply hazy, try again.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'The Fool laughs at your question.',
  'Fate has yet to decide.',
  'The pathway ahead is unclear.'
];

export default {
  data: new SlashCommandBuilder()
    .setName('divine')
    .setDescription('Perform divination on a question')
    .addStringOption(option =>
      option.setName('question')
        .setDescription('Your question for the mirror')
        .setRequired(true)
    ),
  
  async execute(interaction) {
    const question = interaction.options.getString('question');
    const response = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
    
    const embed = new EmbedBuilder()
      .setColor(0xd4af37)
      .setTitle('🔮 Divination Result')
      .setDescription(`**Question:** ${question}\n\n**Answer:** *${response}*`)
      .setFooter({ text: 'The mirror has spoken...' })
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
};
