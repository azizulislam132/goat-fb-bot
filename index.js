const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'goat_bot_token';

// লগ ফাইলের পাথ
const logsDir = path.join(__dirname, 'logs');
const logsFile = path.join(logsDir, 'bot_logs.json');
const userDataFile = path.join(logsDir, 'user_data.json');

// লগ ডিরেক্টরি তৈরি করুন
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// লগ ফাইল ইনিশিয়ালাইজ করুন
if (!fs.existsSync(logsFile)) {
  fs.writeFileSync(logsFile, JSON.stringify([], null, 2));
}

if (!fs.existsSync(userDataFile)) {
  fs.writeFileSync(userDataFile, JSON.stringify({}, null, 2));
}

app.use(express.json());

// লগিং ফাংশন
function logMessage(sender_psid, message, response_text, messageType = 'incoming') {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      facebook_id: sender_psid,
      message_type: messageType,
      user_message: message,
      bot_response: response_text,
    };

    // লগ ফাইলে যোগ করুন
    let logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    logs.push(logEntry);
    fs.writeFileSync(logsFile, JSON.stringify(logs, null, 2));

    // ইউজার ডেটা আপডেট করুন
    let userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    
    if (!userData[sender_psid]) {
      userData[sender_psid] = {
        facebook_id: sender_psid,
        first_seen: new Date().toISOString(),
        message_count: 0,
        messages: [],
      };
    }

    userData[sender_psid].message_count += 1;
    userData[sender_psid].last_message = new Date().toISOString();
    userData[sender_psid].messages.push({
      timestamp: new Date().toISOString(),
      message: message,
      response: response_text,
    });

    fs.writeFileSync(userDataFile, JSON.stringify(userData, null, 2));

    console.log(`✅ লগ সংরক্ষিত - Facebook ID: ${sender_psid}`);
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

// লগ দেখার জন্য এন্ডপয়েন্ট
app.get('/logs', (req, res) => {
  try {
    const logs = JSON.parse(fs.readFileSync(logsFile, 'utf8'));
    res.json({
      total_logs: logs.length,
      logs: logs,
    });
  } catch (error) {
    res.status(500).json({ error: 'লগ পড়তে সমস্যা' });
  }
});

// ইউজার ডেটা দেখার জন্য এন্ডপয়েন্ট
app.get('/users', (req, res) => {
  try {
    const userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    const userCount = Object.keys(userData).length;
    
    res.json({
      total_users: userCount,
      users: userData,
    });
  } catch (error) {
    res.status(500).json({ error: 'ইউজার ডেটা পড়তে সমস্যা' });
  }
});

// নির্দিষ্ট ইউজারের ডেটা দেখার জন্য
app.get('/user/:facebook_id', (req, res) => {
  try {
    const facebook_id = req.params.facebook_id;
    const userData = JSON.parse(fs.readFileSync(userDataFile, 'utf8'));
    
    if (userData[facebook_id]) {
      res.json(userData[facebook_id]);
    } else {
      res.status(404).json({ error: 'এই Facebook ID পাওয়া যায়নি' });
    }
  } catch (error) {
    res.status(500).json({ error: 'ডেটা পড়তে সমস্যা' });
  }
});

// Handle message and send response
function handleMessage(event) {
  const sender_psid = event.sender.id;
  const message = event.message.text;

  if (!message) return;

  console.log(`📨 নতুন মেসেজ - Facebook ID: ${sender_psid}, বার্তা: ${message}`);

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
  } else {
    response_text = `তুমি বলেছো: "${message}". আমি এটা মনে রেখেছি! 🐐`;
  }

  // লগ করুন
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
  console.log(`📊 লগ দেখতে যান: http://localhost:${PORT}/logs`);
  console.log(`👥 ইউজার ডেটা দেখতে যান: http://localhost:${PORT}/users`);
});
