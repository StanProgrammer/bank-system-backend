def minimize_loss(prices):
    """
    Minimum Loss problem (HackerRank classic), O(n log n).

    Find the pair (buy before sell, buy price > sell price) with the smallest
    positive loss. Sort (price, index) pairs by price: the minimal positive
    loss always shows up between two *adjacent* entries in sorted order, so a
    single scan after sorting is enough (no O(n^2) nested loop).
    """
    if not prices or len(prices) < 2:
        return -1

    pairs = sorted((price, i) for i, price in enumerate(prices))

    best = None  # (loss, buy_index, sell_index)
    for i in range(1, len(pairs)):
        prev_price, prev_index = pairs[i - 1]
        price, index = pairs[i]

        # Buy the pricier entry earlier, sell the cheaper one later.
        if index < prev_index:
            loss = price - prev_price  # always > 0 here
            if best is None or loss < best[0]:
                best = (loss, index, prev_index)

    if best is None:
        return -1

    loss, buy_year, sell_year = best
    return f"Buy in year {buy_year + 1} and sell in year {sell_year + 1} with a loss of {loss}"


if __name__ == "__main__":
    prices = [20, 15, 7, 2, 20]
    print(minimize_loss(prices))
