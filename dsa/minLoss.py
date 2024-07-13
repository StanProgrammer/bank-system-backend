def minimize_loss(prices):
    min_loss = float('inf')

    buy_year = -1
    sell_year = -1
    for sell_index in range(1, len(prices)):
        for buy_index in range(sell_index):
            if prices[buy_index] > prices[sell_index]:
                current_loss = prices[buy_index] - prices[sell_index]
                if current_loss < min_loss:
                    min_loss = current_loss
                    buy_year = buy_index + 1
                    sell_year = sell_index + 1
    if buy_year == -1 or sell_year == -1:
        return -1

    return f"Buy in year {buy_year} and sell in year {sell_year} with a loss of {min_loss}"

# Example usage
prices = [20, 15, 7, 2, 20]
print(minimize_loss(prices))
