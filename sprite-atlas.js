const dirTree = require('directory-tree');
const fs = require('fs');

const tree = dirTree('./sprites', {
  extensions: /\.(png)$/,
  normalizePath: true
});

const atlas = JSON.stringify(tree, undefined, 4);
fs.writeFileSync('./src/sprite-atlas.json', atlas);
