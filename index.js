const http = require("http");
const express = require("express");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const path = require("path");
const cron = require("node-cron");
require("dotenv").config();

const OtpModel = require("./models/Otp");
const MessageModel = require("./models/Message");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

cron.schedule("*/6 * * * *", () => {
  console.log("⏰ Ping:", new Date().toISOString());
});

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    await OtpModel.findOneAndUpdate(
      { email },
      { otp, createdAt: new Date() },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Chat App OTP",
      text: `Your OTP is: ${otp}`
    });

    res.json({ success: true, message: "OTP sent to your email" });
  } catch (err) {
    console.error("OTP send error:", err);
    res.json({ success: false, message: "Failed to send OTP" });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const record = await OtpModel.findOne({ email });
    if (record && record.otp === otp) {
      await OtpModel.deleteOne({ email });
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Invalid OTP" });
    }
  } catch (err) {
    res.json({ success: false, message: "Error verifying OTP" });
  }
});

const clients = new Map();

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);
  socket.room = null;

  socket.on("register", (email) => {
    socket.email = email;
    clients.set(email, socket);
  });

  socket.on("join_room", async (room) => {
    if (!socket.email) return;
    socket.join(room);
    socket.room = room;

    const history = await MessageModel.find({ room }).sort({ createdAt: 1 });
    socket.emit("chat", history);

    await MessageModel.create({
      from: socket.email,
      room,
      message: `${socket.email} joined the room`,
      createdAt: new Date()
    });

    const updated = await MessageModel.find({ room }).sort({ createdAt: 1 });
    io.to(room).emit("chat", updated);
  });

  socket.on("leave_room", async () => {
    if (!socket.room) return;

    await MessageModel.create({
      from: socket.email,
      room: socket.room,
      message: `${socket.email} left the room`,
      createdAt: new Date()
    });

    const updated = await MessageModel.find({ room: socket.room }).sort({ createdAt: 1 });
    io.to(socket.room).emit("chat", updated);

    socket.leave(socket.room);
    socket.room = null;
  });

  socket.on("room_message", async (msg) => {
    if (!socket.room || !socket.email) return;

    await MessageModel.create({
      from: socket.email,
      room: socket.room,
      message: msg,
      createdAt: new Date()
    });

    const history = await MessageModel.find({ room: socket.room }).sort({ createdAt: 1 });
    io.to(socket.room).emit("chat", history);
  });

  socket.on("private_message", async ({ to, message }) => {
    if (!to || !clients.has(to)) {
      socket.emit("chat_error", `Cannot send DM. User "${to}" is not connected.`);
      return;
    }

    await MessageModel.create({
      from: socket.email,
      to,
      message,
      createdAt: new Date()
    });

    clients.get(to).emit("new_private_message", { from: socket.email, message, to });
    socket.emit("new_private_message", { from: socket.email, message, to });
  });

  socket.on("load_dm", async (to) => {
    if (!clients.has(to)) {
      socket.emit("chat_error", `User "${to}" is not connected`);
      return;
    }

    const history = await MessageModel.find({
      $or: [
        { from: socket.email, to },
        { from: to, to: socket.email }
      ]
    }).sort("createdAt");

    socket.emit("dm_chat", history);
  });

  socket.on("logout", () => {
    clients.delete(socket.email);
    socket.emit("logout", "Logged out");
  });

  socket.on("disconnect_user", async () => {
    const email = socket.email;
    if (!email) return;

    await MessageModel.updateMany(
      { from: email },
      { $set: { from: "Deleted User", message: "This message was deleted" } }
    );

    const usersWithHistory = await MessageModel.distinct("to", { from: email });
    const othersWhoSentToHim = await MessageModel.distinct("from", { to: email });
    const allRelatedUsers = new Set([...usersWithHistory, ...othersWhoSentToHim]);

    for (const otherUser of allRelatedUsers) {
      const clientSocket = clients.get(otherUser);
      if (clientSocket) {
        clientSocket.emit("reload_dm_if_with_deleted", { deletedEmail: email });
      }
    }

    clients.delete(email);
    socket.emit("logout", "Your account has been disconnected and deleted.");
    socket.disconnect(true);
  });
});

server.listen(process.env.PORT || 8000, () => {
  console.log(`🚀 Server running at http://localhost:${process.env.PORT || 8000}`);
});
