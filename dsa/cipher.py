# Encryption
def encrypt(text,s):
    result = ""

    
    for i in range(len(text)):
        char = text[i]

        # Encrypt uppercase characters
        if (char.isupper()):
            result += chr((ord(char) + s-65) % 26 + 65)

        # Encrypt lowercase characters
        else:
            result += chr((ord(char) + s - 97) % 26 + 97)

    return result

#check the above function
text = "ATTACKATONCE"
s = 4
print ("Text  : " + text)
print ("Shift : " + str(s))
print ("Cipher: " + encrypt(text,s))


def decrypt(ciphertext, s):
    result = ""
    
    for i in range(len(ciphertext)):
        char = ciphertext[i]

        # Decrypt uppercase characters
        if char.isupper():
            result += chr((ord(char) - s - 65) % 26 + 65)
        
        # Decrypt lowercase characters
        else:
            result += chr((ord(char) - s - 97) % 26 + 97)

    return result

ciphertext = "EXXEGOEXSRGI"
s = 4
print ("Cipher   : " + ciphertext)
print ("Shift    : " + str(s))
print ("Decrypted: " + decrypt(ciphertext, s))
