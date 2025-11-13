import axios from 'axios';

export async function updateMetadata(userId, accessToken, metadata) {
  try {
    const response = await axios.put(
      `https://discord.com/api/v10/users/@me/applications/${process.env.DISCORD_CLIENT_ID}/role-connection`,
      {
        platform_name: '🌙 Aroodes - LOTM Pathway System',
        platform_username: userId,
        metadata
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error updating metadata:', error.response?.data || error.message);
    throw error;
  }
}
