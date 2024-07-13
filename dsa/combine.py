def combine_elements(list1, list2):
    combined_list = sorted(list1 + list2, key=lambda x: x['positions'][0])
    result = []

    for element in combined_list:
        if not result:
            result.append(element)
        else:
            last = result[-1]
            if (element['positions'][0] >= last['positions'][0] and 
                element['positions'][0] <= last['positions'][1] and
                (min(last['positions'][1], element['positions'][1]) - max(last['positions'][0], element['positions'][0])) > 0.5 * (element['positions'][1] - element['positions'][0])):
                last['positions'][1] = max(last['positions'][1], element['positions'][1])
                last['values'].extend(element['values'])
            else:
                result.append(element)

    return result

# Example usage
list1 = [
    {
        "positions": [1, 3],
        "values": ["a", "b"]
    },
    {
        "positions": [5, 7],
        "values": ["c"]
    }
]

list2 = [
    {
        "positions": [2, 4],
        "values": ["d", "e"]
    },
    {
        "positions": [6, 8],
        "values": ["f"]
    }
]

combined_result = combine_elements(list1, list2)
print(combined_result)
