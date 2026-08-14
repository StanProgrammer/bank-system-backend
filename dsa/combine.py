def combine_elements(list1, list2, merge_ratio=0.5):
    """
    Merge two lists of {positions: [start, end], values: [...]} elements.

    Classic interval-merge: sort by start, then fold left. Two adjacent
    intervals are merged when they overlap by more than `merge_ratio` of the
    *incoming* element's length (default 0.5 keeps the original behaviour).

    O(n log n) where n = len(list1) + len(list2).
    """
    elements = sorted(list1 + list2, key=lambda x: x["positions"][0])
    result = []

    for element in elements:
        if not result:
            result.append(element)
            continue

        last = result[-1]
        overlap = (
            min(last["positions"][1], element["positions"][1])
            - max(last["positions"][0], element["positions"][0])
        )
        element_len = element["positions"][1] - element["positions"][0]

        if overlap > 0 and overlap > merge_ratio * element_len:
            last["positions"][1] = max(last["positions"][1], element["positions"][1])
            last["values"].extend(element["values"])
        else:
            result.append(element)

    return result


if __name__ == "__main__":
    list1 = [
        {"positions": [1, 3], "values": ["a", "b"]},
        {"positions": [5, 7], "values": ["c"]},
    ]
    list2 = [
        {"positions": [2, 4], "values": ["d", "e"]},
        {"positions": [6, 8], "values": ["f"]},
    ]
    print(combine_elements(list1, list2))
