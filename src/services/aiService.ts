import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const model = genAI ? genAI.getGenerativeModel({ model: "gemini-2.5-flash" }) : null;

/**
 * Generates a summary of a place based on user reviews using Gemini API.
 * @param comments Array of user comments
 * @returns Generated summary string
 */
export const generatePlaceSummary = async (comments: string[]): Promise<string> => {
  if (!model) {
    throw new Error("Gemini API key is not configured.");
  }

  if (!comments || comments.length === 0) {
    return "Chưa có đánh giá nào để tóm tắt.";
  }

  // Filter out empty or too short comments to save tokens and improve quality
  const validComments = comments.filter(c => c && c.trim().length > 5);

  if (validComments.length === 0) {
    return "Chưa có đánh giá đủ chi tiết để tóm tắt.";
  }

  // Limit the number of comments to avoid hitting token limits (e.g., take last 50 comments)
  const recentComments = validComments.slice(0, 50);

  const prompt = `
    Dưới đây là danh sách các bình luận của khách du lịch về một địa điểm tại TP. Hồ Chí Minh:
    
    ${recentComments.map(c => `- ${c}`).join("\n")}
    
    Hãy viết một đoạn văn tóm tắt ngắn gọn (khoảng 3-5 câu) về địa điểm này dựa trên các bình luận trên. 
    Tóm tắt nên khách quan, nêu bật các điểm mạnh và điểm yếu (nếu có) mà nhiều người nhắc đến. 
    Văn phong tự nhiên, hữu ích cho khách du lịch.
    Chỉ trả về nội dung tóm tắt, không thêm tiêu đề hay lời dẫn.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    return text.trim();
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    throw new Error("Failed to generate summary.");
  }
};