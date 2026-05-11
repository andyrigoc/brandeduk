const fs = require('fs');

const content = fs.readFileSync('home-pc.html', 'utf8');

const fixed = content
  .replace(/â†'/g, '&rarr;')   // Right arrow
  .replace(/â€"/g, '&mdash;')   // Em dash
  .replace(/â€¢/g, '&bull;')    // Bullet
  .replace(/Â®/g, '&reg;')     // Registered
  .replace(/Â°/g, '&deg;');    // Degree

fs.writeFileSync('home-pc.html', fixed, 'utf8');

console.log('Fixed encoding issues!');
