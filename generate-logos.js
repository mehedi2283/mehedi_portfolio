import fs from 'fs';
import { createCanvas, loadImage } from 'canvas';
import https from 'https';

const WIDTH = 1404;
const HEIGHT = 966;

const logos = [
  { name: 'n8n', path: './public/images/raw_n8n.png' },
  { name: 'zapier', path: './public/images/raw_zapier.png' },
  { name: 'make', path: './public/images/raw_make.png' },
  { name: 'openai', path: './public/images/raw_openai.png' }
];

async function generateImages() {
  for (const logo of logos) {
    try {
      console.log(`Generating ${logo.name}...`);
      const canvas = createCanvas(WIDTH, HEIGHT);
      const ctx = canvas.getContext('2d');

      // 1. Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 2. Draw soft grey corner shading / vignette
      const gradient = ctx.createRadialGradient(
        WIDTH / 2, HEIGHT / 2, Math.min(WIDTH, HEIGHT) * 0.2, 
        WIDTH / 2, HEIGHT / 2, Math.max(WIDTH, HEIGHT) * 0.8  
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
      gradient.addColorStop(1, 'rgba(200, 200, 200, 0.5)'); 
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // 3. Load from local path
      const img = await loadImage(logo.path);
      
      // Calculate scale to fit nicely (e.g. max 50% width/height)
      const maxDim = Math.min(WIDTH, HEIGHT) * 0.6;
      let imgW = img.width;
      let imgH = img.height;
      const scale = Math.min(maxDim / imgW, maxDim / imgH);
      
      imgW *= scale;
      imgH *= scale;
      
      const x = (WIDTH - imgW) / 2;
      const y = (HEIGHT - imgH) / 2;
      
      ctx.drawImage(img, x, y, imgW, imgH);

      // Save to disk
      const outPath = `public/images/${logo.name}_styled.png`;
      const out = fs.createWriteStream(outPath);
      const stream = canvas.createPNGStream();
      stream.pipe(out);
      
      await new Promise(r => out.on('finish', r));
      console.log(`Saved ${outPath}`);
    } catch (e) {
      console.error(`Failed to generate ${logo.name}:`, e);
    }
  }
}

generateImages();
