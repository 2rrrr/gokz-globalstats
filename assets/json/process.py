import json

map_data = []
checked = []

for i in range(8, 0, -1):
    with open('stage' + str(i) + '.json', 'r') as f:
        stage_data = json.load(f)
    for record in stage_data:
        mapName = record['map_name']
        if mapName not in checked:
            checked.append(mapName)
            data = {"map_name": mapName, "stages": i}
            print(data)
            map_data.append(data)

with open('stages.json', 'w') as f:
    json.dump(map_data, f)