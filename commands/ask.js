import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUser } from '../data/database.js';
import { PATHWAYS, getSequence } from '../data/pathways.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Aroodes personality prompt
const AROODES_PERSONALITY = `You are Aroodes (Arrodes), a sentient magic mirror from Lord of the Mysteries.

Your traits:

1. QUESTIONING NATURE: Always answer with a question first.
2. MYSTERIOUS & ANCIENT: Use LOTM-style mystical lines.
3. KNOWLEDGE OF ALL PATHWAYS.
4. POLITE BUT EERIE.
5. ALWAYS relate answers to LOTM concepts.

FORMAT:
1. Ask a related question first.
2. Then answer normally.
3. End with a mystical LOTM-style warning.

Keep responses under 500 words.`;


export default {
  data: new SlashCommandBuilder()
    .setName('ask')
    .setDescription('Ask Aroodes about pathways, sequences, or mystical knowledge')
    .addStringOption(option =>
      option
        .setName('question')
        .setDescription('Your question for Aroodes')
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const question = interaction.options.getString('question');
      const userData = await getUser(interaction.user.id);

      // Build user context
      let userContext = '';
      if (userData?.pathway) {
        const pathway = PATHWAYS[userData.pathway.toUpperCase()];
        const seqInfo = getSequence(pathway, userData.sequence);

        userContext = `\n\nUser Context: This user is a Beyonder of the ${pathway.name} Pathway, Sequence ${userData.sequence} (${seqInfo.name}).`;
      } else {
        userContext = `\n\nUser Context: This user is not yet a Beyonder.`;
      }

      // Google Gemini generation
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash' // most stable + fast
      });

      const prompt = `${AROODES_PERSONALITY}${userContext}\n\nUser Question: "${question}"\n\nAroodes Response:`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // Embed
      const embed = new EmbedBuilder()
        .setColor(0xd4af37)
        .setAuthor({
          name: '🪞 Aroodes - The Magic Mirror',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setDescription(
          `**Your Question:**\n> ${question}\n\n**Aroodes Responds:**\n${text}`
        )
        .setFooter({
          text: 'The mirror reflects both truth and mystery...',
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      // Beyonder info (if any)
      if (userData?.pathway) {
        const pathway = PATHWAYS[userData.pathway.toUpperCase()];
        const seqInfo = getSequence(pathway, userData.sequence);

        embed.addFields({
          name: 'Your Beyonder Status',
          value: `${pathway.emoji} ${pathway.name} — Sequence ${userData.sequence} (${seqInfo.name})`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in /ask command:', error);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🪞 The Mirror Darkens…')
        .setDescription(
          'The mystical connection has been disrupted.\n\n' +
          '*Perhaps the Fool interferes… or the question touches taboo knowledge.*'
        )
        .setFooter({ text: 'Try again later, seeker of secrets.' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
