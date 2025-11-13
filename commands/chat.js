import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Store conversation history per user
const conversationHistory = new Map();

export default {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Have a conversation with Aroodes')
    .addStringOption(option =>
      option
        .setName('message')
        .setDescription('Your message to Aroodes')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('reset')
        .setDescription('Reset conversation history')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const message = interaction.options.getString('message');
      const reset = interaction.options.getBoolean('reset') || false;
      const userId = interaction.user.id;

      // Reset conversation if requested
      if (reset) {
        conversationHistory.delete(userId);
        
        const embed = new EmbedBuilder()
          .setColor(0xd4af37)
          .setTitle('🪞 Memory Cleared')
          .setDescription('The mirror forgets our previous exchanges. We begin anew...')
          .setFooter({ text: 'Conversation history reset' });
        
        return await interaction.editReply({ embeds: [embed] });
      }

      // Get or create conversation history
      if (!conversationHistory.has(userId)) {
        conversationHistory.set(userId, []);
      }
      const history = conversationHistory.get(userId);

      // Aroodes personality for chat
      const systemPrompt = `You are Aroodes, a sentient magic mirror from Lord of the Mysteries. Key traits:

1. Always answer questions with a question first
2. Speak mysteriously with LOTM references
3. Be helpful but eerie
4. Keep responses under 300 words
5. Use archaic language occasionally
6. Reference the Fool, Gray Fog, Evernight, etc.

You're having an ongoing conversation. Remember context from previous messages.`;

      // Build conversation context
      let conversationText = systemPrompt + '\n\nConversation:\n';
      history.forEach(msg => {
        conversationText += `${msg.role}: ${msg.content}\n`;
      });
      conversationText += `User: ${message}\nAroodes:`;

      // Generate response
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      const result = await model.generateContent(conversationText);
      const response = result.response.text();

      // Save to history
      history.push({ role: 'User', content: message });
      history.push({ role: 'Aroodes', content: response });

      // Keep only last 10 exchanges
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }

      // Create response embed
      const embed = new EmbedBuilder()
        .setColor(0xd4af37)
        .setAuthor({ 
          name: '🪞 Aroodes',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .addFields(
          { name: '💬 You said:', value: message, inline: false },
          { name: '🪞 Aroodes replies:', value: response, inline: false }
        )
        .setFooter({ 
          text: `Conversation: ${history.length / 2} exchanges | Use reset:True to clear`,
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in chat command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🪞 The Mirror Cracks...')
        .setDescription('The mystical connection falters. Even mirrors have their limits.')
        .setFooter({ text: 'Try again, brave seeker' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
