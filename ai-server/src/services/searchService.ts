import fs from 'fs';
import path from 'path';
import { embedText } from './embeddingService.js';

interface PlaceEmbedding {
  id: string;
  slug: string;
  name: string;
  description: string;
  embedding: number[];
}

let placeEmbeddings: PlaceEmbedding[] = [];
let isLoaded = false;

const cosineSimilarity = (a: number[], b: number[]): number => {
  if (a.length !== b.length) return 0;
  const dot = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const normA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const normB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  if (normA === 0 || normB === 0) return 0;
  return dot / (normA * normB);
};

const loadPlaceEmbeddings = async () => {
  if (isLoaded) return;
  console.log('Loading place embeddings from JSON...');
  try {
    const filePath = path.join(process.cwd(), 'embeddings.json');
    const data = fs.readFileSync(filePath, 'utf-8');
    placeEmbeddings = JSON.parse(data);
    console.log(`Loaded ${placeEmbeddings.length} place embeddings`);
  } catch (error) {
    console.error('Failed to load embeddings from JSON:', error);
  }
  isLoaded = true;
};

export const searchPlaces = async (query: string): Promise<{ id: string; slug: string; name: string; similarity: number }[]> => {
  await loadPlaceEmbeddings();
  console.log(`Searching for query: ${query}`);
  const queryEmbedding = await embedText(query);
  console.log('Query embedded, length:', queryEmbedding.length);
  console.log('Query embedding sample (first 5):', queryEmbedding.slice(0, 5));
  console.log('Place embedding sample (first 5):', placeEmbeddings[0]?.embedding.slice(0, 5));
  
  const results = placeEmbeddings.map(place => {
    console.log(`Place: ${place.name}, embedding length: ${place.embedding.length}`);
    const similarity = cosineSimilarity(queryEmbedding, place.embedding);
    console.log(`Similarity for ${place.name}: ${similarity}`);
    return {
      id: place.id,
      slug: place.slug,
      name: place.name,
      similarity: isNaN(similarity) ? 0 : similarity,
    };
  });
  results.sort((a, b) => b.similarity - a.similarity);
  console.log('Top results:', results.slice(0, 3));
  return results.slice(0, 3);
};