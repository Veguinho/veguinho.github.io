f = open("SP.pto", "r")
s = f.readlines()
content = [s.strip().split() for s in s] 
float_content = []
for i in content:
    float_content.append([float(s) for s in i])
colunas = int(float_content[2][0])
linhas = int(float_content[2][1])

latitude_max_min = float_content[0:1][0]
longitude_max_min = float_content[1:2][0]

hights = float_content[3:]


n = 100 #Normalizing factor
position = []
for l in range(linhas):
    for c in range(colunas):
        #Inserts vertex (representing the map square unit) for each row * column
        #The y value is set according to the hights vector indicating elevation of coordinate
        position.append(float(c))
        position.append(-hights[l][c]/n)
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

f2 = open("SP.ctr", "r")
s = f2.readlines()
content2 = [s.strip().split() for s in s] 
float_content_ctr = []
for i in content2:
    float_content_ctr.append([-float(s) for s in i])

line_coords = float_content_ctr[1:]

line_position = []

for coord in line_coords:
    #Inserts vertex (representing the map square unit) for each row * column
    #The y value is set according to the hights vector indicating elevation of coordinate
    y = (-float(coord[1])-latitude_max_min[1])*((linhas-1)/(-latitude_max_min[1]+latitude_max_min[0]))
    x = (-float(coord[0])-longitude_max_min[1])*((colunas-1)/(-longitude_max_min[1]+longitude_max_min[0]))
    line_position.append(x)
    line_position.append(-2-hights[int(y)][int(x)]/n)
    line_position.append(y)

print(line_position)