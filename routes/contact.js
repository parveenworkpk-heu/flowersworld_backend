const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

const readData = () => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) {}
  return { users: [], products: [], orders: [], contactSubmissions: [] };
};

const writeData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
};

router.post('/', (req, res) => {
  try {
    const { name, email, phone, subject, message, userId } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'Name, email and message are required' });
    }
    const data = readData();
    if (!data.contactSubmissions) {
      data.contactSubmissions = [];
    }
    const submission = {
      _id: 'contact_' + Date.now(),
      name,
      email,
      phone,
      subject,
      message,
      userId: userId || null,
      status: 'new',
      createdAt: new Date().toISOString()
    };
    data.contactSubmissions.push(submission);
    writeData(data);
    res.status(201).json({ message: 'Message sent successfully', submission });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;