import json

with open('public/models/character.glb', 'rb') as f:
    data = f.read()
    json_len = int.from_bytes(data[12:16], byteorder='little')
    j = json.loads(data[20:20+json_len].decode('utf-8'))
    
    nodes = j.get('nodes', [])
    for i, n in enumerate(nodes):
        name = n.get('name', '')
        print(f"Node {i}: name='{name}' scale={n.get('scale', [1,1,1])}")
