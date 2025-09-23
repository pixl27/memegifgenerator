const express = require('express');
const app = express();
const path = require('path');
const os = require('os');
const ngrok = require('ngrok');

// Serve static files from the current directory
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Function to get local IP addresses
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  return addresses;
}

// Start the server
const server = app.listen(PORT, async () => {
  console.log(`\n🎬 GIF Meme Generator running locally at: http://localhost:${PORT}`);
  
  // Show local network URLs
  const localIps = getLocalIpAddresses();
  if (localIps.length > 0) {
    console.log('\nLocal network URLs:');
    localIps.forEach(ip => {
      console.log(`http://${ip}:${PORT}`);
    });
  }
  
  try {
    // Start ngrok tunnel with proper configuration
    const url = await ngrok.connect({
      addr: PORT,
      onStatusChange: status => {
        console.log(`Ngrok Status: ${status}`);
      }
    });
    
    console.log(`\n📱 Mobile access URL: ${url}`);
    console.log('\nShare this URL to access your app from any device');
    console.log('Press Ctrl+C to stop the server');
  } catch (err) {
    console.error('\nError creating ngrok tunnel:', err.message);
    console.log('\n⚠️ Ngrok requires authentication for first-time usage:');
    console.log('1. Sign up for a free account at https://ngrok.com/signup');
    console.log('2. Get your authtoken from https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('3. Run: npx ngrok authtoken YOUR_TOKEN');
    console.log('4. Then try running "npm run tunnel" again');
    
    console.log('\nMeanwhile, you can use the local network URLs above if your mobile device is on the same network.');
  }
});
