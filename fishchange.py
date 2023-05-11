import re
with open('./rawfish.txt') as f:
    for contents in f.readlines():
        test = contents
        split = ''.join((char if char.isalpha() or char == ' ' else ' '
                        ) for char in test).split()
        joined = ' '.join(split)
        if len(joined) > 3:
            print(joined)
