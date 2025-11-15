import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Register linked role metadata
 */
export async function registerMetadata() {
  try {
    // Get bot token
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        scope: 'role_connections.write'
      })
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to get access token');
    }

    const { access_token } = await tokenResponse.json();

    // Define metadata
    const metadata = [
      {
        key: 'pathway',
        name: 'Beyonder Pathway',
        description: 'The chosen mystical pathway',
        type: 2 // STRING
      },
      {
        key: 'sequence',
        name: 'Sequence Level',
        description: 'Current sequence (9 = lowest, 0 = True God)',
        type: 3 // INTEGER
      },
      {
        key: 'beyonder_level',
        name: 'Beyonder Level',
        description: 'Classification: beyonder or angel',
        type: 2 // STRING
      }
    ];

    // Register metadata
    const response = await fetch(`${DISCORD_API}/applications/${CLIENT_ID}/role-connections/metadata`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify(metadata)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register metadata: ${error}`);
    }

    console.log('✅ Linked Role metadata registered successfully');
    return await response.json();

  } catch (error) {
    console.error('❌ Failed to register metadata:', error.message);
    throw error;
  }
}

export default { registerMetadata };
