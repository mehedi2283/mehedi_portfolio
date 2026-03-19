import fs from 'fs';
import { createCanvas } from 'canvas';

const WIDTH = 1404;
const HEIGHT = 966;

['n8n', 'zapier', 'make', 'openai'].forEach(name => {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  
  // Fill white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Soft border
  const gradient = ctx.createRadialGradient(
    WIDTH / 2, HEIGHT / 2, Math.min(WIDTH, HEIGHT) * 0.2, 
    WIDTH / 2, HEIGHT / 2, Math.max(WIDTH, HEIGHT) * 0.8  
  );
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  gradient.addColorStop(1, 'rgba(200, 200, 200, 0.5)'); 
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Text fallback since logos failed
  ctx.fillStyle = '#000000';
  ctx.font = 'bold 200px Arial';
  if (name === 'zapier') ctx.fillStyle = '#FF4A00';
  if (name === 'make') ctx.fillStyle = '#7721C0';
  if (name === 'n8n') ctx.fillStyle = '#FF6D5A';

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  let label = name === 'n8n' ? 'n8n' : 
              name === 'zapier' ? 'Zapier' : 
              name === 'make' ? 'Make' : 'OpenAI';
              
  ctx.fillText(label, WIDTH/2, HEIGHT/2);

  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('./public/images/' + name + '_styled.png', buffer);
  console.log('Saved ' + name);
});
