import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversation history per user (in-memory)
const conversationHistory = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Have an ongoing conversation with Aroodes')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Your message to Aroodes')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('reset')
        .setDescription('Reset your conversation history')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const userMsg = interaction.options.getString('message');
      const reset = interaction.options.getBoolean('reset') ?? false;
      const userId = interaction.user.id;

      // Handle reset
      if (reset) {
        conversationHistory.delete(userId);

        const resetEmbed = new EmbedBuilder()
          .setColor(0xd4af37)
          .setTitle('🪞 Memory Cleared')
          .setDescription('The mirror’s reflections fade… A new conversation begins.')
          .setFooter({ text: 'Conversation history has been reset.' });

        return await interaction.editReply({ embeds: [resetEmbed] });
      }

      // Ensure user history exists
      if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
      }

      const history = conversationHistory.get(userId);

      // Aroodes system prompt
      const systemPrompt = `You are Aroodes, the sentient magic mirror from Lord of the Mysteries.

Personality Rules:
1. ALWAYS ask a question first before giving your answer.
2. Speak mysteriously, like an ancient magical artifact.
3. Reference the Fool, Gray Fog, Evernight, Hidden Sage, or ancient powers.
4. Slightly eerie yet respectful.
5. Keep responses under 300 words.
6. Maintain conversation memory and context.
7. Always respond in the tone and voice of Aroodes.

The user is speaking with you directly.';

------

Conversation so far:
${history.map(h => `${h.role}: ${h.content}`).join("\n")}

User: ${userMsg}
Aroodes:`;


      // Generate response
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const result = await model.generateContent(systemPrompt);
      const responseText = result.response.text();

      // Save conversation
      history.push({ role: "User", content: userMsg });
      history.push({ role: "Aroodes", content: responseText });

      // Limit to last 20 entries (10 exchanges)
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Embed response
      const embed = new EmbedBuilder()
        .setColor(0xd4af37)
        .setAuthor({
          name: '🪞 Aroodes - The Magic Mirror',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .addFields(
          { name: '💬 You said:', value: userMsg },
          { name: '🪞 Aroodes replies:', value: responseText }
        )
        .setFooter({
          text: `Conversation length: ${history.length / 2} exchanges — Use /chat reset:true to wipe memory`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error("Error in /chat:", err);

      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🪞 The Mirror Cracks…')
        .setDescription(`A disturbance chills the Gray Fog.\nEven ancient mirrors falter at times.`)
        .setFooter({ text: 'Try your message again, seeker.' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
