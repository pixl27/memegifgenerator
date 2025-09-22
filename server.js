const express = require('express');
const app = express();
const path = require('path');
const os = require('os');

// Serve static files from the current directory
app.use(express.static(__dirname));

// Get local IP address to make it accessible on local network
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const interfaceName in interfaces) {
    const interfaceInfo = interfaces[interfaceName];
    for (const info of interfaceInfo) {
      if (!info.internal && info.family === 'IPv4') {
        return info.address;
      }
    }
  }
  return 'localhost';
}

const PORT = process.env.PORT || 3000;
const localIp = getLocalIpAddress();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🎬 GIF Meme Generator running at:`);
  console.log(`Local:            http://localhost:${PORT}`);
  console.log(`On Your Network:  http://${localIp}:${PORT}`);
  console.log(`\nUse the "On Your Network" URL on your mobile device\n`);
});
