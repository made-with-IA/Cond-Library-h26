import { Router, type IRouter } from "express";
import { ai } from "@workspace/integrations-gemini-ai";
import { logger } from "../lib/logger.js";
import { authMiddleware } from "../middlewares/auth.js";

const router: IRouter = Router();

router.post("/gemini/book-search", authMiddleware, async (req, res) => {
  const { query } = req.body as { query?: string };
  if (!query?.trim()) {
    res.status(400).json({ error: "query is required" });
    return;
  }

  const prompt = `You are a book data assistant. Given the query "${query}", return a JSON object with book information.
Return ONLY valid JSON (no markdown, no explanation) with these fields:
{
  "title": string or null,
  "author": string or null,
  "genre": string or null,
  "publishedYear": integer or null,
  "isbn": string or null,
  "description": string or null,
  "imageUrl": string or null
}
If the query is an ISBN, look up that specific book.
If the imageUrl is not known, set it to null.
The genre should be a simple category like "Fiction", "Mystery", "Science Fiction", "Romance", "Biography", "Self-Help", "History", "Fantasy", etc.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 8192, responseMimeType: "application/json" },
    });

    const text = response.text ?? "{}";
    const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const data = JSON.parse(cleaned);
    res.json(data);
  } catch (err) {
    logger.error({ err }, "Gemini book search error");
    res.status(500).json({ error: "Failed to search book data" });
  }
});

export default router;
