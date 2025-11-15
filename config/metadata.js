import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Register enhanced linked role metadata with more fields
 */
export async function registerMetadata() {
  try {
    // Get bot token
    const tokenResponse = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
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

    // Enhanced metadata with multiple fields
    const metadata = [
      {
        key: 'pathway',
        name: 'Beyonder Pathway',
        description: 'Your chosen mystical pathway',
        type: 2 // STRING
      },
      {
        key: 'sequence',
        name: 'Sequence Level',
        description: 'Your current sequence (0-9)',
        type: 3 // INTEGER
      },
      {
        key: 'spiritual_points',
        name: 'Spiritual Points',
        description: 'Total spiritual accumulation',
        type: 3 // INTEGER
      },
      {
        key: 'beyonder_rank',
        name: 'Beyonder Rank',
        description: 'Your classification level',
        type: 2 // STRING (beyonder/angel/true_god)
      },
      {
        key: 'total_advancements',
        name: 'Advancements',
        description: 'Number of sequence advancements',
        type: 3 // INTEGER
      },
      {
        key: 'days_active',
        name: 'Days as Beyonder',
        description: 'Days since pathway selection',
        type: 3 // INTEGER
      },
      {
        key: 'lose_control_risk',
        name: 'Control Stability',
        description: 'Risk percentage of losing control',
        type: 3 // INTEGER
      },
      {
        key: 'pathway_affinity',
        name: 'Pathway Affinity',
        description: 'Compatibility with chosen pathway',
        type: 3 // INTEGER (0-100)
      }
    ];

    // Register metadata
    const response = await fetch(
      `${DISCORD_API}/applications/${CLIENT_ID}/role-connections/metadata`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${access_token}`
        },
        body: JSON.stringify(metadata)
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to register metadata: ${error}`);
    }

    console.log('✅ Enhanced Linked Role metadata registered');
    console.log('   - Pathway name');
    console.log('   - Sequence level');
    console.log('   - Spiritual points');
    console.log('   - Beyonder rank');
    console.log('   - Total advancements');
    console.log('   - Days active');
    console.log('   - Control stability');
    console.log('   - Pathway affinity');

    return await response.json();

  } catch (error) {
    console.error('❌ Failed to register metadata:', error.message);
    throw error;
  }
}

export default { registerMetadata };
