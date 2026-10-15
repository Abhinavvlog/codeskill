/**
 * CodeSkill WhatsApp Alert Relay for Uptime Kuma
 * Translates Uptime Kuma Webhook events into WhatsApp Business Platform Cloud API messages
 */
const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3002;
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const RECIPIENT_PHONE_NUMBER = process.env.RECIPIENT_PHONE_NUMBER;

// Cooldown tracker: prevent duplicate alerts for the same monitor within 3 minutes
const alertCooldowns = new Map();
const COOLDOWN_MS = 3 * 60 * 1000;

function sendWhatsAppMessage(text) {
  if (!WHATSAPP_API_TOKEN || !WHATSAPP_PHONE_NUMBER_ID || !RECIPIENT_PHONE_NUMBER) {
    console.log('[WhatsApp Relay] Dry run (credentials not set). Alert text:');
    console.log(text);
    return;
  }

  const payload = JSON.stringify({
    messaging_product: 'whatsapp',
    to: RECIPIENT_PHONE_NUMBER,
    type: 'text',
    text: { body: text },
  });

  const options = {
    hostname: 'graph.facebook.com',
    port: 443,
    path: `/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload),
    },
  };

  const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => (body += d));
    res.on('end', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        console.log(`[WhatsApp Relay] Notification delivered. Status: ${res.statusCode}`);
      } else {
        console.error(`[WhatsApp Relay] Error delivering notification: ${res.statusCode} - ${body}`);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`[WhatsApp Relay] Request error: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/webhook') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const monitor = data.monitor || {};
        const heartbeat = data.heartbeat || {};
        const msg = data.msg || '';

        const monitorName = monitor.name || 'Unknown Service';
        const isUp = heartbeat.status === 1;
        const statusEmoji = isUp ? '🟢 UP / RECOVERED' : '🔴 DOWN / ALERT';
        const errorMsg = heartbeat.msg || msg || 'No additional error details';
        const timestamp = new Date().toISOString();

        // Check deduplication / cooldown
        const lastAlert = alertCooldowns.get(monitorName);
        if (!isUp && lastAlert && (Date.now() - lastAlert < COOLDOWN_MS)) {
          console.log(`[WhatsApp Relay] Cooldown active for ${monitorName}, skipping duplicate alert.`);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ status: 'cooldown_skipped' }));
          return;
        }

        if (!isUp) {
          alertCooldowns.set(monitorName, Date.now());
        } else {
          alertCooldowns.delete(monitorName);
        }

        const messageText = 
`🚨 *CodeSkill Infrastructure Alert*
---------------------------------------
*Service:* ${monitorName}
*Status:* ${statusEmoji}
*Environment:* Production (ap-south-1)
*Timestamp:* ${timestamp}
*Details:* ${errorMsg}
---------------------------------------
Platform: https://codeskill.novaserve.cloud/`;

        sendWhatsAppMessage(messageText);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'success' }));
      } catch (err) {
        console.error('[WhatsApp Relay] JSON parse error:', err.message);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      }
    });
  } else if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'whatsapp-relay' }));
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[WhatsApp Relay] Listening on port ${PORT}`);
});
