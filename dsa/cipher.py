def _shift(char, s):
    """Shift a single alphabetic character by s; non-alpha chars pass through."""
    if char.isupper():
        return chr((ord(char) + s - 65) % 26 + 65)
    if char.islower():
        return chr((ord(char) + s - 97) % 26 + 97)
    return char


def encrypt(text, s):
    """Caesar cipher: shift each letter forward by s. Non-letters unchanged."""
    return "".join(_shift(ch, s) for ch in text)


def decrypt(ciphertext, s):
    """Reverse of encrypt: shift each letter back by s."""
    return "".join(_shift(ch, -s) for ch in ciphertext)


if __name__ == "__main__":
    text = "ATTACKATONCE"
    s = 4
    print("Text  : " + text)
    print("Shift : " + str(s))
    print("Cipher: " + encrypt(text, s))

    ciphertext = "EXXEGOEXSRGI"
    s = 4
    print("Cipher   : " + ciphertext)
    print("Shift    : " + str(s))
    print("Decrypted: " + decrypt(ciphertext, s))
