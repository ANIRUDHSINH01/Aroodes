import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aroodes';

// Enhanced User Schema with all fields
const userSchema = new mongoose.Schema({
  user_id: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  discriminator: { 
    type: String, 
    default: '0' 
  },
  avatar: { 
    type: String, 
    default: null 
  },
  
  // Pathway Information
  pathway: { 
    type: String, 
    default: null,
    index: true 
  },
  sequence: { 
    type: Number, 
    default: 9,
    min: 0,
    max: 9 
  },
  
  // Points & Progress
  spiritual_points: { 
    type: Number, 
    default: 0 
  },
  total_advancements: { 
    type: Number, 
    default: 0 
  },
  
  // Activity Tracking
  total_messages: { 
    type: Number, 
    default: 0 
  },
  total_voice_minutes: { 
    type: Number, 
    default: 0 
  },
  rituals_completed: { 
    type: Number, 
    default: 0 
  },
  daily_streak: { 
    type: Number, 
    default: 0 
  },
  last_daily_claim: { 
    type: Date, 
    default: null 
  },
  
  // Risk & Control
  lose_control_count: { 
    type: Number, 
    default: 0 
  },
  lose_control_risk: { 
    type: Number, 
    default: 5,
    min: 0,
    max: 100 
  },
  
  // Affinity & Rank
  pathway_affinity: { 
    type: Number, 
    default: 50,
    min: 0,
    max: 100 
  },
  beyonder_rank: { 
    type: String, 
    enum: ['initiate', 'beyonder', 'saint', 'angel', 'true_god'],
    default: 'initiate' 
  },
  
  // Timestamps
  assigned_at: { 
    type: Date, 
    default: Date.now 
  },
  last_active: { 
    type: Date, 
    default: Date.now,
    index: true 
  },
  metadata_synced_at: { 
    type: Date, 
    default: null 
  },
  
  // Additional Features
  achievements: [{
    name: String,
    earned_at: Date
  }],
  inventory: [{
    item_name: String,
    item_type: String,
    quantity: Number
  }],
  
  // Settings
  preferences: {
    notifications: { type: Boolean, default: true },
    public_profile: { type: Boolean, default: true },
    show_stats: { type: Boolean, default: true }
  }
  
}, { 
  timestamps: true 
});

// Indexes for better query performance
userSchema.index({ pathway: 1, sequence: 1 });
userSchema.index({ spiritual_points: -1 });
userSchema.index({ last_active: -1 });

// Virtual for days active
userSchema.virtual('days_active').get(function() {
  if (!this.assigned_at) return 0;
  return Math.floor((Date.now() - this.assigned_at) / (1000 * 60 * 60 * 24));
});

// Method to calculate rank based on sequence
userSchema.methods.calculateRank = function() {
  if (!this.pathway) return 'initiate';
  if (this.sequence === 0) return 'true_god';
  if (this.sequence <= 3) return 'angel';
  if (this.sequence <= 6) return 'saint';
  return 'beyonder';
};

// Method to update rank
userSchema.methods.updateRank = async function() {
  this.beyonder_rank = this.calculateRank();
  return await this.save();
};

const User = mongoose.model('User', userSchema);

// ============================================
// DATABASE CONNECTION
// ============================================

export async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`   Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// ============================================
// USER OPERATIONS
// ============================================

/**
 * Get user by ID
 */
export async function getUser(userId) {
  try {
    return await User.findOne({ user_id: userId });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

/**
 * Create or update user with pathway
 */
export async function setUserPathway(userId, username, pathway, discriminator = '0', avatar = null) {
  try {
    const existingUser = await User.findOne({ user_id: userId });
    
    if (existingUser) {
      // Update existing user
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
      // Create new user
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

/**
 * Update user stats
 */
export async function updateUserStats(userId, updates) {
  try {
    const user = await User.findOneAndUpdate(
      { user_id: userId },
      { 
        $set: { 
          ...updates, 
          last_active: new Date() 
        } 
      },
      { new: true, upsert: true }
    );
    
    if (updates.sequence !== undefined) {
      await user.updateRank();
    }
    
    return user;
  } catch (error) {
    console.error('Error updating stats:', error);
    return null;
  }
}

/**
 * Increment specific stat
 */
export async function incrementStats(userId, field, amount = 1) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      { 
        $inc: { [field]: amount },
        $set: { last_active: new Date() }
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error incrementing stats:', error);
    return null;
  }
}

/**
 * Advance user sequence
 */
export async function advanceSequence(userId) {
  try {
    const user = await User.findOne({ user_id: userId });
    
    if (!user || user.sequence === 0) {
      return { success: false, message: 'Cannot advance further' };
    }
    
    user.sequence -= 1;
    user.total_advancements += 1;
    user.lose_control_risk += 5; // Increase risk with each advancement
    await user.updateRank();
    await user.save();
    
    return { success: true, user };
  } catch (error) {
    console.error('Error advancing sequence:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Update metadata sync timestamp
 */
export async function updateUserMetadata(userId) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      { 
        $set: { 
          metadata_synced_at: new Date(),
          last_active: new Date()
        }
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error updating metadata:', error);
    return null;
  }
}

/**
 * Add achievement to user
 */
export async function addAchievement(userId, achievementName) {
  try {
    return await User.findOneAndUpdate(
      { user_id: userId },
      {
        $push: {
          achievements: {
            name: achievementName,
            earned_at: new Date()
          }
        },
        $set: { last_active: new Date() }
      },
      { new: true }
    );
  } catch (error) {
    console.error('Error adding achievement:', error);
    return null;
  }
}

/**
 * Add item to inventory
 */
export async function addInventoryItem(userId, itemName, itemType, quantity = 1) {
  try {
    const user = await User.findOne({ user_id: userId });
    
    if (!user) return null;
    
    const existingItem = user.inventory.find(item => item.item_name === itemName);
    
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.inventory.push({
        item_name: itemName,
        item_type: itemType,
        quantity: quantity
      });
    }
    
    user.last_active = new Date();
    return await user.save();
  } catch (error) {
    console.error('Error adding inventory item:', error);
    return null;
  }
}

// ============================================
// QUERY OPERATIONS
// ============================================

/**
 * Get all users
 */
export async function getAllUsers() {
  try {
    return await User.find({}).sort({ last_active: -1 });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

/**
 * Get users by pathway
 */
export async function getUsersByPathway(pathway) {
  try {
    return await User.find({ pathway: pathway }).sort({ sequence: 1 });
  } catch (error) {
    console.error('Error getting users by pathway:', error);
    return [];
  }
}

/**
 * Get leaderboard
 */
export async function getLeaderboard(sortBy = 'sequence', limit = 50) {
  try {
    let sortField = {};
    
    if (sortBy === 'points') {
      sortField = { spiritual_points: -1, sequence: 1 };
    } else if (sortBy === 'sequence') {
      sortField = { sequence: 1, spiritual_points: -1 };
    } else if (sortBy === 'activity') {
      sortField = { total_messages: -1 };
    }
    
    return await User.find({ pathway: { $ne: null } })
      .sort(sortField)
      .limit(limit);
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
}

/**
 * Get server statistics
 */
export async function getServerStats() {
  try {
    const allUsers = await User.find({ pathway: { $ne: null } });
    
    const totalBeyonders = allUsers.length;
    const angels = allUsers.filter(u => u.sequence <= 3 && u.sequence > 0).length;
    const trueGods = allUsers.filter(u => u.sequence === 0).length;
    const saints = allUsers.filter(u => u.sequence <= 6 && u.sequence > 3).length;
    
    const avgSequence = totalBeyonders > 0 
      ? allUsers.reduce((sum, u) => sum + u.sequence, 0) / totalBeyonders 
      : 9;
    
    const totalPoints = allUsers.reduce((sum, u) => sum + (u.spiritual_points || 0), 0);
    const avgPoints = totalBeyonders > 0 ? totalPoints / totalBeyonders : 0;
    
    const totalMessages = allUsers.reduce((sum, u) => sum + (u.total_messages || 0), 0);
    const totalRituals = allUsers.reduce((sum, u) => sum + (u.rituals_completed || 0), 0);
    
    // Pathway distribution
    const pathwayCount = {};
    allUsers.forEach(u => {
      pathwayCount[u.pathway] = (pathwayCount[u.pathway] || 0) + 1;
    });
    
    const pathwayDistribution = Object.entries(pathwayCount)
      .map(([pathway, count]) => ({ pathway, count }))
      .sort((a, b) => b.count - a.count);
    
    // Sequence distribution
    const sequenceCount = {};
    allUsers.forEach(u => {
      sequenceCount[u.sequence] = (sequenceCount[u.sequence] || 0) + 1;
    });
    
    const sequenceDistribution = Object.entries(sequenceCount)
      .map(([sequence, count]) => ({ sequence: parseInt(sequence), count }))
      .sort((a, b) => a.sequence - b.sequence);
    
    // Rank distribution
    const rankCount = {
      initiate: 0,
      beyonder: 0,
      saint: 0,
      angel: 0,
      true_god: 0
    };
    allUsers.forEach(u => {
      rankCount[u.beyonder_rank] = (rankCount[u.beyonder_rank] || 0) + 1;
    });
    
    return {
      totalBeyonders,
      angels,
      trueGods,
      saints,
      averageSequence: Number(avgSequence.toFixed(2)),
      averagePoints: Number(avgPoints.toFixed(0)),
      totalPoints,
      totalMessages,
      totalRituals,
      pathwayDistribution,
      sequenceDistribution,
      rankDistribution: rankCount,
      mostPopularPathway: pathwayDistribution[0]?.pathway || 'none',
      serverLevel: Math.floor(totalPoints / 1000)
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    return {
      totalBeyonders: 0,
      angels: 0,
      trueGods: 0,
      saints: 0,
      averageSequence: 9,
      averagePoints: 0,
      totalPoints: 0,
      totalMessages: 0,
      totalRituals: 0,
      pathwayDistribution: [],
      sequenceDistribution: [],
      rankDistribution: {},
      mostPopularPathway: 'none',
      serverLevel: 0
    };
  }
}

/**
 * Get top performers
 */
export async function getTopPerformers(category = 'points', limit = 10) {
  try {
    let sortField = {};
    
    switch(category) {
      case 'points':
        sortField = { spiritual_points: -1 };
        break;
      case 'messages':
        sortField = { total_messages: -1 };
        break;
      case 'rituals':
        sortField = { rituals_completed: -1 };
        break;
      case 'advancements':
        sortField = { total_advancements: -1 };
        break;
      default:
        sortField = { spiritual_points: -1 };
    }
    
    return await User.find({ pathway: { $ne: null } })
      .sort(sortField)
      .limit(limit);
  } catch (error) {
    console.error('Error getting top performers:', error);
    return [];
  }
}

/**
 * Search users
 */
export async function searchUsers(query) {
  try {
    return await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { pathway: { $regex: query, $options: 'i' } }
      ]
    }).limit(20);
  } catch (error) {
    console.error('Error searching users:', error);
    return [];
  }
}

// ============================================
// CLEANUP & MAINTENANCE
// ============================================

/**
 * Remove inactive users (optional)
 */
export async function cleanupInactiveUsers(daysInactive = 90) {
  try {
    const cutoffDate = new Date(Date.now() - daysInactive * 24 * 60 * 60 * 1000);
    const result = await User.deleteMany({
      last_active: { $lt: cutoffDate },
      pathway: null
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up users:', error);
    return 0;
  }
}

// ============================================
// EXPORTS
// ============================================

export default {
  connectDB,
  getUser,
  setUserPathway,
  updateUserStats,
  incrementStats,
  advanceSequence,
  updateUserMetadata,
  addAchievement,
  addInventoryItem,
  getAllUsers,
  getUsersByPathway,
  getLeaderboard,
  getServerStats,
  getTopPerformers,
  searchUsers,
  cleanupInactiveUsers
};
