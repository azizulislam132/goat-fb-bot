# 🐐 Goat FB Bot

একটি সাধারণ Facebook Messenger Bot যা JavaScript দিয়ে তৈরি।

## ফিচার

- সাধারণ মেসেজ রিসিভ করে
- বিভিন্ন গ্রীটিং এবং কমান্ডের উত্তর দেয়
- সহজেই কাস্টমাইজ করা যায়

## ইনস্টলেশন

```bash
# Dependencies ইনস্টল করুন
npm install

# .env ফাইল তৈরি করুন
cp .env.example .env

# আপনার Facebook Page Access Token যোগ করুন
# .env ফাইলে PAGE_ACCESS_TOKEN আপডেট করুন
```

## চালানো

```bash
# সাধারণ মোড
npm start

# ডেভেলপমেন্ট মোড (auto-reload সহ)
npm run dev
```

## সেটআপ গাইড

1. Facebook Developer Console এ যান
2. একটি App তৈরি করুন
3. Messenger product যোগ করুন
4. Page Access Token জেনারেট করুন
5. Webhook URL সেট করুন: `https://your-domain.com/webhook`
6. `.env` ফাইলে Token যোগ করুন

## কমান্ড

- `hello` / `hi` - গ্রীটিং
- `how are you` - স্ট্যাটাস চেক
- `help` - সাহায্য
- `thanks` - থ্যাংক ইউ
- অন্য যেকোনো মেসেজ - ইকো রেসপন্স

## ভবিষ্যৎ আপডেট

- [ ] আরও কমান্ড যোগ করুন
- [ ] ডাটাবেস ইন্টিগ্রেশন
- [ ] AI রেসপন্স
- [ ] ব্যবহারকারী প্রোফাইল ট্র্যাকিং

## লাইসেন্স

MIT
