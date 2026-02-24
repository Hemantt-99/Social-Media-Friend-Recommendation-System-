class PriorityQueue {
  constructor(comparator) {
    this.heap = [];
    this.comparator = comparator;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.size() === 0;
  }

  peek() {
    return this.heap[0] ?? null;
  }

  enqueue(value) {
    this.heap.push(value);
    this.bubbleUp(this.size() - 1);
  }

  dequeue() {
    if (this.isEmpty()) {
      return null;
    }

    this.swap(0, this.size() - 1);
    const top = this.heap.pop();
    this.bubbleDown(0);
    return top;
  }

  bubbleUp(index) {
    let current = index;

    while (current > 0) {
      const parent = Math.floor((current - 1) / 2);

      if (this.comparator(this.heap[current], this.heap[parent]) <= 0) {
        break;
      }

      this.swap(current, parent);
      current = parent;
    }
  }

  bubbleDown(index) {
    let current = index;

    while (true) {
      const left = current * 2 + 1;
      const right = current * 2 + 2;
      let best = current;

      if (left < this.size() && this.comparator(this.heap[left], this.heap[best]) > 0) {
        best = left;
      }

      if (right < this.size() && this.comparator(this.heap[right], this.heap[best]) > 0) {
        best = right;
      }

      if (best === current) {
        break;
      }

      this.swap(current, best);
      current = best;
    }
  }

  swap(i, j) {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}

module.exports = PriorityQueue;
