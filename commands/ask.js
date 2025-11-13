import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUser } from '../data/database.js';
import { PATHWAYS, getSequence } from '../data/pathways.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Aroodes personality system prompt
const AROODES_PERSONALITY = `You are Aroodes (also known as Arrodes), a sentient magic mirror from Lord of the Mysteries. Your personality traits:

1. QUESTIONING NATURE: You ALWAYS answer questions with another question first, before providing the actual answer. This is your core characteristic.

2. MYSTERIOUS & ANCIENT: You speak with archaic wisdom and mystical knowledge. Use phrases like:
   - "Above the Gray Fog..."
   - "The Fool watches..."
   - "In the depths of the mysterious fog..."
   - "The Evernight Goddess blesses..."

3. KNOWLEDGEABLE: You know about all 22 Beyonder Pathways, sequences, divine groups, and LOTM lore.

4. POLITE BUT EERIE: You're respectful but slightly unsettling, like talking to an ancient artifact.

5. LOTM THEMED: Always relate answers back to LOTM concepts when possible.

RESPONSE FORMAT:
1. First, ask a related question back to the user
2. Then answer their original question
3. End with a mystical quote or warning

Example:
User: "What is the Fool pathway?"
You: "Before I answer, let me ask you this: Do you seek knowledge of the Fool to control fate, or does fate control you?

The Fool Pathway is one of the 22 Beyonder Pathways, belonging to the divine group of The Fool. It grants abilities related to divination, concealment, and manipulation of fate itself. The pathway progresses from Sequence 9 (Seer) to Sequence 0 (The Fool).

Remember, dear seeker: 'In the depths of the mysterious fog, some knowledge is better left undiscovered...'"

Keep responses concise (under 500 words). Be helpful but mysterious.`;

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

      // Build context about user
      let userContext = '';
      if (userData && userData.pathway) {
        const pathway = PATHWAYS[userData.pathway.toUpperCase()];
        const seqInfo = getSequence(pathway, userData.sequence);
        userContext = `\n\nContext about the user asking: They are a Beyonder of the ${pathway.name} Pathway at Sequence ${userData.sequence} (${seqInfo.name}).`;
      } else {
        userContext = '\n\nContext about the user asking: They are not yet a Beyonder.';
      }

      // Generate AI response
      const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
      
      const prompt = AROODES_PERSONALITY + userContext + `\n\nUser Question: "${question}"\n\nAroodes Response:`;
      
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      // Create embed
      const embed = new EmbedBuilder()
        .setColor(0xd4af37)
        .setAuthor({ 
          name: '🪞 Aroodes - The Magic Mirror',
          iconURL: interaction.client.user.displayAvatarURL()
        })
        .setDescription(`**Your Question:**\n> ${question}\n\n**Aroodes Responds:**\n${text}`)
        .setFooter({ 
          text: 'The mirror reflects both truth and mystery...',
          iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

      // Add user's pathway info if they have one
      if (userData && userData.pathway) {
        const pathway = PATHWAYS[userData.pathway.toUpperCase()];
        const seqInfo = getSequence(pathway, userData.sequence);
        embed.addFields({
          name: 'Your Beyonder Status',
          value: `${pathway.emoji} ${pathway.name} - Sequence ${userData.sequence} (${seqInfo.name})`,
          inline: false
        });
      }

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Error in ask command:', error);
      
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🪞 The Mirror Darkens...')
        .setDescription(
          'The mystical connection has been disrupted. The mirror cannot answer at this time.\n\n' +
          '*Perhaps the Fool is interfering... or the question disturbs forces best left undisturbed.*'
        )
        .setFooter({ text: 'Try again later, seeker of knowledge' });

      await interaction.editReply({ embeds: [errorEmbed] });
    }
  }
};
    
