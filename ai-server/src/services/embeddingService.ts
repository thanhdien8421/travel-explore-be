import OpenAI from 'openai';

const baseURL = process.env.LM_STUDIO_BASE_URL || 'http://192.168.1.3:1234/v1';
console.log(baseURL)
const client = new OpenAI({
  baseURL,
  apiKey: 'not-needed', // LM Studio doesn't require API key
});

export const embedText = async (text: string): Promise<number[]> => {
  try {
    const response = await client.embeddings.create({
      model: 'text-embedding-embeddinggemma-300m-qat', // Try this common LM Studio model
      input: text,
      encoding_format: 'float', // Ensure we get float arrays, not base64
    });
    
    // Debug: log the full response structure
    console.log('API Responsesss:', JSON.stringify(response, null, 2));
    
    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding data returned from API');
    }
    
    const embedding = response.data[0].embedding;
    if (!embedding || embedding.length === 0) {
      throw new Error('Empty embedding array returned');
    }
    
    console.log(`Embedded text "${text.substring(0, 20)}...": length ${embedding.length}`);
    console.log(`First 5 values: [${embedding.slice(0, 5).join(', ')}]`);
    return embedding;
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
};