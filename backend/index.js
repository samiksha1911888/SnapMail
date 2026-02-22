
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ================== MongoDB Connection ==================
mongoose.connect("mongodb://127.0.0.1:27017/cameraApp")
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("MongoDB Connection Error:", err));


// ================== Schema & Model ==================
const photoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Photo = mongoose.model("Photo", photoSchema);


// ================== Test Route ==================
app.get("/", (req, res) => {
  res.send("Backend working ✅");
});


// ================== Get All Photos ==================
app.get("/photos", async (req, res) => {
  try {
    const photos = await Photo.find();
    res.json(photos);
  } catch (error) {
    console.log(error);
    res.status(500).send("Error fetching photos");
  }
});


// ================== Send Email + Save Route ==================
app.post("/send", async (req, res) => {
  try {
    const { email, image } = req.body;

    // 1️⃣ Save to MongoDB
    const newPhoto = new Photo({ email, image });
    await newPhoto.save();

    // 2️⃣ Email Setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Here is your photo",
      html: `
        <h2>Here is your photo</h2>
        <img src="cid:photo123" width="300"/>
      `,
      attachments: [
        {
          filename: "photo.png",
          content: image.split("base64,")[1],
          encoding: "base64",
          cid: "photo123"
        }
      ]
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: "Saved & Email Sent Successfully" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Error occurred" });
  }
});


// ================== Server Start ==================
app.listen(5000, () => {
  console.log("Server running on port 5000 🚀");
});
