import mongoose from 'mongoose';

// User Schema
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
  pathway: {
    type: String,
    lowercase: true
  },
  sequence: {
    type: Number,
    default: 9,
    min: 0,
    max: 9
  },
  lose_control_count: {
    type: Number,
    default: 0
  },
  last_lose_control_check: Date,
  assigned_at: Date,
  assigned_by: String,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Advancement History Schema
const advancementSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  from_sequence: Number,
  to_sequence: Number,
  advanced_by: String,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Lose Control Log Schema
const loseControlSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true,
    index: true
  },
  sequence: Number,
  pathway: String,
  risk_percentage: Number,
  roll_result: Number,
  lost_control: Boolean,
  timestamp: {
    type: Date,
    default: Date.now
  }
});

// Server Stats Schema
const serverStatsSchema = new mongoose.Schema({
  guild_id: {
    type: String,
    required: true,
    unique: true
  },
  total_beyonders: {
    type: Number,
    default: 0
  },
  total_advancements: {
    type: Number,
    default: 0
  },
  total_lose_control: {
    type: Number,
    default: 0
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: Date
});

// Create Models
const User = mongoose.model('User', userSchema);
const Advancement = mongoose.model('Advancement', advancementSchema);
const LoseControl = mongoose.model('LoseControl', loseControlSchema);
const ServerStats = mongoose.model('ServerStats', serverStatsSchema);

// Connect to MongoDB
export async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// User Functions
export async function getUser(userId) {
  try {
    return await User.findOne({ user_id: userId });
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
}

export async function createUser(userId, username, pathway, assignedBy) {
  try {
    const user = new User({
      user_id: userId,
      username: username,
      pathway: pathway,
      sequence: 9,
      assigned_by: assignedBy,
      assigned_at: new Date(),
      updated_at: new Date()
    });
    
    return await user.save();
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
}

export async function updateUserSequence(userId, newSequence, advancedBy) {
  try {
    const user = await User.findOne({ user_id: userId });
    
    if (!user) return null;
    
    const oldSequence = user.sequence;
    
    // Update user
    user.sequence = newSequence;
    user.updated_at = new Date();
    await user.save();
    
    // Log advancement
    const advancement = new Advancement({
      user_id: userId,
      from_sequence: oldSequence,
      to_sequence: newSequence,
      advanced_by: advancedBy
    });
    await advancement.save();
    
    return user;
  } catch (error) {
    console.error('Error updating sequence:', error);
    return null;
  }
}

export async function setUserPathway(userId, username, pathway, assignedBy) {
  try {
    let user = await User.findOne({ user_id: userId });
    
    if (user) {
      user.pathway = pathway;
      user.assigned_by = assignedBy;
      user.assigned_at = new Date();
      user.updated_at = new Date();
      await user.save();
    } else {
      user = await createUser(userId, username, pathway, assignedBy);
    }
    
    return user;
  } catch (error) {
    console.error('Error setting pathway:', error);
    return null;
  }
}

export async function deleteUser(userId) {
  try {
    await User.deleteOne({ user_id: userId });
    await Advancement.deleteMany({ user_id: userId });
    await LoseControl.deleteMany({ user_id: userId });
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

export async function getAllUsers() {
  try {
    return await User.find({ pathway: { $ne: null } })
      .sort({ sequence: 1, pathway: 1 });
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

export async function getUsersByPathway(pathway) {
  try {
    return await User.find({ pathway: pathway })
      .sort({ sequence: 1 });
  } catch (error) {
    console.error('Error getting users by pathway:', error);
    return [];
  }
}

export async function getTopBeyonders(limit = 10) {
  try {
    return await User.find({ pathway: { $ne: null } })
      .sort({ sequence: 1 })
      .limit(limit);
  } catch (error) {
    console.error('Error getting top beyonders:', error);
    return [];
  }
}

// Lose Control Functions
export async function logLoseControl(userId, sequence, pathway, risk, roll, lostControl) {
  try {
    const log = new LoseControl({
      user_id: userId,
      sequence: sequence,
      pathway: pathway,
      risk_percentage: risk,
      roll_result: roll,
      lost_control: lostControl
    });
    
    await log.save();
    
    if (lostControl) {
      await User.updateOne(
        { user_id: userId },
        { 
          $inc: { lose_control_count: 1 },
          $set: { last_lose_control_check: new Date() }
        }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error logging lose control:', error);
    return false;
  }
}

export async function getUserLoseControlHistory(userId, limit = 10) {
  try {
    return await LoseControl.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Error getting lose control history:', error);
    return [];
  }
}

export async function getTotalLoseControlEvents() {
  try {
    return await LoseControl.countDocuments({ lost_control: true });
  } catch (error) {
    console.error('Error getting total lose control events:', error);
    return 0;
  }
}

// Stats Functions
export async function getPathwayStats() {
  try {
    return await User.aggregate([
      { $match: { pathway: { $ne: null } } },
      { $group: { _id: '$pathway', count: { $sum: 1 } } },
      { $project: { pathway: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } }
    ]);
  } catch (error) {
    console.error('Error getting pathway stats:', error);
    return [];
  }
}

export async function getSequenceDistribution() {
  try {
    return await User.aggregate([
      { $match: { pathway: { $ne: null } } },
      { $group: { _id: '$sequence', count: { $sum: 1 } } },
      { $project: { sequence: '$_id', count: 1, _id: 0 } },
      { $sort: { sequence: 1 } }
    ]);
  } catch (error) {
    console.error('Error getting sequence distribution:', error);
    return [];
  }
}

export async function getAdvancementHistory(userId, limit = 10) {
  try {
    return await Advancement.find({ user_id: userId })
      .sort({ timestamp: -1 })
      .limit(limit);
  } catch (error) {
    console.error('Error getting advancement history:', error);
    return [];
  }
}

// Export models for direct use if needed
export { User, Advancement, LoseControl, ServerStats };

console.log('✅ MongoDB models initialized');
  
