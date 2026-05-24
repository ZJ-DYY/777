
import { GoogleGenAI, Type } from "@google/genai";
import { ReportData, SideEffectAdvice, UKBLifestyleProfile } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
export const fileToGenerativePart = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove data url prefix (e.g. "data:image/jpeg;base64,")
      const base64Data = base64String.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const analyzeMedicalReport = async (base64Image: string, mimeType: string): Promise<ReportData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "请分析这份医疗报告图片。1. 首先判断这是“检验科化验单 (LAB)”还是“CT/影像学报告 (CT)”。2. 如果是化验单，提取所有数值指标。如果是CT，提取关键的测量值（如肿瘤大小）。3. 生成一份临床辅助解读。请返回 JSON 格式。"
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reportType: { type: Type.STRING, enum: ["LAB", "CT"], description: "报告类型" },
            extractedMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "指标名称 (e.g., WBC, 肿瘤最大径)" },
                  value: { type: Type.NUMBER, description: "数值 (数字类型)" }
                }
              },
              description: "提取的指标列表"
            },
            summary: { type: Type.STRING, description: "简短中文总结" },
            clinicalAnalysis: { type: Type.STRING, description: "详细的临床辅助解读 (Markdown格式, 200字左右)" },
            date: { type: Type.STRING, description: "报告日期 YYYY-MM-DD" }
          },
          required: ["extractedMetrics", "summary", "date", "clinicalAnalysis", "reportType"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    
    // Transform array to record/dictionary
    const metricsRecord: Record<string, number> = {};
    if (result.extractedMetrics) {
      result.extractedMetrics.forEach((m: any) => {
        if (m.name && m.value !== undefined) {
          metricsRecord[m.name] = m.value;
        }
      });
    }

    // Determine mime prefix for storage
    const mimePrefix = mimeType === 'image/png' ? 'data:image/png;base64,' : 'data:image/jpeg;base64,';

    return {
      id: Date.now().toString(),
      metrics: metricsRecord,
      reportType: result.reportType || 'LAB',
      summary: result.summary || "分析完成",
      clinicalAnalysis: result.clinicalAnalysis || "AI 建议：请结合临床症状，咨询主治医生。",
      date: result.date || new Date().toISOString().split('T')[0],
      imageUrl: `${mimePrefix}${base64Image}`
    };
  } catch (error) {
    console.error("Error analyzing report:", error);
    throw new Error("报告分析失败，请确保图片清晰。");
  }
};

export const getDrugSideEffectAdvice = async (drugName: string, reportedSymptoms: string[]): Promise<SideEffectAdvice[]> => {
  try {
    const prompt = `
      患者正在服用肺癌治疗药物：${drugName}。
      患者报告了以下症状/问题：${reportedSymptoms.join(", ")}。
      
      针对每一个报告的症状，请提供中文的家庭护理指导建议。
      如果该药物有与症状匹配的常见副作用，请解释这种联系。
      请判断是否需要立即就医。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              symptom: { type: Type.STRING, description: "症状名称 (中文)" },
              severity: { type: Type.STRING, enum: ["Mild", "Moderate", "Severe"] },
              careGuide: { type: Type.STRING, description: "温暖、鼓励性的中文家庭护理建议。" },
              seekDoctor: { type: Type.BOOLEAN, description: "如果需要立即就医则为 True" }
            },
            required: ["symptom", "careGuide", "seekDoctor", "severity"]
          }
        }
      }
    });

    const result = JSON.parse(response.text || "[]");
    return result as SideEffectAdvice[];
  } catch (error) {
    console.error("Error fetching advice:", error);
    return [];
  }
};

export const generateLifestyleReport = async (profile: UKBLifestyleProfile, currentTreatment: string, patientName: string): Promise<string> => {
    try {
        const prompt = `
          请根据患者 ${patientName} 的 UK Biobank (UKB) 生活方式数据生成一份全生命周期健康改善建议。
          当前治疗方案：${currentTreatment}。
          
          患者数据：
          - 吸烟状态 (20116): ${profile.smokingStatus === 2 ? "现吸烟" : profile.smokingStatus === 1 ? "已戒烟" : "从不吸烟"}
          - 吸烟包年 (20161): ${profile.packYears}年
          - 睡眠时长 (1160): ${profile.sleepDuration}小时
          - 主观睡眠质量 (20535): ${profile.sleepQualityScore}/10
          - 气短程度 (4717): ${profile.shortnessOfBreath}/4
          - 是否喘鸣 (22502): ${profile.hasWheezing ? "有" : "无"}
          - 运动水平 (IPAQ 22032): ${profile.activityLevel === 0 ? "低" : profile.activityLevel === 1 ? "中" : "高"}
          - 水果摄入 (1309): ${profile.fruitIntake}份/天

          请生成一段温暖、富有人文关怀且专业的建议（Markdown格式，300字以内）。
          重点关注：如果患者吸烟，请委婉但坚定地强调戒烟对肺癌预后的重要性；根据睡眠和运动提供具体的可执行的小目标。
          语气要求：像一位老朋友和专业医生在对话，避免生硬的说教。
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt
        });

        return response.text || "暂时无法生成建议，请稍后再试。";
    } catch (error) {
        console.error("Error generating lifestyle report:", error);
        return "网络连接不稳定，请稍后重试生成。";
    }
};
