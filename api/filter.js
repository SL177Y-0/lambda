export default function handler(req, res) {
  try {
    const { items } = req.body || {};
    const activeItems = (items || []).filter(item => item.active === true);

    res.status(200).json({ activeItems });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
