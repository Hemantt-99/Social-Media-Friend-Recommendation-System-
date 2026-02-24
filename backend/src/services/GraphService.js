const PriorityQueue = require('../utils/PriorityQueue');

class GraphService {
  // Graph DS: Adjacency List for an undirected friendship graph.
  buildAdjacencyList(users) {
    const adjacencyList = new Map();

    for (const user of users) {
      if (!adjacencyList.has(user.userId)) {
        adjacencyList.set(user.userId, new Set());
      }

      for (const friendId of user.friends || []) {
        if (!adjacencyList.has(friendId)) {
          adjacencyList.set(friendId, new Set());
        }

        adjacencyList.get(user.userId).add(friendId);
        adjacencyList.get(friendId).add(user.userId);
      }
    }

    return adjacencyList;
  }

  // BFS up to depth=2 (friends-of-friends) + HashMap mutual counting.
  getMutualFriendCandidatesBFS(startUserId, adjacencyList) {
    const directFriends = adjacencyList.get(startUserId) || new Set();
    const queue = [{ nodeId: startUserId, depth: 0, viaFriend: null }];
    const candidateToMutualSet = new Map();

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = adjacencyList.get(current.nodeId) || new Set();

      if (current.depth === 0) {
        for (const friendId of neighbors) {
          queue.push({ nodeId: friendId, depth: 1, viaFriend: friendId });
        }
        continue;
      }

      if (current.depth === 1) {
        for (const candidateId of neighbors) {
          if (candidateId === startUserId || directFriends.has(candidateId)) {
            continue;
          }

          if (!candidateToMutualSet.has(candidateId)) {
            candidateToMutualSet.set(candidateId, new Set());
          }

          candidateToMutualSet.get(candidateId).add(current.viaFriend);
        }
      }
    }

    const mutualCounts = new Map();
    for (const [candidateId, mutualSet] of candidateToMutualSet.entries()) {
      mutualCounts.set(candidateId, mutualSet.size);
    }

    return mutualCounts;
  }

  // Max Heap ranking by mutual friend count.
  rankByMutualFriends(mutualCounts) {
    const maxHeap = new PriorityQueue(
      (a, b) => a.mutualCount - b.mutualCount || b.candidateId.localeCompare(a.candidateId)
    );

    for (const [candidateId, mutualCount] of mutualCounts.entries()) {
      maxHeap.enqueue({ candidateId, mutualCount });
    }

    const ranked = [];
    while (!maxHeap.isEmpty()) {
      ranked.push(maxHeap.dequeue());
    }

    return ranked;
  }
}

module.exports = new GraphService();
