const test = require('node:test');
const assert = require('node:assert/strict');
const { minimumLoss, Trie, MinHeap, topK, UnionFind } = require('../utils/dsa');

function bruteMinLoss(prices) {
  let best = null;
  for (let buy = 0; buy < prices.length; buy++) {
    for (let sell = buy + 1; sell < prices.length; sell++) {
      if (prices[buy] > prices[sell]) {
        const loss = prices[buy] - prices[sell];
        if (best === null || loss < best) best = loss;
      }
    }
  }
  return best;
}

test('minimumLoss known case (ties are any minimal pair)', () => {
  // Two pairs tie at loss 5: (20,15) and (7,2). Either is correct.
  const prices = [20, 15, 7, 2, 20];
  const r = minimumLoss(prices);
  assert.equal(r.minLoss, 5);
  assert.equal(prices[r.buyIndex] - prices[r.sellIndex], 5);
  assert.ok(r.buyIndex < r.sellIndex);
});

test('minimumLoss matches brute force on random arrays', () => {
  let seed = 1234;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let t = 0; t < 300; t++) {
    const n = 2 + Math.floor(rand() * 10);
    const prices = Array.from({ length: n }, () => 1 + Math.floor(rand() * 40));
    const expected = bruteMinLoss(prices);
    const got = minimumLoss(prices);
    if (expected === null) {
      assert.equal(got, null);
    } else {
      assert.equal(got.minLoss, expected);
      assert.ok(got.buyIndex < got.sellIndex);
      assert.ok(prices[got.buyIndex] > prices[got.sellIndex]);
    }
  }
});

test('minimumLoss rejects tiny arrays', () => {
  assert.equal(minimumLoss([]), null);
  assert.equal(minimumLoss([5]), null);
});

test('Trie insert + prefix search', () => {
  const t = new Trie();
  ['Home Loan', 'Car Loan', 'Education Loan', 'Gold Loan'].forEach((w) => t.insert(w));
  assert.deepEqual(t.search('car'), ['car loan']);
  assert.deepEqual(t.search('ho'), ['home loan']);
  assert.deepEqual(t.search('g'), ['gold loan']);
  assert.deepEqual(t.search('xyz'), []);
});

test('MinHeap ordering', () => {
  const heap = new MinHeap();
  [5, 3, 8, 1, 9, 2].forEach((v) => heap.push(v));
  const out = [];
  while (heap.size) out.push(heap.pop());
  assert.deepEqual(out, [1, 2, 3, 5, 8, 9]);
});

test('topK returns k largest sorted desc', () => {
  const values = [5, 1, 9, 3, 7, 2, 8];
  assert.deepEqual(topK(values, 3), [9, 8, 7]);
  assert.deepEqual(topK(values, 10).sort((a, b) => a - b), values.sort((a, b) => a - b));
  assert.deepEqual(topK([], 3), []);
});

test('topK works with a key function', () => {
  const items = [{ b: 5 }, { b: 9 }, { b: 1 }, { b: 7 }];
  const top = topK(items, 2, (x) => x.b);
  assert.deepEqual(top.map((x) => x.b), [9, 7]);
});

test('UnionFind clusters', () => {
  const uf = new UnionFind(6);
  uf.union(0, 2); // cluster A
  uf.union(2, 4); // cluster A grows
  uf.union(1, 3); // cluster B
  const clusters = uf.clusters(2).map((c) => c.sort((a, b) => a - b));
  assert.deepEqual(clusters, [
    [0, 2, 4],
    [1, 3],
  ]);
  assert.equal(uf.find(4), uf.find(0));
});
