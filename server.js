const express = require("express");
const fetch = require("node-fetch");
require("dotenv").config();

const app = express();
app.use(express.json());

// Proxy for YouTube video title
app.get("/api/youtube-title", async (req, res) => {
  const { videoId } = req.query;
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!videoId || !apiKey) return res.status(400).json({ error: "Missing videoId or API key" });
  try {
    const ytRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`);
    const ytData = await ytRes.json();
    const title = ytData.items && ytData.items[0]?.snippet?.title;
    res.json({ title: title || null });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch YouTube title" });
  }
});

// Proxy for Hugging Face similarity
app.post("/api/similarity", async (req, res) => {
  const { userText, targetText } = req.body;
  const hfToken = process.env.HF_TOKEN;
  if (!userText || !targetText || !hfToken) return res.status(400).json({ error: "Missing input or token" });
  try {
    const hfRes = await fetch("https://api-inference.huggingface.co/models/sentence-transformers/all-MiniLM-L6-v2", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${hfToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        inputs: {
          source_sentence: targetText,
          sentences: [userText]
        }
      })
    });
    const hfData = await hfRes.json();
    const score = Array.isArray(hfData) && typeof hfData[0] === "number" ? hfData[0] : 0;
    res.json({ similar: score > 0.7 });
  } catch (e) {
    res.status(500).json({ error: "Failed to fetch similarity" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
