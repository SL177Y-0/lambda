import express from "express";

const app = express();
app.use(express.json());

app.post("/filter", (req, res) => {
  const { items } = req.body || {};
  const activeItems = (items || []).filter(item => item.active === true);
  res.json({ activeItems });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running on port ${port}`));
