def format_number(input_str):
    """
    Format a number string in the Indian numbering system (last 3 digits,
    then groups of 2) in O(n). The previous version mutated the string inside
    a loop (O(n^2) due to repeated slicing); this builds groups once.
    """
    digits = input_str.replace(",", "")
    n = len(digits)

    if n <= 3:
        return digits

    groups = [digits[-3:]]
    rest = digits[:-3]
    while rest:
        groups.append(rest[-2:])
        rest = rest[:-2]

    return ",".join(reversed(groups))


if __name__ == "__main__":
    input1 = "123,456,789"
    input2 = "90,050,000,000"
    print(format_number(input1))
    print(format_number(input2))
