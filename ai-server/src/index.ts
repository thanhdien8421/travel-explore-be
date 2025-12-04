import 'dotenv/config';
import express from 'express';
import { embedText } from './services/embeddingService.js';
import { searchPlaces } from './services/searchService.js';

const app = express();
const PORT = 3001;

app.use(express.json());

// Endpoint to generate embeddings
app.post('/embed', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }
    const embedding = await embedText(text);
    res.json({ embedding });
  } catch (error) {
    console.error('Error generating embedding:', error);
    res.status(500).json({ error: 'Failed to generate embedding' });
  }
});

// Endpoint to search places
app.post('/search', async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    const results = await searchPlaces(query);
    res.json({ results });
  } catch (error) {
    console.error('Error searching places:', error);
    res.status(500).json({ error: 'Failed to search places' });
  }
});

app.listen(PORT, () => {
  console.log(`AI Server running on port ${PORT}`);
});