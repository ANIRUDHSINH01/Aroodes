import express from 'express';
import fetch from 'node-fetch';
import { getUser, updateUserMetadata } from '../data/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

/**
 * Calculate metadata from user data
 */
function calculateMetadata(userData) {
  if (!userData || !userData.pathway) {
    return {
      pathway: 'none',
      sequence: 9,
      spiritual_points: 0,
      beyonder_rank: 'initiate',
      total_advancements: 0,
      days_active: 0,
      lose_control_risk: 5,
      pathway_affinity: 0
    };
  }

  // Calculate days active
  const daysActive = userData.assigned_at 
    ? Math.floor((Date.now() - new Date(userData.assigned_at)) / (1000 * 60 * 60 * 24))
    : 0;

  // Determine rank
  let rank = 'beyonder';
  if (userData.sequence === 0) rank = 'true_god';
  else if (userData.sequence <= 3) rank = 'angel';
  else if (userData.sequence <= 6) rank = 'saint';

  // Calculate advancements
  const totalAdvancements = 9 - userData.sequence;

  // Calculate lose control risk (higher sequence = lower risk if managed well)
  const baseRisk = 5;
  const sequenceRisk = (9 - userData.sequence) * 5;
  const controlRisk = userData.lose_control_count ? userData.lose_control_count * 10 : 0;
  const loseControlRisk = Math.min(100, baseRisk + sequenceRisk + controlRisk);

  // Calculate pathway affinity (based on activity and progress)
  const affinityBase = 50;
  const affinityFromPoints = Math.min(30, (userData.spiritual_points || 0) / 10);
  const affinityFromSequence = (9 - userData.sequence) * 2;
  const pathwayAffinity = Math.min(100, Math.floor(affinityBase + affinityFromPoints + affinityFromSequence));

  return {
    pathway: userData.pathway,
    sequence: userData.sequence,
    spiritual_points: userData.spiritual_points || 0,
    beyonder_rank: rank,
    total_advancements: totalAdvancements,
    days_active: daysActive,
    lose_control_risk: loseControlRisk,
    pathway_affinity: pathwayAffinity
  };
}

/**
 * Update Discord linked role metadata
 */
async function updateLinkedRole(accessToken, metadata) {
  try {
    const response = await fetch(
      `${DISCORD_API}/users/@me/applications/${CLIENT_ID}/role-connection`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform_name: 'Aroodes - LOTM',
          metadata: metadata
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to update linked role:', error);
    }

    return response.ok;
  } catch (error) {
    console.error('Error updating linked role:', error);
    return false;
  }
}

// Login page
router.get('/login', (req, res) => {
  res.sendFile('login.html', { root: 'public' });
});

// Dashboard - protected
router.get('/dashboard', async (req, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) return res.redirect('/login');

  try {
    jwt.verify(token, JWT_SECRET);
    res.sendFile('dashboard.html', { root: 'public' });
  } catch (error) {
    res.clearCookie('auth_token');
    res.redirect('/login');
  }
});

// OAuth start - Linked Role
router.get('/linked-role', (req, res) => {
  const state = Math.random().toString(36).substring(7);
  
  res.cookie('oauth_state', state, {
    maxAge: 300000,
    signed: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production'
  });

  const authUrl = new URL(`${DISCORD_API}/oauth2/authorize`);
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'identify email guilds role_connections.write');
  authUrl.searchParams.set('prompt', 'consent');

  res.redirect(authUrl.toString());
});

// OAuth callback
router.get('/linked-role-callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.signedCookies.oauth_state;

    if (!storedState || storedState !== state) {
      return res.status(403).send('❌ State verification failed. Please try again.');
    }

    res.clearCookie('oauth_state');

    // Exchange code for tokens
    const tokenRes = await fetch(`${DISCORD_API}/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Token failed:', await tokenRes.text());
      return res.status(500).send('❌ Failed to obtain access token.');
    }

    const tokens = await tokenRes.json();

    // Get user info
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) {
      return res.status(500).send('❌ Failed to fetch user information.');
    }

    const user = await userRes.json();

    // Get user data from database
    const userData = await getUser(user.id);

    // Calculate metadata
    const metadata = calculateMetadata(userData);

    // Update linked role
    await updateLinkedRole(tokens.access_token, metadata);

    // Create JWT
    const authToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar,
        accessToken: tokens.access_token // Store for future metadata updates
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', authToken, {
      maxAge: 604800000,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    // Success page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Connected - Aroodes</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          body {
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            font-family: 'Segoe UI', sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        </style>
      </head>
      <body class="text-white">
        <div class="max-w-2xl mx-auto p-8 bg-gray-900 bg-opacity-80 rounded-2xl border-2 border-yellow-600 shadow-2xl">
          <div class="text-center">
            <div class="text-7xl mb-6">✨</div>
            <h1 class="text-4xl font-bold text-yellow-500 mb-4">Successfully Connected!</h1>
            <p class="text-xl text-gray-300 mb-6">Your Discord has been linked to Aroodes</p>
            
            <div class="bg-gray-800 p-6 rounded-xl mb-6 text-left">
              <h2 class="text-2xl font-bold text-yellow-500 mb-4">Linked Role Metadata</h2>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-400">Pathway:</span>
                  <span class="text-yellow-400 font-bold capitalize">${metadata.pathway}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Sequence:</span>
                  <span class="text-yellow-400 font-bold">${metadata.sequence}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Spiritual Points:</span>
                  <span class="text-yellow-400 font-bold">${metadata.spiritual_points}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Rank:</span>
                  <span class="text-yellow-400 font-bold capitalize">${metadata.beyonder_rank}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Advancements:</span>
                  <span class="text-yellow-400 font-bold">${metadata.total_advancements}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Days Active:</span>
                  <span class="text-yellow-400 font-bold">${metadata.days_active}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Control Stability:</span>
                  <span class="text-${metadata.lose_control_risk > 50 ? 'red' : 'green'}-400 font-bold">${100 - metadata.lose_control_risk}%</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-400">Pathway Affinity:</span>
                  <span class="text-yellow-400 font-bold">${metadata.pathway_affinity}%</span>
                </div>
              </div>
            </div>

            <p class="text-gray-400 mb-6">Your metadata will automatically sync with your Discord profile!</p>

            <button 
              onclick="window.location.href='/dashboard'"
              class="px-8 py-4 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black font-bold rounded-lg hover:scale-105 transition"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('❌ Authentication failed.');
  }
});

// API: Manually sync linked role (for when user data changes)
router.post('/api/sync-linked-role', async (req, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (!decoded.accessToken) {
      return res.status(400).json({ error: 'No access token stored' });
    }

    const userData = await getUser(decoded.userId);
    const metadata = calculateMetadata(userData);
    
    const success = await updateLinkedRole(decoded.accessToken, metadata);
    
    if (success) {
      res.json({ success: true, metadata });
    } else {
      res.status(500).json({ error: 'Failed to sync' });
    }

  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Logout
router.get('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.redirect('/login');
});

// Get current user
router.get('/api/me', async (req, res) => {
  const token = req.cookies.auth_token;
  
  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userData = await getUser(decoded.userId);
    
    res.json({
      id: decoded.userId,
      username: decoded.username,
      discriminator: decoded.discriminator,
      avatar: decoded.avatar,
      pathway: userData?.pathway,
      sequence: userData?.sequence,
      spiritualPoints: userData?.spiritual_points,
      metadata: calculateMetadata(userData)
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export { router, calculateMetadata, updateLinkedRole };
