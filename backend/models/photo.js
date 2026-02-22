const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  image: {
    type: String,   // base64 image
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Photo", photoSchema);
