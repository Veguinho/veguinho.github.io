f = open("SP.pto", "r")
s = f.readlines()
content = [s.strip().split() for s in s] 
float_content = []
for i in content:
    float_content.append([float(s) for s in i])
colunas = int(float_content[2][0])
linhas = int(float_content[2][1])

hights = float_content[3:]


n = 100 #Normalizing factor
position = []
for l in range(linhas):
    for c in range(colunas):
        #Inserts vertex (representing the map square unit) for each row * column
        #The y value is set according to the hights vector indicating elevation of coordinate
        position.append(float(c))
        position.append(hights[l][c]/n)
        position.append(float(l))

indices = []
for l in range(linhas-1):
    for c in range(colunas-1):
        #triangle1
        indices.append(l*colunas+c)
        indices.append(l*colunas+c+1)
        indices.append((l+1)*colunas+c)
        #triangle2
        indices.append((l+1)*colunas+c+1)
        indices.append(l*colunas+c+1)
        indices.append((l+1)*colunas+c)

hights_new = [] #Vector used for colors
for sub in hights:
    for i in sub:
        hights_new.append(i/1200)

print(len(indices))
# with open('out.txt', 'w') as f:
#     f.write(str(flat_list_position))
# f.close()