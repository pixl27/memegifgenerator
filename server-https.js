const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const app = express();

// Serve static files from the current directory
app.use(express.static(__dirname));

const PORT = process.env.PORT || 3000;

// Get local IP address
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

// Check if SSL certificates exist, if not, create them
const sslPath = path.join(__dirname, 'ssl');
const keyPath = path.join(sslPath, 'key.pem');
const certPath = path.join(sslPath, 'cert.pem');

if (!fs.existsSync(sslPath)) {
  fs.mkdirSync(sslPath);
}

if (!fs.existsSync(keyPath) || !fs.existsSync(certPath)) {
  console.log('Generating SSL certificates for HTTPS...');
  
  try {
    // Generate self-signed certificate using OpenSSL
    execSync(`openssl req -x509 -newkey rsa:2048 -keyout ${keyPath} -out ${certPath} -days 365 -nodes -subj "/CN=localhost"`, {
      stdio: 'inherit'
    });
    console.log('SSL certificates generated successfully');
  } catch (error) {
    console.error('Error generating SSL certificates:', error.message);
    console.log('Please install OpenSSL or provide your own SSL certificates');
    process.exit(1);
  }
}

// Create HTTPS server with SSL certificates
const httpsServer = https.createServer({
  key: fs.readFileSync(keyPath),
  cert: fs.readFileSync(certPath),
}, app);

const localIp = getLocalIpAddress();

httpsServer.listen(PORT, () => {
  console.log(`\n🎬 GIF Meme Generator running with HTTPS at:`);
  console.log(`Local:            https://localhost:${PORT}`);
  console.log(`On Your Network:  https://${localIp}:${PORT}`);
  console.log(`\n⚠️ Note: You'll need to accept the self-signed certificate warning in your browser`);
});

// Also start a regular HTTP server that redirects to HTTPS
const httpApp = express();
httpApp.all('*', (req, res) => {
  res.redirect(`https://${req.hostname}:${PORT}${req.url}`);
});

httpApp.listen(PORT - 1, () => {
  console.log(`HTTP redirect active on port ${PORT - 1}`);
});
