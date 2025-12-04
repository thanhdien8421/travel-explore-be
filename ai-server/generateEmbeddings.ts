import 'dotenv/config';
import { Client } from 'pg';
import { embedText } from './src/services/embeddingService.js';
import fs from 'fs';
import path from 'path';

interface PlaceEmbedding {
  id: string;
  slug: string;
  name: string;
  description: string;
  embedding: number[];
}

const generateEmbeddings = async () => {
  console.log('Generating embeddings...');
  const client = new Client({ 
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });
  try {
    await client.connect();
    // Only generate embeddings for APPROVED and active places
    const res = await client.query(`
      SELECT id, slug, name, description 
      FROM places 
      WHERE is_active = true 
        AND status = 'APPROVED' 
        AND description IS NOT NULL
    `);
    const places = res.rows;
    console.log(`Found ${places.length} approved places`);
    
    const embeddings: PlaceEmbedding[] = [];
    for (const place of places) {
      if (place.description) {
        try {
          const embedding = await embedText(place.description);
          console.log(`Embedded: ${place.name}`);
          embeddings.push({
            id: place.id,
            slug: place.slug,
            name: place.name,
            description: place.description,
            embedding,
          });
        } catch (error) {
          console.error(`Failed to embed ${place.name}:`, error);
        }
      }
    }
    
    const filePath = path.join(process.cwd(), 'embeddings.json');
    fs.writeFileSync(filePath, JSON.stringify(embeddings, null, 2));
    console.log(`Saved ${embeddings.length} embeddings to ${filePath}`);
  } catch (error) {
    console.error('Error generating embeddings:', error);
  } finally {
    await client.end();
  }
};

generateEmbeddings();