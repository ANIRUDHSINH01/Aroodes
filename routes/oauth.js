import express from 'express';
import fetch from 'node-fetch';
import { getUser } from '../data/database.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const DISCORD_API = 'https://discord.com/api/v10';
const CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const REDIRECT_URI = process.env.DISCORD_REDIRECT_URI;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

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

// OAuth start
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
  authUrl.searchParams.set('scope', 'identify email role_connections.write');
  authUrl.searchParams.set('prompt', 'consent');

  res.redirect(authUrl.toString());
});

// OAuth callback
router.get('/linked-role-callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    const storedState = req.signedCookies.oauth_state;

    if (!storedState || storedState !== state) {
      return res.status(403).send('State verification failed');
    }

    res.clearCookie('oauth_state');

    // Get tokens
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
      return res.status(500).send('Failed to get token');
    }

    const tokens = await tokenRes.json();

    // Get user
    const userRes = await fetch(`${DISCORD_API}/users/@me`, {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    if (!userRes.ok) return res.status(500).send('Failed to get user');

    const user = await userRes.json();
    const userData = await getUser(user.id);

    // Update role connection
    await fetch(`${DISCORD_API}/users/@me/applications/${CLIENT_ID}/role-connection`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        platform_name: 'Aroodes',
        platform_username: user.username,
        metadata: {
          pathway: userData?.pathway || 'none',
          sequence: userData?.sequence || 9,
          beyonder_level: userData?.sequence <= 3 ? 'angel' : 'beyonder',
        },
      }),
    });

    // Create JWT
    const authToken = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        discriminator: user.discriminator,
        avatar: user.avatar
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('auth_token', authToken, {
      maxAge: 604800000, // 7 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    res.redirect('/dashboard');

  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('Auth failed');
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
      spiritualPoints: userData?.spiritual_points
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export { router };
