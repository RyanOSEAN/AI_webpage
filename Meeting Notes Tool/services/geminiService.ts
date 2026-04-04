import { GoogleGenAI, Type } from "@google/genai";
// FIX: Corrected import to use MeetingMinutesData as defined in types.ts.
import { MeetingMinutesData } from '../types';

interface ImagePart {
    inlineData: {
        data: string;
        mimeType: string;
    }
}

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
if (!apiKey) {
    console.warn("Gemini API Key is missing in geminiService. Please set VITE_GEMINI_API_KEY.");
}
const ai = new GoogleGenAI({ apiKey });

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        sponsoringOrganization: { type: Type.STRING, description: "지원기관" },
        supportProject: { type: Type.STRING, description: "지원 사업" },
        date: { type: Type.STRING, description: "회의 일자 (YYYY년 MM월 DD일)" },
        time: { type: Type.STRING, description: "회의 시간 (HH:MM~HH:MM)" },
        location: { type: Type.STRING, description: "장소" },
        agenda: { type: Type.STRING, description: "안건" },
        attendeeSummary: { type: Type.STRING, description: "참석자 요약 (e.g., 이종명 소장 외 3인)" },
        meetingContent: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "회의 내용 목록"
        },
        researcherInCharge: { type: Type.STRING, description: "연구책임자" },
        claimedAmount: { type: Type.STRING, description: "청구금액 (e.g., 73,000원)" },
        attendees: {
            type: Type.ARRAY,
            description: "참석자 상세 목록",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "이름" },
                    affiliation: { type: Type.STRING, description: "소속" },
                    position: { type: Type.STRING, description: "직책" },
                },
                required: ["name", "affiliation", "position"]
            }
        },
        attachments: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "첨부 파일 목록 (e.g., 참석자 명단 [별지1] 첨부)"
        }
    },
    required: [
        "sponsoringOrganization", "supportProject", "date", "time", "location", "agenda",
        "attendeeSummary", "meetingContent", "researcherInCharge", "claimedAmount", "attendees", "attachments"
    ]
};

// FIX: Corrected function return type to use MeetingMinutesData.
export const extractMeetingDetailsFromImages = async (imageParts: ImagePart[]): Promise<MeetingMinutesData> => {
    const prompt = `
        You are a highly intelligent administrative assistant specializing in document analysis.
        Analyze the provided images which contain a meeting minutes document ('회의록'), an attendee list ('회의 참석자 명부'), and a receipt ('영수증').
        Extract all relevant information and structure it into a single, valid JSON object that strictly adheres to the provided schema.
        Ensure all Korean text is extracted accurately. The 'meetingContent', 'attendees', and 'attachments' fields should be arrays.
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        // FIX: Aligned contents structure with recommended format for single-turn multimodal prompts.
        contents: { parts: [{text: prompt}, ...imageParts] },
        config: {
            responseMimeType: 'application/json',
            responseSchema: responseSchema,
        }
    });

    const jsonText = response.text.trim();
    
    try {
        const parsedJson = JSON.parse(jsonText);
        // FIX: Corrected cast to use MeetingMinutesData.
        return parsedJson as MeetingMinutesData;
    } catch (e) {
        console.error("Failed to parse JSON response:", jsonText);
        throw new Error("The API returned an invalid JSON format.");
    }
};
