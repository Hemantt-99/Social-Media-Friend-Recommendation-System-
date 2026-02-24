const PriorityQueue = require('../utils/PriorityQueue');

class LocationService {
  haversineDistanceKm(pointA, pointB) {
    const toRadians = (degrees) => (degrees * Math.PI) / 180;
    const earthRadiusKm = 6371;

    const dLat = toRadians(pointB.latitude - pointA.latitude);
    const dLon = toRadians(pointB.longitude - pointA.longitude);
    const lat1 = toRadians(pointA.latitude);
    const lat2 = toRadians(pointB.latitude);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusKm * c;
  }

  // Weighted graph: each edge weight is geo distance.
  buildWeightedGraph(users) {
    const weightedGraph = new Map();

    for (const user of users) {
      weightedGraph.set(user.userId, []);
    }

    for (let i = 0; i < users.length; i += 1) {
      for (let j = i + 1; j < users.length; j += 1) {
        const source = users[i];
        const target = users[j];
        const weight = this.haversineDistanceKm(source.location, target.location);

        weightedGraph.get(source.userId).push({ to: target.userId, weight });
        weightedGraph.get(target.userId).push({ to: source.userId, weight });
      }
    }

    return weightedGraph;
  }

  // Manual Dijkstra using Min Heap to fetch closest next user efficiently.
  dijkstraNearestUsers(startUserId, weightedGraph, radiusKm = 100) {
    const distances = new Map();

    for (const nodeId of weightedGraph.keys()) {
      distances.set(nodeId, Infinity);
    }

    if (!distances.has(startUserId)) {
      return [];
    }

    distances.set(startUserId, 0);

    const minHeap = new PriorityQueue((a, b) => b.distance - a.distance);
    minHeap.enqueue({ userId: startUserId, distance: 0 });

    while (!minHeap.isEmpty()) {
      const current = minHeap.dequeue();
      if (!current || current.distance > distances.get(current.userId)) {
        continue;
      }

      const neighbors = weightedGraph.get(current.userId) || [];
      for (const edge of neighbors) {
        const newDistance = current.distance + edge.weight;
        if (newDistance < distances.get(edge.to)) {
          distances.set(edge.to, newDistance);
          minHeap.enqueue({ userId: edge.to, distance: newDistance });
        }
      }
    }

    const nearby = [];
    for (const [userId, distance] of distances.entries()) {
      if (userId !== startUserId && distance <= radiusKm) {
        nearby.push({ userId, distanceKm: Number(distance.toFixed(2)) });
      }
    }

    nearby.sort((a, b) => a.distanceKm - b.distanceKm);
    return nearby;
  }
}

module.exports = new LocationService();
