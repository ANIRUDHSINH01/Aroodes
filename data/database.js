import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aroodes';

// ============================================
// USER SCHEMA
// ============================================

const userSchema = new mongoose.Schema({
  user_id: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true },
  discriminator: { type: String, default: '0' },
  avatar: { type: String, default: null },
  
  // Pathway Information
  pathway: { type: String, default: null, index: true },
  sequence: { type: Number, default: 9, min: 0, max: 9 },
  
  // Points & Progress
  spiritual_points: { type: Number, default: 0 },
  total_advancements: { type: Number, default: 0 },
  
  // Activity Tracking
  total_messages: { type: Number, default: 0 },
  total_voice_minutes: { type: Number, default: 0 },
  rituals_completed: { type: Number, default: 0 },
  daily_streak: { type: Number, default: 0 },
  last_daily_claim: { type: Date, default: null },
  
  // Risk & Control
  lose_control_count: { type: Number, default: 0 },
  lose_control_risk: { type: Number, default: 5, min: 0, max: 100 },
  
  // Affinity & Rank
  pathway_affinity: { type: Number, default: 50, min: 0, max: 100 },
  beyonder_rank: { 
    type: String, 
    enum: ['initiate', 'beyonder', 'saint', 'angel', 'true_god'],
    default: 'initiate' 
  },
  
  // Timestamps
  assigned_at: { type: Date, default: Date.now },
  last_active: { type: Date, default: Date.now, index: true },
  metadata_synced_at: { type: Date, default: null },
  
  // Additional Features
  achievements: [{ name: String, earned_at: Date }],
  inventory: [{ item_name: String, item_type: String, quantity: Number }],
  
  // Settings
  preferences: {
    notifications: { type: Boolean, default: true },
    public_profile: { type: Boolean, default: true },
    show_stats: { type: Boolean, default: true }
  }
}, { timestamps: true });

// Indexes
userSchema.index({ pathway: 1, sequence: 1 });
userSchema.index({ spiritual_points: -1 });

// Virtual
userSchema.virtual('days_active').get(function() {
  if (!this.assigned_at) return 0;
  return Math.floor((Date.now() - this.assigned_at) / (1000 * 60 * 60 * 24));
});

// Methods
userSchema.methods.calculateRank = function() {
  if (!this.pathway) return 'initiate';
  if (this.sequence === 0) return 'true_god';
  if (this.sequence <= 3) return 'angel';
  if (this.sequence <= 6) return 'saint';
  return 'beyonder';
};

userSchema.methods.updateRank = async function() {
  this.beyonder_rank = this.calculateRank();
  return await this.save();
};

const User = mongoose.model('User', userSchema);

// ============================================
// CONNECTION
// ============================================

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB error:', error);
    throw error;
  }
}

// ============================================
// BASIC OPERATIONS
// ============================================

export async function getUser(userId) {
  try {
    return await User.findOne({ user_id: userId });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function setUserPathway(userId, username, pathway, discriminator = '0', avatar = null) {
  try {
    const existingUser = await User.findOne({ user_id: userId });
    
    if (existingUser) {
      existingUser.pathway = pathway;
      existingUser.sequence = 9;
      existingUser.username = username;
      existingUser.discriminator = discriminator;
      if (avatar) existingUser.avatar = avatar;
      existingUser.assigned_at = new Date();
      existingUser.last_active = new Date();
      await existingUser.updateRank();
      return await existingUser.save();
    } else {
      const newUser = new User({
        user_id: userId,
        username: username,
        discriminator: discriminator,
        avatar: avatar,
        pathway: pathway,
        sequence: 9,
        spiritual_points: 0,
        beyonder_rank: 'beyonder',
        assigned_at: new Date(),
        last_active: new Date()
      });
      return await newUser.save();
    }
  } catch (error) {
    console.error('Error setting pathway:', error);
    throw error;
  }
}

export async function updateUserStats(userId, updates) {
  try {
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { ...updates, last_active: new Date() } },
      { new: true, upsert: true }
    );
    if (updates.sequence !== undefined) await user.updateRank();
    return user;
  } catch (error) {
    console.error('Error updating stats:', error);
    return null;
  }
}

export async function incrementStats(userId, field, amount = 1) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      { $inc: { [field]: amount }, $set: { last_active: new Date() } },
      { new: true }
    );
  } catch (error) {
    console.error('Error incrementing stats:', error);
    return null;
  }
}

// ============================================
// PROGRESSION
// ============================================

export async function advanceSequence(userId) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user || user.sequence === 0) {
      return { success: false, message: 'Cannot advance further' };
    }
    user.sequence -= 1;
    user.total_advancements += 1;
    user.lose_control_risk += 5;
    await user.updateRank();
    await user.save();
    return { success: true, user };
  } catch (error) {
    console.error('Error advancing sequence:', error);
    return { success: false, message: error.message };
  }
}

export async function updateUserMetadata(userId) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { metadata_synced_at: new Date(), last_active: new Date() } },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating metadata:', error);
    return null;
  }
}

// ============================================
// FEATURES
// ============================================

export async function addAchievement(userId, achievementName) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      { $push: { achievements: { name: achievementName, earned_at: new Date() } }, $set: { last_active: new Date() } },
      { new: true }
    );
  } catch (error) {
    console.error('Error adding achievement:', error);
    return null;
  }
}

export async function addInventoryItem(userId, itemName, itemType, quantity = 1) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) return null;
    const existingItem = user.inventory.find(item => item.item_name === itemName);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.inventory.push({ item_name: itemName, item_type: itemType, quantity: quantity });
    }
    user.last_active = new Date();
    return await user.save();
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return null;
  }
}

// ============================================
// QUERIES
// ============================================

export async function getAllUsers() {
  try {
    return await User.find({}).sort({ last_active: -1 });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function getUsersByPathway(pathway) {
  try {
    return await User.find({ pathway: pathway }).sort({ sequence: 1 });
  } catch (error) {
    console.error('Error getting users by pathway:', error);
    return [];
  }
}

export async function getUsersByIds(userIds) {
  try {
    return await User.find({ user_id: { $in: userIds } });
  } catch (error) {
    console.error('Error getting users by IDs:', error);
    return [];
  }
}

export async function getLeaderboard(sortBy = 'sequence', limit = 50) {
  try {
    let sortField = {};
    if (sortBy === 'points') sortField = { spiritual_points: -1, sequence: 1 };
    else if (sortBy === 'sequence') sortField = { sequence: 1, spiritual_points: -1 };
    else if (sortBy === 'activity') sortField = { total_messages: -1 };
    return await User.find({ pathway: { $ne: null } }).sort(sortField).limit(limit);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

export async function getServerStats() {
  try {
    const allUsers = await User.find({ pathway: { $ne: null } });
    const totalBeyonders = allUsers.length;
    const angels = allUsers.filter(u => u.sequence <= 3 && u.sequence > 0).length;
    const trueGods = allUsers.filter(u => u.sequence === 0).length;
    const saints = allUsers.filter(u => u.sequence <= 6 && u.sequence > 3).length;
    const avgSequence = totalBeyonders > 0 ? allUsers.reduce((sum, u) => sum + u.sequence, 0) / totalBeyonders : 9;
    const totalPoints = allUsers.reduce((sum, u) => sum + (u.spiritual_points || 0), 0);
    const avgPoints = totalBeyonders > 0 ? totalPoints / totalBeyonders : 0;
    
    const pathwayCount = {};
    allUsers.forEach(u => pathwayCount[u.pathway] = (pathwayCount[u.pathway] || 0) + 1);
    const pathwayDistribution = Object.entries(pathwayCount).map(([pathway, count]) => ({ pathway, count })).sort((a, b) => b.count - a.count);
    
    const sequenceCount = {};
    allUsers.forEach(u => sequenceCount[u.sequence] = (sequenceCount[u.sequence] || 0) + 1);
    const sequenceDistribution = Object.entries(sequenceCount).map(([sequence, count]) => ({ sequence: parseInt(sequence), count })).sort((a, b) => a.sequence - b.sequence);
    
    return {
      totalBeyonders, angels, trueGods, saints,
      averageSequence: Number(avgSequence.toFixed(2)),
      averagePoints: Number(avgPoints.toFixed(0)),
      totalPoints,
      pathwayDistribution,
      sequenceDistribution,
      mostPopularPathway: pathwayDistribution[0]?.pathway || 'none'
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return { totalBeyonders: 0, angels: 0, trueGods: 0, saints: 0, averageSequence: 9, averagePoints: 0, totalPoints: 0, pathwayDistribution: [], sequenceDistribution: [], mostPopularPathway: 'none' };
  }
}

export async function getTopPerformers(category = 'points', limit = 10) {
  try {
    let sortField = {};
    if (category === 'points') sortField = { spiritual_points: -1 };
    else if (category === 'messages') sortField = { total_messages: -1 };
    else if (category === 'rituals') sortField = { rituals_completed: -1 };
    else if (category === 'advancements') sortField = { total_advancements: -1 };
    return await User.find({ pathway: { $ne: null } }).sort(sortField).limit(limit);
  } catch (error) {
    console.error('Error getting top performers:', error);
    return [];
  }
}

export async function searchUsers(query) {
  try {
    return await User.find({ $or: [{ username: { $regex: query, $options: 'i' } }, { pathway: { $regex: query, $options: 'i' } }] }).limit(20);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// ============================================
// HISTORY
// ============================================

export async function getAdvancementHistory(userId) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) return [];
    return {
      userId: user.user_id, username: user.username, pathway: user.pathway,
      currentSequence: user.sequence, totalAdvancements: user.total_advancements,
      beyonderRank: user.beyonder_rank, assignedAt: user.assigned_at,
      lastActive: user.last_active, achievements: user.achievements,
      spiritualPoints: user.spiritual_points
    };
  } catch (error) {
    console.error('Error getting advancement history:', error);
    return [];
  }
}

export async function getUserProfile(userId) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) return null;
    return { ...user.toObject(), days_active: user.days_active };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

export async function getRecentActivity(limit = 20) {
  try {
    return await User.find({ pathway: { $ne: null } }).sort({ last_active: -1 }).limit(limit).select('user_id username pathway sequence last_active');
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}

export async function getPathwayStats(pathway) {
  try {
    const users = await User.find({ pathway: pathway });
    const totalUsers = users.length;
    const avgSequence = users.reduce((sum, u) => sum + u.sequence, 0) / totalUsers || 9;
    const totalPoints = users.reduce((sum, u) => sum + (u.spiritual_points || 0), 0);
    return { pathway, totalUsers, averageSequence: Number(avgSequence.toFixed(2)), totalPoints };
  } catch (error) {
    console.error('Error getting pathway stats:', error);
    return null;
  }
}

// ============================================
// ADMIN
// ============================================

export async function deleteUser(userId) {
  try {
    const result = await User.deleteOne({ user_id: userId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function resetUserPathway(userId) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      { $set: { pathway: null, sequence: 9, spiritual_points: 0, total_advancements: 0, beyonder_rank: 'initiate', lose_control_risk: 5, pathway_affinity: 50, rituals_completed: 0, achievements: [], inventory: [] } },
      { new: true }
    );
  } catch (error) {
    console.error('Error resetting pathway:', error);
    return null;
  }
}

export async function forceSetSequence(userId, sequence) {
  try {
    const user = await User.findOne({ user_id: userId });
    if (!user) return null;
    user.sequence = Math.max(0, Math.min(9, sequence));
    await user.updateRank();
    user.last_active = new Date();
    return await user.save();
  } catch (error) {
    console.error('Error setting sequence:', error);
    return null;
  }
}

export async function givePoints(userId, points) {
  try {
    return await User.findOneAndUpdate({ user_id: userId }, { $inc: { spiritual_points: points }, $set: { last_active: new Date() } }, { new: true });
  } catch (error) {
    console.error('Error giving points:', error);
    return null;
  }
}

export async function bulkUpdateUsers(userIds, updates) {
  try {
    const result = await User.updateMany({ user_id: { $in: userIds } }, { $set: { ...updates, last_active: new Date() } });
    return result.modifiedCount;
  } catch (error) {
    console.error('Error bulk updating users:', error);
    return 0;
  }
}

export async function cleanupInactiveUsers(daysInactive = 90) {
  try {
    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({ last_active: { $lt: cutoffDate }, pathway: null });
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up users:', error);
    return 0;
  }
}

export async function userExists(userId) {
  try {
    const count = await User.countDocuments({ user_id: userId });
    return count > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
}

// ============================================
// DEFAULT EXPORT (ONLY ONE)
// ============================================

export default {
  connectDB, getUser, setUserPathway, updateUserStats, incrementStats,
  advanceSequence, updateUserMetadata, addAchievement, addInventoryItem,
  getAllUsers, getUsersByPathway, getUsersByIds, getLeaderboard, getServerStats,
  getTopPerformers, searchUsers, getAdvancementHistory, getUserProfile,
  getRecentActivity, getPathwayStats, deleteUser, resetUserPathway,
  forceSetSequence, givePoints, bulkUpdateUsers, cleanupInactiveUsers, userExists
};
