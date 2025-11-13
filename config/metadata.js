import axios from 'axios';

const METADATA_TYPES = {
  INTEGER_GREATER_THAN_OR_EQUAL: 3,
  BOOLEAN_EQUAL: 7
};

const metadata = [
  {
    key: 'sequence',
    name: 'Sequence Level',
    description: 'Your pathway sequence (0-9, lower is stronger)',
    type: METADATA_TYPES.INTEGER_GREATER_THAN_OR_EQUAL
  },
  {
    key: 'beyonder_days',
    name: 'Days as Beyonder',
    description: 'Days since becoming a Beyonder',
    type: METADATA_TYPES.INTEGER_GREATER_THAN_OR_EQUAL
  },
  {
    key: 'is_angel',
    name: 'Angel Status',
    description: 'Reached Angel level (Sequence 1-3)',
    type: METADATA_TYPES.BOOLEAN_EQUAL
  },
  {
    key: 'lost_control',
    name: 'Lost Control Count',
    description: 'Times lost control',
    type: METADATA_TYPES.INTEGER_GREATER_THAN_OR_EQUAL
  },
  {
    key: 'has_pathway',
    name: 'Has Pathway',
    description: 'Assigned to a pathway',
    type: METADATA_TYPES.BOOLEAN_EQUAL
  }
];

export async function registerMetadata() {
  try {
    const response = await axios.put(
      `https://discord.com/api/v10/applications/${process.env.DISCORD_CLIENT_ID}/role-connections/metadata`,
      metadata,
      {
        headers: {
          'Authorization': `Bot ${process.env.DISCORD_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Linked roles metadata registered');
    return response.data;
  } catch (error) {
    console.error('❌ Error registering metadata:', error.response?.data || error.message);
    throw error;
  }
}

export { metadata };
