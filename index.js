
import express from "express";

const app = express();
app.use(express.json());

// Lambda-like function: filter items by active = true
app.post("/challenge", (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "items must be an array" });
  }
  const activeItems = items.filter((item) => item.active === true);
  res.json({ activeItems });
});

// Health check
app.get("/", (req, res) => {
  res.send("Filter API is running ✅");
});

// Render provides PORT env var
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
