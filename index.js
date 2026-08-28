const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'goat_bot_token';

// শুধুমাত্র এই Facebook ID এর জন্য লগিং করবে
const OWNER_FACEBOOK_ID = '61591196296533';

// লগ ফাইলের পাথ
const logsDir = path.join(__dirname, 'logs');
const logsFile = path.join(logsDir, 'bot_logs.json');

// লগ ডিরেক্টরি তৈরি করুন
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// লগ ফাইল ইনিশিয়ালাইজ করুন
if (!fs.existsSync(logsFile)) {
  fs.writeFileSync(logsFile, JSON.stringify([], null, 2));
}

app.use(express.json());

// লগিং ফাংশন - শুধুমাত্র Owner এর মেসেজ লগ করবে
function logMessage(sender_psid, message, response_text) {
  // শুধুমাত্র মালিকের মেসেজ লগ করবে
  if (sender_psid !== OWNER_FACEBOOK_ID) {
    console.log(`⚠️ অন্যদের মেসেজ লগ করা হচ্ছে না - Facebook ID: ${sender_psid}`);
    return;
  }

  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      facebook_id: sender_psid,
      user_message: message,
      bot_response: response_text,
    };

    // লগ ফাইলে যোগ করুন
    let logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    logs.push(logEntry);
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));

    console.log(`✅ আপনার মেসেজ লগ করা হয়েছে!`);
  } catch (error) {
    console.error('❌ লগিং এ সমস্যা:', error.message);
  }
}

// Webhook verification
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token === VERIFY_TOKEN) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// Handle incoming messages
app.post('/webhook', (req, res) => {
  const body = req.body;

  if (body.object === 'page') {
    body.entry.forEach((entry) => {
      const messaging_events = entry.messaging;

      messaging_events.forEach((event) => {
        if (event.message) {
          handleMessage(event);
        }
      });
    });
    res.sendStatus(200);
  }
});

// লগ দেখার জন্য এন্ডপয়েন্ট - শুধুমাত্র মালিক দেখতে পারবে
app.get('/logs', (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    res.json({
      owner_id: OWNER_FACEBOOK_ID,
      total_logs: logs.length,
      logs: logs,
    });
  } catch (error) {
    res.status(500).json({ error: 'লগ পড়তে সমস্যা' });
  }
});

// Handle message and send response
function handleMessage(event) {
  const sender_psid = event.sender.id;
  const message = event.message.text;

  if (!message) return;

  if (sender_psid === OWNER_FACEBOOK_ID) {
    console.log(`📨 আপনার মেসেজ: ${message}`);
  } else {
    console.log(`📨 অন্যদের মেসেজ (লগ করা হবে না): ${message}`);
  }

  // Simple responses
  let response_text = '';

  if (message.toLowerCase().includes('hello') || message.toLowerCase().includes('hi')) {
    response_text = 'হাই! আমি Goat Bot। কেমন আছো? 😊';
  } else if (message.toLowerCase().includes('how are you')) {
    response_text = 'আমি ভালো আছি! তুমি কেমন? 🐐';
  } else if (message.toLowerCase().includes('help')) {
    response_text = 'আমি সাধারণ কথা বলতে পারি। আমাকে গ্রীটিং দিয়ে চেষ্টা করো! 👋';
  } else if (message.toLowerCase().includes('thanks') || message.toLowerCase().includes('thank you')) {
    response_text = 'স্বাগতম! 🙏';
  } else if (message.toLowerCase().includes('log')) {
    response_text = 'আপনার লগ দেখতে: http://localhost:3000/logs 📊';
  } else {
    response_text = `তুমি বলেছো: "${message}". আমি এটা মনে রেখেছি! 🐐`;
  }

  // লগ করুন (শুধুমাত্র মালিকের জন্য)
  logMessage(sender_psid, message, response_text);

  // রেসপন্স পাঠান
  sendMessage(sender_psid, response_text);
}

// Send message via Facebook API
function sendMessage(recipient_id, message_text) {
  const request_body = {
    recipient: {
      id: recipient_id,
    },
    message: {
      text: message_text,
    },
  };

  axios
    .post(
      `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`,
      request_body
    )
    .then((response) => {
      console.log('✅ মেসেজ সফলভাবে পাঠানো হয়েছে');
    })
    .catch((error) => {
      console.error('❌ মেসেজ পাঠাতে সমস্যা:', error.response?.data || error.message);
    });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bot চলছে পোর্ট ${PORT} এ`);
  console.log(`👤 Owner Facebook ID: ${OWNER_FACEBOOK_ID}`);
  console.log(`📊 শুধুমাত্র আপনার মেসেজ লগ হবে!`);
  console.log(`📋 লগ দেখতে যান: http://localhost:${PORT}/logs`);
});
