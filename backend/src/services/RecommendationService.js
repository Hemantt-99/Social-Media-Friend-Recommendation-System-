const PriorityQueue = require('../utils/PriorityQueue');
const graphService = require('./GraphService');
const locationService = require('./LocationService');

class RecommendationService {
  getInterestSimilarityScore(sourceInterests, targetInterests) {
    const sourceSet = new Set((sourceInterests || []).map((item) => item.toLowerCase()));
    const targetSet = new Set((targetInterests || []).map((item) => item.toLowerCase()));

    const unionSet = new Set([...sourceSet, ...targetSet]);
    if (unionSet.size === 0) {
      return 0;
    }

    let intersectionCount = 0;
    for (const interest of sourceSet) {
      if (targetSet.has(interest)) {
        intersectionCount += 1;
      }
    }

    // Set intersection for interest similarity (Jaccard).
    return Number((intersectionCount / unionSet.size).toFixed(4));
  }

  getRecommendationsForUser(targetUserId, users, options = {}) {
    const {
      radiusKm = 100,
      mutualFriendWeight = 2,
      locationWeight = 100,
      interestWeight = 1,
      limit = 10,
    } = options;

    const userMap = new Map(users.map((user) => [user.userId, user]));
    const targetUser = userMap.get(targetUserId);
    if (!targetUser) {
      return [];
    }

    const adjacencyList = graphService.buildAdjacencyList(users);
    const mutualCounts = graphService.getMutualFriendCandidatesBFS(targetUserId, adjacencyList);
    const weightedGraph = locationService.buildWeightedGraph(users);
    const nearbyUsers = locationService.dijkstraNearestUsers(targetUserId, weightedGraph, radiusKm);

    const nearbyMap = new Map(nearbyUsers.map((entry) => [entry.userId, entry.distanceKm]));
    const excludedIds = new Set([targetUserId, ...(targetUser.friends || [])]);
    const candidateIds = new Set([...mutualCounts.keys(), ...nearbyMap.keys()]);

    // Max Heap for final hybrid-score ranking.
    const recommendationHeap = new PriorityQueue((a, b) => a.score - b.score);

    for (const candidateId of candidateIds) {
      if (excludedIds.has(candidateId)) {
        continue;
      }

      const candidate = userMap.get(candidateId);
      if (!candidate) {
        continue;
      }

      const mutualCount = mutualCounts.get(candidateId) || 0;
      const distanceKm = nearbyMap.get(candidateId) ?? null;
      const interestSimilarity = this.getInterestSimilarityScore(
        targetUser.interests,
        candidate.interests
      );

      const locationComponent = distanceKm && distanceKm > 0 ? locationWeight / distanceKm : 0;

      const score =
        mutualFriendWeight * mutualCount +
        locationComponent +
        interestWeight * interestSimilarity;

      recommendationHeap.enqueue({
        userId: candidate.userId,
        username: candidate.username,
        name: candidate.name || '',
        mutualFriends: mutualCount,
        distanceKm,
        interestSimilarity,
        score: Number(score.toFixed(4)),
      });
    }

    const recommendations = [];
    while (!recommendationHeap.isEmpty() && recommendations.length < limit) {
      recommendations.push(recommendationHeap.dequeue());
    }

    return recommendations;
  }
}

module.exports = new RecommendationService();
