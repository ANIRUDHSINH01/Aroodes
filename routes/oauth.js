import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import { updateMetadata } from '../utils/discord-api.js';
import { getUser } from '../data/database.js';

const router = express.Router();

const OAUTH2_URL = 'https://discord.com/api/oauth2/authorize';
const TOKEN_URL = 'https://discord.com/api/oauth2/token';
const SCOPES = ['identify', 'role_connections.write'];

router.get('/linked-role', (req, res) => {
  const state = uuidv4();
  
  res.cookie('clientState', state, { 
    maxAge: 1000 * 60 * 5,
    signed: true,
    httpOnly: true
  });
  
  const params = new URLSearchParams({
    client_id: process.env.DISCORD_CLIENT_ID,
    redirect_uri: process.env.DISCORD_REDIRECT_URI,
    response_type: 'code',
    scope: SCOPES.join(' '),
    state,
    prompt: 'consent'
  });
  
  res.redirect(`${OAUTH2_URL}?${params}`);
});

router.get('/linked-role-callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    
    const clientState = req.signedCookies.clientState;
    if (state !== clientState) {
      return res.status(403).send('State verification failed');
    }
    
    const tokenResponse = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.DISCORD_REDIRECT_URI
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );
    
    const { access_token } = tokenResponse.data;
    
    const userResponse = await axios.get('https://discord.com/api/v10/users/@me', {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });
    
    const user = userResponse.data;
    
    await updateUserMetadata(user, access_token);
    
    res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Pathway Connected!</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
              color: #e9e9e9;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
            }
            .container {
              background: rgba(30, 30, 50, 0.95);
              padding: 50px;
              border-radius: 15px;
              border: 2px solid #d4af37;
              box-shadow: 0 0 30px rgba(212, 175, 55, 0.3);
              text-align: center;
              max-width: 600px;
            }
            h1 {
              color: #d4af37;
              font-size: 2.5em;
              margin-bottom: 20px;
              text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
            }
            .pathway {
              background: rgba(212, 175, 55, 0.1);
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              border: 1px solid #d4af37;
            }
            .username {
              color: #8ab4f8;
              font-weight: bold;
              font-size: 1.2em;
            }
            a {
              display: inline-block;
              margin-top: 30px;
              padding: 15px 30px;
              background: #d4af37;
              color: #1a1a2e;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              transition: all 0.3s;
            }
            a:hover {
              background: #f0c75e;
              box-shadow: 0 0 15px rgba(212, 175, 55, 0.5);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🌙 Pathway Connected! 🌙</h1>
            <div class="pathway">
              <p>Welcome, Beyonder <span class="username">${user.username}</span>!</p>
              <p style="margin-top: 15px;">Your account has been successfully connected to Aroodes.</p>
              <p>Your pathway progression has been synced.</p>
            </div>
            <p style="font-style: italic; color: #b8b8b8; margin-top: 20px;">
              "In the depths of the mysterious fog, greatness awaits..."
            </p>
            <a href="/">Return to the Fog of History</a>
          </div>
        </body>
      </html>
    `);
    
  } catch (error) {
    console.error('OAuth error:', error.message);
    res.status(500).send('Failed to connect pathway');
  }
});

async function updateUserMetadata(user, accessToken) {
  const userData = getUser(user.id);
  
  if (!userData || !userData.pathway) {
    // No pathway assigned yet
    const metadata = {
      sequence: 9,
      beyonder_days: 0,
      is_angel: false,
      lost_control: 0,
      has_pathway: false
    };
    
    await updateMetadata(user.id, accessToken, metadata);
    console.log(`✅ ${user.username} connected (no pathway yet)`);
    return;
  }
  
  const daysSince = userData.assigned_at 
    ? Math.floor((Date.now() - new Date(userData.assigned_at).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const metadata = {
    sequence: userData.sequence,
    beyonder_days: daysSince,
    is_angel: userData.sequence <= 3,
    lost_control: userData.lose_control_count || 0,
    has_pathway: true
  };
  
  await updateMetadata(user.id, accessToken, metadata);
  console.log(`✅ ${user.username} - Sequence ${userData.sequence}, ${daysSince} days`);
}

export { router };
