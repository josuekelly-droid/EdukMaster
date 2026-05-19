const { createCanvas } = require('canvas');
const fs = require('fs');

function generateIcon(size, filename, text = '🎓', bgColor = '#1E40AF') {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // Fond
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - size*0.05, 0, Math.PI * 2);
  ctx.fill();

  // Texte/Emoji
  ctx.fillStyle = '#FFFFFF';
  ctx.font = `${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, size/2, size/2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(`./assets/${filename}`, buffer);
  console.log(`✅ ${filename} généré (${size}x${size})`);
}

// Icône standard
generateIcon(1024, 'icon.png');
// Icône adaptive (avec marge pour Android)
generateIcon(1024, 'adaptive-icon.png');
// Splash screen
generateIcon(1284, 'splash-icon.png', '🎓', '#1E40AF');

console.log('🚀 Toutes les icônes sont générées !');