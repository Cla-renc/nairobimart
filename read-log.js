const fs = require('fs');
const content = fs.readFileSync('server.log', 'utf16le');
console.log(content.slice(-10000));
