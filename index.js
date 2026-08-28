const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'goat_bot_token';

app.use(express.json());

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

// Handle message and send response
function handleMessage(event) {
  const sender_psid = event.sender.id;
  const message = event.message.text;

  if (!message) return;

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
      console.log('Message sent successfully:', response.data);
    })
    .catch((error) => {
      console.error('Error sending message:', error.response?.data || error.message);
    });
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Bot is running on port ${PORT}`);
});
