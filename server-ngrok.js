const express = require('express');
const app = express();
const path = require('path');
const os = require('os');
const ngrok = require('ngrok');

// Serve static files from the current directory
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`\n🎬 GIF Meme Generator running locally at: http://localhost:${PORT}`);
  
  try {
    // Start ngrok tunnel
    const url = await ngrok.connect({
      addr: PORT,
      region: 'us'
    });
    
    console.log(`\n📱 Mobile access URL: ${url}`);
    console.log('\nShare this URL to access your app from any device');
    console.log('Press Ctrl+C to stop the server');
  } catch (err) {
    console.error('Error creating ngrok tunnel:', err);
    console.log('\nFallback to local network access:');
    
    // Get local IP as fallback
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]) {
        if (iface.family === 'IPv4' && !iface.internal) {
          console.log(`Local network URL: http://${iface.address}:${PORT}`);
        }
      }
    }
  }
});
