/**
 * DSA utilities used by the API. Each structure/algorithm is small, pure and
 * unit-tested (see tests/dsa.test.js).
 */

/**
 * Minimum Loss problem (HackerRank classic), O(n log n).
 * Given a price series, find the buy/sell pair (buy before sell, buy price >
 * sell price) with the smallest positive loss.
 *
 * @param {number[]} prices
 * @returns {{ minLoss: number, buyIndex: number, sellIndex: number } | null}
 */
function minimumLoss(prices) {
  if (!Array.isArray(prices) || prices.length < 2) return null;

  // Sort (price, index) pairs by price. The minimal positive loss between a
  // higher-earlier price and a lower-later price always appears between two
  // *adjacent* entries in sorted order.
  const pairs = prices.map((price, index) => ({ price, index }));
  pairs.sort((a, b) => a.price - b.price || a.index - b.index);

  let best = null;
  for (let i = 1; i < pairs.length; i++) {
    const cheaper = pairs[i - 1];
    const pricier = pairs[i];
    // Buy the pricier one earlier, sell the cheaper one later.
    if (pricier.index < cheaper.index) {
      const loss = pricier.price - cheaper.price; // always > 0
      if (!best || loss < best.minLoss) {
        best = { minLoss: loss, buyIndex: pricier.index, sellIndex: cheaper.index };
      }
    }
  }

  return best;
}

/** Simple prefix Trie (lowercase). */
class Trie {
  constructor() {
    this.root = { children: {}, end: false };
  }

  insert(word) {
    let node = this.root;
    for (const ch of word.toLowerCase()) {
      if (!node.children[ch]) node.children[ch] = { children: {}, end: false };
      node = node.children[ch];
    }
    node.end = true;
  }

  /** All stored words that start with `prefix` (DFS). */
  search(prefix, limit = 20) {
    const results = [];
    let node = this.root;
    for (const ch of prefix.toLowerCase()) {
      if (!node.children[ch]) return results;
      node = node.children[ch];
    }
    const walk = (n, acc) => {
      if (results.length >= limit) return;
      if (n.end) results.push(acc);
      for (const [ch, child] of Object.entries(n.children)) {
        walk(child, acc + ch);
      }
    };
    walk(node, prefix.toLowerCase());
    return results;
  }
}

/** Binary min-heap. */
class MinHeap {
  constructor() {
    this.items = [];
  }

  get size() {
    return this.items.length;
  }

  peek() {
    return this.items[0] ?? null;
  }

  push(value) {
    this.items.push(value);
    this._bubbleUp(this.items.length - 1);
  }

  pop() {
    if (this.items.length === 0) return null;
    const top = this.items[0];
    const last = this.items.pop();
    if (this.items.length > 0) {
      this.items[0] = last;
      this._bubbleDown(0);
    }
    return top;
  }

  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.items[parent] <= this.items[i]) break;
      [this.items[parent], this.items[i]] = [this.items[i], this.items[parent]];
      i = parent;
    }
  }

  _bubbleDown(i) {
    const n = this.items.length;
    while (true) {
      const left = 2 * i + 1;
      const right = 2 * i + 2;
      let smallest = i;
      if (left < n && this.items[left] < this.items[smallest]) smallest = left;
      if (right < n && this.items[right] < this.items[smallest]) smallest = right;
      if (smallest === i) break;
      [this.items[smallest], this.items[i]] = [this.items[i], this.items[smallest]];
      i = smallest;
    }
  }
}

/**
 * Top-K selection with a size-K min-heap: O(n log k).
 * `keyFn` maps each value to the number used for comparison.
 * Returns the k largest values (by key), sorted descending by key.
 */
function topK(values, k, keyFn = (v) => v) {
  if (k <= 0) return [];
  const heap = new MinHeap();
  for (const v of values) {
    if (heap.size < k) {
      heap.push(v);
    } else if (keyFn(v) > keyFn(heap.peek())) {
      heap.pop();
      heap.push(v);
    }
  }
  return heap.items.sort((a, b) => keyFn(b) - keyFn(a));
}

/** Disjoint-set union with path compression + union by rank. */
class UnionFind {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, i) => i);
    this.rank = new Array(size).fill(0);
  }

  find(x) {
    if (this.parent[x] !== x) {
      this.parent[x] = this.find(this.parent[x]); // path compression
    }
    return this.parent[x];
  }

  union(a, b) {
    let ra = this.find(a);
    let rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra] += 1;
  }

  /** Map each root -> member indices, only including clusters of size >= 2. */
  clusters(minSize = 2) {
    const groups = new Map();
    for (let i = 0; i < this.parent.length; i++) {
      const root = this.find(i);
      if (!groups.has(root)) groups.set(root, []);
      groups.get(root).push(i);
    }
    return [...groups.values()].filter((g) => g.length >= minSize);
  }
}

module.exports = { minimumLoss, Trie, MinHeap, topK, UnionFind };
