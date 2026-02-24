const User = require('../models/User');

class UserStoreService {
  constructor() {
    this.useInMemory = String(process.env.USE_IN_MEMORY_DB || 'false') === 'true';
    this.memoryUsers = new Map();
  }

  normalizeUser(user) {
    return {
      userId: user.userId,
      username: user.username,
      name: user.name || '',
      location: {
        latitude: Number(user.location.latitude),
        longitude: Number(user.location.longitude),
      },
      friends: Array.from(new Set(user.friends || [])),
      interests: Array.from(new Set(user.interests || [])),
    };
  }

  async create(userData) {
    if (this.useInMemory) {
      const normalized = this.normalizeUser(userData);
      this.memoryUsers.set(normalized.userId, normalized);
      return normalized;
    }

    return User.create(userData);
  }

  async findOneByUserId(userId, lean = false) {
    if (this.useInMemory) {
      return this.memoryUsers.get(userId) || null;
    }

    if (lean) {
      return User.findOne({ userId }).lean();
    }

    return User.findOne({ userId });
  }

  async findAll(lean = false) {
    if (this.useInMemory) {
      return Array.from(this.memoryUsers.values());
    }

    if (lean) {
      return User.find({}).lean();
    }

    return User.find({});
  }

  async addFriendBothWays(userId, friendId) {
    if (this.useInMemory) {
      const user = this.memoryUsers.get(userId);
      const friend = this.memoryUsers.get(friendId);

      if (!user || !friend) {
        return null;
      }

      if (!user.friends.includes(friendId)) {
        user.friends.push(friendId);
      }

      if (!friend.friends.includes(userId)) {
        friend.friends.push(userId);
      }

      this.memoryUsers.set(userId, user);
      this.memoryUsers.set(friendId, friend);
      return { user, friend };
    }

    const [user, friend] = await Promise.all([
      User.findOne({ userId }),
      User.findOne({ userId: friendId }),
    ]);

    if (!user || !friend) {
      return null;
    }

    if (!user.friends.includes(friendId)) {
      user.friends.push(friendId);
    }
    if (!friend.friends.includes(userId)) {
      friend.friends.push(userId);
    }

    await Promise.all([user.save(), friend.save()]);
    return { user, friend };
  }

  async deleteByUserId(userId) {
    if (this.useInMemory) {
      const exists = this.memoryUsers.has(userId);
      if (!exists) {
        return false;
      }

      this.memoryUsers.delete(userId);

      for (const [id, user] of this.memoryUsers.entries()) {
        if (user.friends.includes(userId)) {
          user.friends = user.friends.filter((friendId) => friendId !== userId);
          this.memoryUsers.set(id, user);
        }
      }

      return true;
    }

    const deleted = await User.findOneAndDelete({ userId });
    if (!deleted) {
      return false;
    }

    await User.updateMany({}, { $pull: { friends: userId } });
    return true;
  }
}

module.exports = new UserStoreService();
