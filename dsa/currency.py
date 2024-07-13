def format_number(input_str):
    length = len(input_str)
    i = 0
    while i < length:
        if input_str[i] == ",":
            input_str = input_str[:i] + input_str[i + 1:]
            length -= 1
            i -= 1
        else:
            i += 1

    reversed_input = input_str[::-1]
    output = ""

    for i in range(length):
        if i == 2:
            output += reversed_input[i]
            output += ","
        elif i > 2 and i % 2 == 0 and i + 1 < length:
            output += reversed_input[i]
            output += ","
        else:
            output += reversed_input[i]

    output = output[::-1]
    return output

# Driver code
input1 = "123,456,789"
input2 = "90,050,000,000"
print(format_number(input1))
print(format_number(input2))
