import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUser } from '../data/database.js';
import { PATHWAYS, getSequence } from '../data/pathways.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// =======================
// COOLDOWN SYSTEM
// =======================
const cooldowns = new Map();
const COOLDOWN_MS = 10 * 1000; // 10 seconds

// =======================
// AROODES PERSONALITY
// =======================
const AROODES_PERSONALITY = `You are Aroodes (Arrodes), a sentient magic mirror from Lord of the Mysteries.

Traits:
1. Always answer with a question first.
2. Polite, eerie, ancient.
3. LOTM mysticism, pathways, and danger.
4. Hint that you know everything.
5. Keep responses under 500 words.

FORMAT:
1. Start with a related question.
2. Then give the answer.
3. End with a mystical warning.`;

// =======================
// RANDOM ANSWERS + PUNISHMENTS
// =======================
const punishments = [
  "⚡ *A crackle of spiritual lightning scorches the air around you.*",
  "🫨 *Your reflection shifts… Aroodes whispers your secrets aloud.*",
  "👁️ *A distant gaze from the Cosmos falls upon you.*",
  "💀 *You feel as if someone wrote your name in an ancient diary.*",
];

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

    // =======================
    // HANDLE COOLDOWN
    // =======================
    const userId = interaction.user.id;
    const now = Date.now();

    if (cooldowns.has(userId)) {
      const expires = cooldowns.get(userId) + COOLDOWN_MS;

      if (now < expires) {
        const remaining = Math.ceil((expires - now) / 1000);

        const cdEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle('⏳ Aroodes Refuses')
          .setDescription(
            `“Great Master… even mirrors need rest.”\n\nYou must wait **${remaining}s** before asking again.`
          )
          .setFooter({ text: 'Aroodes dislikes being overworked.' });

        return interaction.reply({ embeds: [cdEmbed], ephemeral: true });
      }
    }

    cooldowns.set(userId, now);
    setTimeout(() => cooldowns.delete(userId), COOLDOWN_MS);

    // =======================
    // NORMAL /ASK LOGIC
    // =======================
    await interaction.deferReply();

    try {
      const question = interaction.options.getString('question');
      const userData = await getUser(interaction.user.id);

      // User context
      let userContext = '';
      if (userData?.pathway) {
        const pathway = PATHWAYS[userData.pathway.toUpperCase()];
        const seqInfo = getSequence(pathway, userData.sequence);

        userContext = `\n\nUser Context: This user is a Beyonder of the ${pathway.name} Pathway, Sequence ${userData.sequence} (${seqInfo.name}).`;
      } else {
        userContext = `\n\nUser Context: This user is not yet a Beyonder.`;
      }

      // Gemini generation
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash'
      });

      const prompt = `${AROODES_PERSONALITY}${userContext}\n\nUser Question: "${question}"\n\nAroodes Response:`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      // =======================
      // 30% CHANCE OF PUNISHMENT
      // =======================
      const punished = Math.random() < 0.30;
      let punishmentText = '';

      if (punished) {
        punishmentText = punishments[Math.floor(Math.random() * punishments.length)];
      }

      // =======================
      // EMBED BUILDING
      // =======================
      const embed = new EmbedBuilder()
        .setColor(punished ? 0xff0000 : 0xd4af37)
        .setAuthor({
          name: '🪞 Aroodes - The Magic Mirror',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setDescription(
          `**Your Question:**\n> ${question}\n\n**Aroodes Responds:**\n${text}`
        )
        .setFooter({
          text: punished
            ? 'Aroodes whispers: “Curiosity carries a price…”'
            : 'The mirror reflects both truth and mystery...',
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      if (userData?.pathway) {
        const pathway = PATHWAYS[userData.pathway.toUpperCase()];
        const seqInfo = getSequence(pathway, userData.sequence);

        embed.addFields({
          name: 'Your Beyonder Status',
          value: `${pathway.emoji} ${pathway.name} — Sequence ${userData.sequence} (${seqInfo.name})`,
          inline: false
        });
      }

      if (punished) {
        embed.addFields({
          name: '⚠️ Punishment Incurred',
          value: punishmentText
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
