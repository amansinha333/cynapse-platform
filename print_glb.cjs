const fs = require('fs');

const data = fs.readFileSync('public/models/character.glb');
const magic = data.readUInt32LE(0);
const version = data.readUInt32LE(4);
const length = data.readUInt32LE(8);
const chunkLength = data.readUInt32LE(12);
const chunkType = data.readUInt32LE(16);

if (chunkType === 0x4E4F534A) { // 'JSON'
    const jsonData = data.subarray(20, 20 + chunkLength).toString('utf8');
    const gltf = JSON.parse(jsonData);
    
    console.log('Hierarchy:');
    function printNode(index, depth) {
      const node = gltf.nodes[index];
      const indent = "  ".repeat(depth);
      console.log(`${indent}Node ${index}: ${node.name || 'unnamed'}`);
      if (node.children) {
        node.children.forEach(childIndex => printNode(childIndex, depth + 1));
      }
    }

    if (gltf.scenes && gltf.scenes.length > 0) {
      const scene = gltf.scenes[gltf.scene || 0];
      if (scene.nodes) {
        scene.nodes.forEach(rootNodeIndex => printNode(rootNodeIndex, 0));
      }
    }
}
