// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware
const auth = (req, res, next) => {
  const token = req.header("x-auth-token");

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: "Token is not valid" });
  }
};

const mongoURI = process.env.MONGO_URI;

mongoose
  .connect(mongoURI)
  .then(() => console.log("MongoDB Connected..."))
  .catch((err) => console.error("MongoDB connection error:", err));

// Simple login endpoint (for demo purposes)
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  // In a real app, you would validate against database
  // This is just for demonstration purposes
  if (username === "admin" && password === "password") {
    const payload = { user: { id: "admin", name: username } };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } else {
    res.status(400).json({ error: "Invalid credentials" });
  }
});

// Test authentication route
app.get("/api/auth-test", auth, (req, res) => {
  res.json({ msg: "Authentication successful", user: req.user });
});

// Define Todo schema and model
const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Todo = mongoose.model("Todo", todoSchema);

// --- CRUD Routes (now protected with auth middleware) ---

// Create a new Todo with duplicate-task validation
app.post("/todos", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: "Task text is required." });
    }

    // Check if a task with the same text (case-insensitive) exists
    const duplicateTodo = await Todo.findOne({
      text: { $regex: new RegExp(`^${text.trim()}$`, "i") },
    });
    if (duplicateTodo) {
      return res.status(400).json({ error: "Task already exists." });
    }

    const newTodo = new Todo({ text: text.trim() });
    const savedTodo = await newTodo.save();
    res.status(201).json(savedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all Todos
app.get("/todos", auth, async (req, res) => {
  try {
    const todos = await Todo.find();
    res.json(todos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a Todo
app.put("/todos/:id", auth, async (req, res) => {
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!updatedTodo) return res.status(404).json({ error: "Todo not found" });
    res.json(updatedTodo);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a Todo
app.delete("/todos/:id", auth, async (req, res) => {
  try {
    const deletedTodo = await Todo.findByIdAndDelete(req.params.id);
    if (!deletedTodo) return res.status(404).json({ error: "Todo not found" });
    res.json({ message: "Todo deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
