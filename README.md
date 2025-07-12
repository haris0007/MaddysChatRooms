# Maddy's Chat Rooms 🗨️

A real-time chat web application built using **Node.js**, **Express**, **Socket.IO**, and **MongoDB**, allowing users to log in with an OTP and chat in group rooms or privately.

---

## 🌟 Features

- ✅ OTP-based email login
- 💬 Real-time group chat rooms
- 📩 Private direct messaging (DMs)
- 🧑‍🤝‍🧑 Join and leave rooms with chat history
- 🔔 Instant DM notifications
- 💾 All chat messages saved to MongoDB
- 🚪 Logout and full disconnect
- 👻 Deleted users handled gracefully in chat history

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/maddys-chat-rooms.git
cd maddys-chat-rooms
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Create a `.env` File

```env
PORT=8000
MONGO_URI=your_mongo_connection_string
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

> 🔐 Make sure to use an [App Password](https://support.google.com/accounts/answer/185833) if you're using Gmail with 2FA.

### 4. Start the Server

```bash
node index.js
```

Visit: [http://localhost:8000](http://localhost:8000)

---

## 📖 Usage

1. Enter your email on the login screen.
2. Click "Send OTP" — check your email inbox for the OTP.
3. Enter the OTP and click "Verify & Continue".
4. You’ll be redirected to the chat screen:
   - Join any room to start a group chat.
   - Enter a user’s email to start a private DM.
   - Your chat history is loaded from the database.
5. You can leave a room or logout anytime.
6. If a user disconnects permanently, their messages will be replaced with:  
   _“This message was deleted”_ from _“Deleted User”_.

---

## 🧠 How It Works

### Backend (Express + Socket.IO)
- Handles OTP generation and email delivery via `nodemailer`.
- Uses `Socket.IO` to manage real-time communication between users.
- Stores and retrieves messages using MongoDB.
- Manages connected clients with a `Map` of email → socket ID.
- Performs user cleanup and emits events on logout/disconnect.

### Frontend (HTML/CSS/JS)
- `index.html` handles OTP login.
- `chat.html` is the main chat interface:
  - Displays chat history
  - Sends and receives messages
  - Supports group and private chat
  - Reacts to disconnection, deletion, logout

---

## 📦 Dependencies

- [Express](https://www.npmjs.com/package/express)
- [Socket.IO](https://www.npmjs.com/package/socket.io)
- [Mongoose](https://www.npmjs.com/package/mongoose)
- [Nodemailer](https://www.npmjs.com/package/nodemailer)
- [dotenv](https://www.npmjs.com/package/dotenv)
- [body-parser](https://www.npmjs.com/package/body-parser)

---

## 🚧 Future Improvements

- 🔐 Add JWT token-based login sessions
- 📱 Mobile responsive UI
- 🖼️ Support media (images, files) in messages
- 🔎 User search and friend list
- 🧹 Auto-cleanup old chats/rooms
- 🔔 Push/browser notifications
- 🌐 Deployment to Render, Vercel or DigitalOcean

---

## 📁 Project Structure

```
maddys-chat-rooms/
│
├── public/              # Frontend files
│   ├── index.html       # Login screen
│   └── chat.html        # Main chat UI
│
├── models/              # Mongoose schemas
│   ├── Otp.js
│   └── Message.js
│
├── .env                 # Environment variables
├── index.js             # Main server (Express + Socket.IO)
├── package.json
└── README.md
```

---

## 📜 License

MIT License  
© Hariskumar S
