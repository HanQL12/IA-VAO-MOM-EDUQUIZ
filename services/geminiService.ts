
import { GoogleGenAI, Type } from "@google/genai";
import { QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const extractQuizFromText = async (text: string): Promise<QuizQuestion[]> => {
  // Sử dụng gemini-3-pro-preview để xử lý các tài liệu dài và cấu trúc phức tạp
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `Bạn là chuyên gia trích xuất dữ liệu. Nhiệm vụ của bạn là đọc văn bản thô trích xuất từ PDF và chuyển đổi thành danh sách câu hỏi trắc nghiệm JSON.

VĂN BẢN PDF CẦN XỬ LÝ:
---
${text}
---

YÊU CẦU NGHIÊM NGẶT:
1. TRÍCH XUẤT 100%: Tìm và trích xuất TOÀN BỘ câu hỏi có trong văn bản. Không được bỏ qua bất kỳ câu nào từ đầu đến cuối.
2. NHẬN DIỆN ĐÁP ÁN ĐÚNG:
   - Ưu tiên các đáp án có dấu sao '*' đứng trước (Ví dụ: *A. Nội dung hoặc *C...).
   - Nếu một câu hỏi không có dấu '*', hãy cố gắng xác định đáp án đúng dựa trên ngữ cảnh hoặc nội dung in đậm/gạch chân nếu có thể suy luận từ văn bản thô. 
   - Nếu hoàn toàn không thấy đáp án đúng, hãy mặc định chọn đáp án đầu tiên (chỉ số 0) để không làm mất câu hỏi.
3. LÀM SẠCH: 
   - Loại bỏ số thứ tự câu (Câu 1:, 1/...) khỏi trường 'question'.
   - Loại bỏ các ký hiệu A., B., C., D. khỏi các phần tử trong mảng 'options'.
   - Loại bỏ hoàn toàn nội dung rác: Header, Footer, số trang, quảng cáo website.
4. ĐỊNH DẠNG ĐẦU RA: Phải trả về một mảng JSON thuần túy, không kèm theo văn bản giải thích.`,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 4000 },
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING, description: "Nội dung câu hỏi sạch" },
            options: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "Mảng chứa đúng 4 lựa chọn" 
            },
            correctIndex: { type: Type.INTEGER, description: "Vị trí đáp án đúng (0-3)" }
          },
          required: ["question", "options", "correctIndex"]
        }
      }
    }
  });

  try {
    let textOutput = response.text || '[]';
    
    // Xử lý trường hợp mô hình bao bọc JSON trong markdown ```json ... ```
    if (textOutput.includes('```')) {
      textOutput = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    }

    const questions: QuizQuestion[] = JSON.parse(textOutput);
    
    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("Dữ liệu trả về trống.");
    }

    // Đảm bảo mỗi câu hỏi có ID duy nhất
    return questions.map((q, idx) => ({
      ...q,
      id: `q-${idx}-${Date.now()}`,
      // Đảm bảo options luôn có dữ liệu
      options: Array.isArray(q.options) ? q.options : ["N/A", "N/A", "N/A", "N/A"]
    }));
  } catch (error) {
    console.error("Lỗi chi tiết từ Gemini hoặc Parse JSON:", error);
    throw new Error("Hệ thống AI không thể nhận diện được cấu trúc câu hỏi trong file này. Vui lòng đảm bảo các câu hỏi có định dạng trắc nghiệm rõ ràng (A, B, C, D) và đáp án đúng có dấu '*' phía trước.");
  }
};
