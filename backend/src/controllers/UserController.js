const recommendationService = require('../services/RecommendationService');
const userStore = require('../services/UserStoreService');

class UserController {
  async listUsers(req, res) {
    try {
      const users = await userStore.findAll(true);
      return res.status(200).json({
        total: users.length,
        users,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async createUser(req, res) {
    try {
      const { userId, username, name = '', location, friends = [], interests = [] } = req.body;

      if (!userId || !username || !location) {
        return res.status(400).json({
          message: 'userId, username and location are required',
        });
      }

      const existing = await userStore.findOneByUserId(userId);
      if (existing) {
        return res.status(409).json({ message: 'User already exists' });
      }

      const user = await userStore.create({ userId, username, name, location, friends, interests });
      return res.status(201).json(user);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const deleted = await userStore.deleteByUserId(userId);

      if (!deleted) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ message: 'User deleted successfully', userId });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async addFriend(req, res) {
    try {
      const { userId } = req.params;
      const { friendId } = req.body;

      if (!friendId) {
        return res.status(400).json({ message: 'friendId is required' });
      }

      if (friendId === userId) {
        return res.status(400).json({ message: 'User cannot friend themselves' });
      }

      const linked = await userStore.addFriendBothWays(userId, friendId);
      if (!linked) {
        return res.status(404).json({ message: 'User or friend not found' });
      }

      return res.status(200).json({
        message: 'Friend added successfully',
        userId,
        friendId,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getUserProfile(req, res) {
    try {
      const { userId } = req.params;
      const user = await userStore.findOneByUserId(userId, true);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user);
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }

  async getRecommendations(req, res) {
    try {
      const { userId } = req.params;
      const user = await userStore.findOneByUserId(userId, true);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const users = await userStore.findAll(true);
      const recommendations = recommendationService.getRecommendationsForUser(userId, users, {
        radiusKm: Number(req.query.radiusKm ?? 100),
        mutualFriendWeight: Number(req.query.mutualFriendWeight ?? 2),
        locationWeight: Number(req.query.locationWeight ?? 100),
        interestWeight: Number(req.query.interestWeight ?? 1),
        limit: Number(req.query.limit ?? 10),
      });

      return res.status(200).json({
        userId,
        total: recommendations.length,
        recommendations,
      });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new UserController();
