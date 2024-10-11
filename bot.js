const TelegramBot = require('node-telegram-bot-api');
const token = '7414755195:AAEECs9JCxuCYzq0HL2xfpER0UyKmYzMNAI'; // Replace with your bot token
const bot = new TelegramBot(token, { polling: true });
const admin = require('firebase-admin');
const express = require('express');
const app = express();

const PORT = process.env.PORT || 5000;  // Use PORT provided by Heroku or default to 5000 locally

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Admin User ID (Replace with your own Telegram User ID)
const ADMIN_USER_ID = [451263123, 926460821]; // Replace with your actual admin ID

// Path to your image and video (replace with correct paths)
const imagePath = 'photo_2024-10-11 13.36.36.jpeg';
const videoPath1 = 'IMG_4291.mp4';
const videoPath2 = 'IMG_1899.mp4';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT); // Add this to your environment
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore(); // Firestore database instance

// Store broadcast data temporarily
let broadcastData = {};

// Function to add a user to Firestore
async function addUser(userId) {
    const userRef = db.collection('users').doc(userId.toString());
    await userRef.set({ id: userId });
    console.log(`User ${userId} added to Firestore`);
}

// Function to get all users from Firestore
async function getAllUsers() {
    const snapshot = await db.collection('users').get();
    const users = snapshot.docs.map(doc => doc.data());
    return users.map(user => user.id); // Return array of user IDs
}

// Handles the /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;

    // Add user to Firestore when they start the bot
    await addUser(chatId);

    // Send the welcome message with the image
    bot.sendPhoto(chatId, imagePath, {
        caption: `🔹 Welcome to 🔸CardCaptain🔸! 🔹

💥 CardCaptain is a high-tech blackjack bot powered by OpenAI's cutting-edge neural network, designed to help you navigate the exciting world of blackjack!

Your goal? Outsmart the dealer and win big by making the best choices possible at the blackjack table.

🔮 With an 85% probability accuracy, CardCaptain can predict the outcome of your next move, helping you hit, stand, or double down at just the right moment. Whether you're aiming for a perfect 21 or trying to avoid a bust, our bot uses advanced AI to analyze patterns and give you the best chance to beat the dealer.`,
        reply_markup: {
            inline_keyboard: [
                [{ text: "GET FREE BOT🤖", callback_data: 'get_free_bot' }]
            ]
        }
    });
});

// Handles the "GET FREE BOT" button
bot.on('callback_query', (callbackQuery) => {
    const msg = callbackQuery.message;
    const chatId = msg.chat.id;
    const data = callbackQuery.data;

    if (data === 'get_free_bot') {
        // Send the video first, then the text
        bot.sendVideo(chatId, videoPath1).then(() => {
            // After the video is sent, send the text with buttons
            bot.sendMessage(chatId, `𝗥𝘂𝗹𝗲𝘀 𝗮𝗿𝗲 𝘀𝗶𝗺𝗽𝗹𝗲:

1. Register in our recommended account using my link ( button on link below, make at least a 30-50€ Deposit)

2. If you try to avoid My link or google it, you will not be able to activate Card Captain BOT!🤖

3. After successful registration and deposit send a screenshot to @`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "REGISTER HERE♠️", url: 'https://maxsp.in/0vJqL' }],
                        [{ text: "INSTRUCTIONS📚", callback_data: 'instruction' }]
                    ]
                }
            });
        });
    }

    if (data === 'instruction') {
        // Send the next video first, then the text
        bot.sendVideo(chatId, videoPath2).then(() => {
            // After the video is sent, send the instructional message with "GO BACK" button
            bot.sendMessage(chatId, `🖥 Powered by OpenAI's cutting-edge neural network cluster [ChatGPT-4], CardCaptain has been trained through an intensive process, playing over 8,000 blackjack games to perfect its strategy.

💡 Key Features:

85% accuracy in predicting moves
Bot users are seeing 20-30% daily profits from their starting capital!
🔮 Instructions for Maximum Profit:

🔸 1. Register at our recommended bookmaker.

🔸 2. Deposit funds into your account.

🔸 3. Head to the games section and choose "BLACKJACK".

🔸 4. Place your bets based on the bot's signals for optimal plays.

🔸 5. In case of a loss, apply the Martingale strategy: double your bet (X2) to recover losses on the next hand.

By following these steps, you can leverage CardCaptain's precision and maximize your profits! Good luck, and may the cards be ever in your favour! ♠️♥️♣️♦️`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "GO BACK", callback_data: 'get_free_bot' }]
                    ]
                }
            });
        });
    }
});

// Broadcast command for the admin to send a message to all users
bot.onText(/\/broadcast$/, (msg) => {
    const chatId = msg.chat.id;

    if (chatId === ADMIN_USER_ID) {
        broadcastData[chatId] = { step: 'waiting_for_message' }; // Set the step to waiting for a message
        bot.sendMessage(chatId, "Send me the message you wish to broadcast.");
    } else {
        bot.sendMessage(chatId, "You are not authorized to broadcast.");
    }
});

// Handle incoming messages for broadcasting
bot.on('message', async (msg) => {
    const chatId = msg.chat.id;

    // If the admin is sending a message for broadcast
    if (chatId === ADMIN_USER_ID && broadcastData[chatId] && broadcastData[chatId].step === 'waiting_for_message') {
        // Save the message (it could include text, photos, videos, etc.)
        broadcastData[chatId] = { message: msg, step: 'confirming' };

        // Send the message back to the admin for confirmation
        if (msg.text) {
            await bot.sendMessage(chatId, msg.text);
        } else if (msg.photo) {
            await bot.sendPhoto(chatId, msg.photo[0].file_id, { caption: msg.caption });
        } else if (msg.video) {
            await bot.sendVideo(chatId, msg.video.file_id, { caption: msg.caption });
        }

        // Send the confirmation message with Approve and Decline buttons
        bot.sendMessage(chatId, "Is this the message you want to broadcast?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: 'Approve✅', callback_data: 'approve_broadcast' }],
                    [{ text: 'Decline❌', callback_data: 'decline_broadcast' }]
                ]
            }
        });
    }
});

// Handle Approve/Decline actions for broadcast
bot.on('callback_query', async (callbackQuery) => {
    const chatId = callbackQuery.message.chat.id;
    const data = callbackQuery.data;

    if (chatId === ADMIN_USER_ID && broadcastData[chatId]) {
        if (data === 'approve_broadcast') {
            const messageToBroadcast = broadcastData[chatId].message;

            // Get all users from Firestore
            const userIds = await getAllUsers();

            // Broadcast the message to all users
            userIds.forEach(userId => {
                if (messageToBroadcast.text) {
                    bot.sendMessage(userId, messageToBroadcast.text);
                } else if (messageToBroadcast.photo) {
                    bot.sendPhoto(userId, messageToBroadcast.photo[0].file_id, { caption: messageToBroadcast.caption });
                } else if (messageToBroadcast.video) {
                    bot.sendVideo(userId, messageToBroadcast.video.file_id, { caption: messageToBroadcast.caption });
                }
            });

            // Notify the admin that the message was broadcasted
            bot.sendMessage(chatId, "Message successfully broadcasted to all users.");
            delete broadcastData[chatId]; // Clear the broadcast data
        } else if (data === 'decline_broadcast') {
            // Notify the admin that the broadcast was cancelled
            bot.sendMessage(chatId, "Broadcast cancelled. Send /broadcast to start again.");
            delete broadcastData[chatId]; // Clear the broadcast data
        }
    }
});
