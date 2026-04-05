
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import type { Attendee, MeetingMinutesData } from './types';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Gemini AI instance
const apiKey = import.meta.env.VITE_GEMINI_API_KEY || process.env.API_KEY || '';
if (!apiKey) {
    console.warn("Gemini API Key is missing. Please set VITE_GEMINI_API_KEY in your environment.");
}
const ai = new GoogleGenAI({ apiKey });

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

// Gemini service function to extract amount from a receipt image
const extractAmountFromReceipt = async (base64Image: string, mimeType: string): Promise<string> => {
    const prompt = `Provided is an image of a receipt. Find the total amount and return it in a JSON format with a single key "amount". For example: { "amount": "73,000" }. The value should be a string.`;

    const imagePart = {
        inlineData: {
            data: base64Image,
            mimeType: mimeType
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: { parts: [{ text: prompt }, imagePart] },
            config: {
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        amount: { type: Type.STRING, description: "The total amount from the receipt" },
                    },
                    required: ["amount"]
                },
            }
        });
        const jsonText = response.text.trim();
        const parsedJson = JSON.parse(jsonText);
        return `${parsedJson.amount}원`;
    } catch (e) {
        console.error("Failed to parse JSON response for receipt:", e);
        return "금액 추출 실패";
    }
};


const projectData = [
    { supportProject: "플이사업", sponsoringOrganization: "(사)동아시아바다공동체 오션", researcherInCharge: "홍선욱" },
    { supportProject: "바다기사단", sponsoringOrganization: "(사)동아시아바다공동체 오션", researcherInCharge: "홍선욱" },
    { supportProject: "GS리테일 해양생태계 보호 프로젝트", sponsoringOrganization: "GS리테일", researcherInCharge: "홍선욱" },
    { supportProject: "2026 GS리테일 바다숨 프로젝트", sponsoringOrganization: "GS리테일", researcherInCharge: "홍선욱" },
    { supportProject: "임팩트그라운드", sponsoringOrganization: "브라이언임팩트", researcherInCharge: "홍선욱" },
    { supportProject: "자체모니터링", sponsoringOrganization: "해피빈-생물피해", researcherInCharge: "이종수" },
    { supportProject: "필리핀 마닐라만 해양쓰레기 관리\n역량강화 사업 PMC 용역", sponsoringOrganization: "KOICA", researcherInCharge: "홍선욱" },
    { supportProject: "전국 항만 폐타이어 방충재 실태조사", sponsoringOrganization: "해양환경공단", researcherInCharge: "이종명" },
    { supportProject: "부산시 지능형 해양환경 관리지원을 위한 해양정화활동 활성화 및 콘텐츠 제작 지원 사업", sponsoringOrganization: "한국해양과학기술원", researcherInCharge: "이종수" },
    { supportProject: "제1차 해양폐기물 및 해양오염퇴적물\n관리 기본계획 변경계획 수립 연구", sponsoringOrganization: "한국해양수산개발원", researcherInCharge: "홍선욱" },
    { supportProject: "빅데이터 플랫폼 기반 분석서비스", sponsoringOrganization: "한국지능정보사회진흥원", researcherInCharge: "홍선욱" },
    { supportProject: "빅데이터 플랫폼 및 센터 구축 사업", sponsoringOrganization: "한국지능정보사회진흥원", researcherInCharge: "홍선욱" },
    { supportProject: "2025년 해양폐기물 실태조사", sponsoringOrganization: "해양환경공단", researcherInCharge: "이종수" },
];

projectData.sort((a, b) => a.supportProject.localeCompare(b.supportProject, 'ko'));

const allPersonnel = [
    { name: '홍선욱', affiliation: '(사)동아시아바다공동체 오션', position: '대표' },
    { name: '이종명', affiliation: '(사)동아시아바다공동체 오션', position: '소장' },
    { name: '이종수', affiliation: '(사)동아시아바다공동체 오션', position: '책임연구원' },
    { name: '정호승', affiliation: '(사)동아시아바다공동체 오션', position: '책임연구원' },
    { name: '도파라', affiliation: '(사)동아시아바다공동체 오션', position: '선임연구원' },
    { name: '김혜주', affiliation: '(사)동아시아바다공동체 오션', position: '선임연구원' },
    { name: '김령규', affiliation: '(사)동아시아바다공동체 오션', position: '연구원' },
    { name: '한국인', affiliation: '(사)동아시아바다공동체 오션', position: '연구원' },
    { name: '앨리시아', affiliation: '(사)동아시아바다공동체 오션', position: '연구원' },
    { name: '이민성', affiliation: '(사)동아시아바다공동체 오션', position: '연구원' },
    { name: '최나율', affiliation: '(사)동아시아바다공동체 오션', position: '연구원' },
    { name: '박해주', affiliation: '(사)동아시아바다공동체 오션', position: '연구원' },
    { name: '곽태진', affiliation: '데브구루', position: 'CTO' },
    { name: '송상훈', affiliation: '데브구루', position: '팀장' },
    { name: '임세한', affiliation: '오오아이', position: '대표' },
];

const today = new Date();

const initialMinutesData: MeetingMinutesData = {
  sponsoringOrganization: '',
  supportProject: '',
  date: { 
    year: today.getFullYear().toString(), 
    month: (today.getMonth() + 1).toString().padStart(2, '0'), 
    day: today.getDate().toString().padStart(2, '0') 
  },
  time: { startH: '17', startM: '30', endH: '18', endM: '30' },
  location: '',
  agenda: '',
  attendeeSummary: '',
  meetingContent: [''],
  researcherInCharge: '',
  claimedAmount: '',
  attachments: ['참석자 명단 [별지1] 첨부', '영수증 [별지2] 첨부'],
  attendees: [],
};

const initialAttendeesData: Attendee[] = [
  { id: '1', name: '', affiliation: '', position: '', signature: null },
  { id: '2', name: '', affiliation: '', position: '', signature: null },
  { id: '3', name: '', affiliation: '', position: '', signature: null },
  { id: '4', name: '', affiliation: '', position: '', signature: null },
];

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const PdfIcon: React.FC = () => (
    <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 l3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
);

type Project = typeof projectData[0];

const App: React.FC = () => {
  const [minutes, setMinutes] = useState<MeetingMinutesData>(initialMinutesData);
  const [attendees, setAttendees] = useState<Attendee[]>(initialAttendeesData);
  const [signature, setSignature] = useState<string | null>(null);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const receiptInputRef = useRef<HTMLInputElement>(null);
  const [isProjectSelected, setIsProjectSelected] = useState(false);
  const [projectSuggestions, setProjectSuggestions] = useState<Project[]>([]);
  const projectInputContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (projectInputContainerRef.current && !projectInputContainerRef.current.contains(event.target as Node)) {
        setProjectSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSupportProjectFocus = () => {
    if (!isProjectSelected) {
        setProjectSuggestions(projectData);
    }
  };

  const handleMinutesChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const normalizedValue = value.replace(/\r\n/g, '\n');

    if (name === 'supportProject') {
        const selectedProject = projectData.find(p => p.supportProject === normalizedValue);
        
        if (selectedProject) {
            setMinutes(prev => ({
                ...prev,
                supportProject: selectedProject.supportProject,
                sponsoringOrganization: selectedProject.sponsoringOrganization,
                researcherInCharge: selectedProject.researcherInCharge
            }));
            setIsProjectSelected(true);
            setProjectSuggestions([]); 
        } else {
            setMinutes(prev => ({
                ...prev,
                supportProject: value,
                sponsoringOrganization: '',
                researcherInCharge: ''
            }));
            setIsProjectSelected(false);
            if (value) {
                const suggestions = projectData.filter(p => 
                    p.supportProject.toLowerCase().replace(/\n/g, ' ').includes(value.toLowerCase().replace(/\n/g, ' '))
                );
                setProjectSuggestions(suggestions);
            } else {
                setProjectSuggestions([]);
            }
        }
    } else if (name === 'meetingContent') {
      setMinutes(prev => ({ ...prev, meetingContent: value.split('\n') }));
    } else {
      setMinutes((prev) => ({ ...prev, [name]: value }));
    }
  };
  
  const handleProjectSelect = (project: Project) => {
      setMinutes(prev => ({
          ...prev,
          supportProject: project.supportProject,
          sponsoringOrganization: project.sponsoringOrganization,
          researcherInCharge: project.researcherInCharge
      }));
      setIsProjectSelected(true);
      setProjectSuggestions([]);
  }

  const handleProjectReset = () => {
      setMinutes(prev => ({
        ...prev,
        supportProject: '',
        sponsoringOrganization: '',
        researcherInCharge: ''
      }));
      setIsProjectSelected(false);
  }

  const handleDatePartChange = (part: keyof MeetingMinutesData['date'], value: string) => {
    if (/^\d*$/.test(value)) { 
        setMinutes(prev => ({ ...prev, date: {...prev.date, [part]: value} }));
    }
  };

  const handleTimePartChange = (part: keyof MeetingMinutesData['time'], value: string) => {
      if (/^\d*$/.test(value)) { 
          setMinutes(prev => ({ ...prev, time: {...prev.time, [part]: value} }));
      }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if(e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          reader.onload = (event) => {
              setSignature(event.target?.result as string);
          }
          reader.readAsDataURL(e.target.files[0]);
      }
  }
  
  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setIsProcessingReceipt(true);
        
        const reader = new FileReader();
        reader.onload = (event) => {
            setReceiptImage(event.target?.result as string);
        }
        reader.readAsDataURL(file);

        try {
            const base64Data = await fileToBase64(file);
            const extractedAmount = await extractAmountFromReceipt(base64Data, file.type);
            setMinutes(prev => ({ ...prev, claimedAmount: extractedAmount }));
        } catch (error) {
            console.error("Error processing receipt:", error);
            alert("영수증 분석에 실패했습니다.");
        } finally {
            setIsProcessingReceipt(false);
        }
    }
  };

  const handleClearReceipt = () => {
    setReceiptImage(null);
    if (receiptInputRef.current) {
        receiptInputRef.current.value = "";
    }
  };

  const handleAttachmentChange = (index: number, value: string) => {
    const newAttachments = [...minutes.attachments];
    newAttachments[index] = value;
    setMinutes(prev => ({...prev, attachments: newAttachments}));
  }

  const handleAttendeeChange = (
    id: string,
    field: keyof Omit<Attendee, 'id'>,
    value: string
  ) => {
    setAttendees((prev) =>
      prev.map((attendee) => {
        if (attendee.id === id) {
           const updatedAttendee = { ...attendee, [field]: value };
            if (field === 'name') {
              const person = allPersonnel.find(p => p.name === value);
              if (person) {
                updatedAttendee.affiliation = person.affiliation;
                updatedAttendee.position = person.position;
              }
            }
            return updatedAttendee;
        }
        return attendee;
      })
    );
  };

  const handleAttendeeSignatureUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if(e.target.files && e.target.files[0]) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const signatureDataUrl = event.target?.result as string;
            setAttendees(prev => prev.map(att => att.id === id ? { ...att, signature: signatureDataUrl } : att));
        }
        reader.readAsDataURL(e.target.files[0]);
    }
  }
  
  const removeAttendeeSignature = (id: string) => {
      setAttendees(prev => prev.map(att => att.id === id ? { ...att, signature: null } : att));
  }

  const addAttendee = () => {
    setAttendees((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', affiliation: '', position: '', signature: null },
    ]);
  };

  const removeLastAttendee = () => {
    setAttendees((prev) => prev.slice(0, -1));
  };
  
  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      console.log("Starting PDF generation...");
      
      // 1. Wait for all images to decode
      const images = Array.from(document.querySelectorAll('img'));
      await Promise.all(images.map(img => {
        if (img.complete) return Promise.resolve();
        return img.decode().catch(e => console.warn("Image decode failed", e));
      }));

      // 2. Initialize PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageElements = document.querySelectorAll('.page-container');
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;

      for (let i = 0; i < pageElements.length; i++) {
          console.log(`Capturing page ${i + 1}...`);
          const page = pageElements[i] as HTMLElement;
          
          const canvas = await html2canvas(page, {
              scale: 1.5,
              useCORS: true,
              logging: false, // Turn off for production
              allowTaint: true,
              backgroundColor: '#ffffff',
              onclone: (documentClone: Document) => {
                  // CRITICAL: Remove all oklch variables from the cloned document to prevent html2canvas error
                  const style = documentClone.createElement('style');
                  style.textContent = `
                    * {
                      --background: #ffffff !important;
                      --foreground: #000000 !important;
                      --tw-ring-color: transparent !important;
                      --tw-ring-offset-color: transparent !important;
                      --tw-ring-shadow: none !important;
                      --tw-shadow: none !important;
                      --tw-shadow-colored: none !important;
                      color-scheme: light !important;
                    }
                  `;
                  documentClone.head.appendChild(style);

                  // Hide elements marked as print:hidden
                  documentClone.querySelectorAll('.print\\:hidden').forEach(el => {
                      (el as HTMLElement).style.display = 'none';
                  });
                  
                  // Explicitly hide all file inputs
                  documentClone.querySelectorAll('input[type="file"]').forEach(el => {
                      (el as HTMLElement).style.display = 'none';
                  });

                  // Handle date/time fields
                  const dateContainer = documentClone.querySelector('.date-time-field-container');
                  if (dateContainer) {
                      const inputs = Array.from(dateContainer.querySelectorAll<HTMLInputElement>('input'));
                      if (inputs.length === 7) {
                          const dateString = `${inputs[0].value}년 ${inputs[1].value}월 ${inputs[2].value}일 ${inputs[3].value}:${inputs[4].value} ~ ${inputs[5].value}:${inputs[6].value}`;
                          const textDiv = documentClone.createElement('div');
                          textDiv.textContent = dateString;
                          textDiv.style.textAlign = 'center';
                          textDiv.style.width = '100%';
                          textDiv.style.fontSize = '14px';
                          dateContainer.innerHTML = '';
                          dateContainer.appendChild(textDiv);
                      }
                  }

                  // Adjust table headers
                  documentClone.querySelectorAll('th').forEach(th => {
                      (th as HTMLElement).style.paddingBottom = "0.8rem";
                  });

                  // Adjust receipt image size in PDF
                  const receiptImg = documentClone.querySelector('#page-3 img[alt="receipt"]') as HTMLImageElement;
                  if (receiptImg) {
                      receiptImg.style.width = '300px';
                      receiptImg.style.height = 'auto';
                      receiptImg.style.maxWidth = '100%';
                      receiptImg.style.display = 'block';
                      receiptImg.style.margin = '0 auto';
                  }

                  // Replace inputs/textareas with divs for better rendering
                  documentClone.querySelectorAll('input, textarea').forEach(el => {
                      const element = el as HTMLInputElement | HTMLTextAreaElement;
                      if (element.type === 'file' || element.type === 'hidden') return;
                      
                      const div = documentClone.createElement('div');
                      div.style.whiteSpace = 'pre-wrap';
                      div.style.wordBreak = 'break-word';
                      div.textContent = element.value;

                      const style = window.getComputedStyle(element);
                      div.style.cssText += `
                          font-family: ${style.fontFamily};
                          font-size: ${style.fontSize};
                          text-align: ${style.textAlign};
                          color: ${style.color};
                          width: ${style.width};
                          min-height: ${style.height};
                          display: flex;
                          align-items: center;
                          padding: ${style.padding};
                          box-sizing: border-box;
                          background-color: transparent;
                          border: none;
                      `;
                      if (style.textAlign === 'center') {
                          div.style.justifyContent = 'center';
                      }
                      div.style.paddingBottom = `calc(${style.paddingBottom} + 4px)`;
                      
                      if (element.parentNode) {
                        element.parentNode.replaceChild(div, element);
                      }
                  });
              }
          });

          const imgData = canvas.toDataURL('image/png');
          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = A4_WIDTH;
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          if (i > 0) pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, Math.min(pdfHeight, A4_HEIGHT));
      }

      const dateStr = `${minutes.date.year.slice(-2)}${minutes.date.month.padStart(2, '0')}${minutes.date.day.padStart(2, '0')}`;
      const fileName = `${minutes.sponsoringOrganization || '지원기관'}_회의비_${minutes.agenda || '안건'}_(${dateStr})_회의록.pdf`;
      pdf.save(fileName);
      console.log("PDF saved successfully!");
    } catch (error) {
      console.error("PDF generation failed at stage:", error);
      alert(`PDF 생성 중 오류가 발생했습니다.\n상세내용: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const commonInputClass = "w-full p-1 border-none focus:ring-1 focus:ring-blue-500 rounded-sm bg-white text-black";
  const dateTimeInputClass = "text-center bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 rounded-sm";

  const formattedDate = `${minutes.date.year}년 ${minutes.date.month}월 ${minutes.date.day}일`;
  const formattedTime = `${minutes.time.startH}:${minutes.time.startM}~${minutes.time.endH}:${minutes.time.endM}`;

  return (
    <div className="bg-gray-200 p-4 sm:p-8">
      <header className="max-w-4xl mx-auto mb-4 flex justify-between items-center print:hidden">
        <h1 className="text-2xl font-bold text-black">회의록 작성</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={handleDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center justify-center disabled:bg-blue-400"
          >
            {isGeneratingPdf ? <SpinnerIcon /> : <PdfIcon />}
            {isGeneratingPdf ? '생성 중...' : 'PDF로 다운로드'}
          </button>
        </div>
      </header>
      <main>
        <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg page-container flex flex-col" id="page-1">
          <h2 className="text-center text-3xl mb-6 text-black tracking-[0.5em] pl-[0.5em]">회 의 록</h2>
          <div className="border-2 border-black flex flex-col flex-grow">
            <div className="grid grid-cols-6 border-b-2 border-black">
              {/* Row 1 */}
              <div className="p-2 bg-gray-100 text-center font-semibold border-b border-r border-black flex items-center justify-center text-black min-h-[5rem]">지원기관</div>
              <div className="p-1 border-b border-r border-black col-span-2 flex items-center">
                <input type="text" name="sponsoringOrganization" value={minutes.sponsoringOrganization} onChange={handleMinutesChange} className={`${commonInputClass} text-center`} readOnly={isProjectSelected} />
              </div>
              <div className="p-2 bg-gray-100 text-center font-semibold border-b border-r border-black flex items-center justify-center text-black min-h-[5rem]">지원 사업</div>
              <div className="p-1 border-b border-black col-span-2 relative" ref={projectInputContainerRef}>
                  <textarea
                      name="supportProject"
                      value={minutes.supportProject}
                      onChange={handleMinutesChange}
                      onFocus={handleSupportProjectFocus}
                      className={`${commonInputClass} text-center resize-none`}
                      rows={2}
                      placeholder="지원 사업명을 입력하세요"
                      autoComplete="off"
                  />
                  {isProjectSelected && (
                      <button onClick={handleProjectReset} className="absolute top-1 right-1 text-xs text-blue-600 hover:underline print:hidden bg-white px-1 rounded">
                          다시 선택하기
                      </button>
                  )}
                  {projectSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                          {projectSuggestions.map(p => (
                              <div 
                                  key={p.supportProject} 
                                  onClick={() => handleProjectSelect(p)}
                                  className="p-2 hover:bg-gray-100 cursor-pointer text-sm whitespace-pre-wrap text-black"
                              >
                                  {p.supportProject}
                              </div>
                          ))}
                      </div>
                  )}
              </div>

              {/* Row 2 */}
              <div className="p-2 bg-gray-100 text-center font-semibold border-b border-r border-black flex items-center justify-center text-black">일 시</div>
              <div className="p-1 border-b border-r border-black col-span-2 flex items-center justify-center text-black text-sm whitespace-nowrap date-time-field-container">
                <input type="text" value={minutes.date.year} onChange={(e) => handleDatePartChange('year', e.target.value)} className={`${dateTimeInputClass} w-10`} maxLength={4} />
                <span className="font-semibold mx-px">년</span>
                <input type="text" value={minutes.date.month} onChange={(e) => handleDatePartChange('month', e.target.value)} className={`${dateTimeInputClass} w-6`} maxLength={2} />
                <span className="font-semibold mx-px">월</span>
                <input type="text" value={minutes.date.day} onChange={(e) => handleDatePartChange('day', e.target.value)} className={`${dateTimeInputClass} w-6`} maxLength={2} />
                <span className="font-semibold mx-px">일</span>
                
                <input type="text" value={minutes.time.startH} onChange={(e) => handleTimePartChange('startH', e.target.value)} className={`${dateTimeInputClass} w-6 ml-1`} maxLength={2} />
                <span className="mx-px">:</span>
                <input type="text" value={minutes.time.startM} onChange={(e) => handleTimePartChange('startM', e.target.value)} className={`${dateTimeInputClass} w-6`} maxLength={2} />
                <span className="mx-px">~</span>
                <input type="text" value={minutes.time.endH} onChange={(e) => handleTimePartChange('endH', e.target.value)} className={`${dateTimeInputClass} w-6`} maxLength={2} />
                <span className="mx-px">:</span>
                <input type="text" value={minutes.time.endM} onChange={(e) => handleTimePartChange('endM', e.target.value)} className={`${dateTimeInputClass} w-6`} maxLength={2} />
              </div>
              <div className="p-2 bg-gray-100 text-center font-semibold border-b border-r border-black flex items-center justify-center text-black">장 소</div>
              <div className="p-1 border-b border-black col-span-2">
                <input type="text" name="location" value={minutes.location} onChange={handleMinutesChange} className={`${commonInputClass} text-center`} />
              </div>
              
              {/* Row 3 */}
              <div className="p-2 bg-gray-100 text-center font-semibold border-b border-r border-black flex items-center justify-center text-black">안 건</div>
              <div className="p-1 border-b border-black col-span-5">
                <input type="text" name="agenda" value={minutes.agenda} onChange={handleMinutesChange} className={`${commonInputClass} text-center`} />
              </div>
              
              {/* Row 4 */}
              <div className="p-2 bg-gray-100 text-center font-semibold border-b border-r border-black flex items-center justify-center text-black">참 석 자</div>
              <div className="p-1 border-b border-black col-span-5">
                <input type="text" name="attendeeSummary" value={minutes.attendeeSummary} onChange={handleMinutesChange} className={commonInputClass} />
              </div>

              {/* Meeting Content */}
              <div className="p-2 bg-gray-100 text-center font-semibold border-r border-black col-span-1 flex items-center justify-center text-black">회의내용</div>
              <div className="p-1 col-span-5 min-h-[200px] flex items-center justify-center">
                <textarea 
                  name="meetingContent" 
                  value={minutes.meetingContent.join('\n')} 
                  onChange={handleMinutesChange}
                  rows={minutes.meetingContent.length + 2}
                  className="w-full p-1 border-none focus:ring-1 focus:ring-blue-500 rounded-sm resize-none bg-white text-black leading-relaxed"
                />
              </div>
            </div>
            <div className="p-4 flex items-center border-b-2 border-black">
                <div className="flex-1"></div>
                <div className="flex items-center justify-center gap-4 flex-shrink-0 text-center">
                    <label className="font-semibold text-black">연구책임자 : </label>
                    <input 
                      type="text" 
                      name="researcherInCharge" 
                      value={minutes.researcherInCharge}
                      onChange={handleMinutesChange}
                      className="w-40 p-1 text-center border-b focus:outline-none focus:border-blue-500 bg-white text-black"
                      readOnly={isProjectSelected}
                    />
                    <div className="relative w-28 h-14 flex items-center justify-center">
                      <span className="text-lg text-black">(인)</span>
                      {signature && (
                          <img src={signature} alt="signature" className="absolute inset-0 w-full h-full object-contain transform scale-150" />
                      )}
                    </div>
                </div>
                <div className="flex-1 flex justify-end items-center gap-2">
                     <input type="file" accept="image/*" ref={signatureInputRef} onChange={handleSignatureUpload} className="hidden" />
                     {!signature ? (
                         <button onClick={() => signatureInputRef.current?.click()} className="text-xs px-2 py-1 bg-gray-200 rounded print:hidden">서명 업로드</button>
                     ) : (
                          <div className="flex items-center gap-2 print:hidden">
                              <button onClick={() => signatureInputRef.current?.click()} className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded">다시 선택하기</button>
                              <button onClick={() => setSignature(null)} className="text-xs px-2 py-1 bg-red-200 hover:bg-red-300 rounded">삭제</button>
                          </div>
                     )}
                </div>
            </div>
            <div className="flex-grow flex flex-col">
              <h3 className="text-center text-xl font-bold p-2 bg-gray-100 text-black tracking-[0.5em] pl-[0.5em]">영 수 증 첨 부</h3>
              <div className="p-4 flex-grow">
                   <div className="flex items-center mb-4">
                      <label className="font-bold text-blue-600 text-lg">청구금액 : </label>
                      <input type="text" name="claimedAmount" value={minutes.claimedAmount} onChange={handleMinutesChange} className="p-1 border-b focus:outline-none focus:border-blue-500 bg-white text-black font-bold text-blue-600 text-lg" />
                      <input type="file" accept="image/*" ref={receiptInputRef} onChange={handleReceiptUpload} className="hidden" />
                      <button
                          onClick={() => receiptInputRef.current?.click()}
                          disabled={isProcessingReceipt}
                          className="ml-4 px-3 py-1 bg-black text-white text-xs rounded-md flex items-center justify-center hover:bg-gray-800 disabled:bg-gray-400 print:hidden"
                      >
                          {isProcessingReceipt ? <SpinnerIcon/> : '영수증 업로드'}
                      </button>
                  </div>
                  <div className="space-y-2">
                    {minutes.attachments.map((att, index) => (
                      <div key={index} className="flex items-center">
                        <span className="text-black mr-1">-</span>
                        <input type="text" value={att} onChange={(e) => handleAttachmentChange(index, e.target.value)} className="w-full p-1 border-none focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-black" />
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg mt-8 print:mt-0 page-container" id="page-2">
          <div className="relative">
            <p className="absolute top-0 left-0 text-lg text-black">[별지1]</p>
            <h2 className="text-center text-3xl mb-8 text-black">회의 참석자 명부</h2>
          </div>
          <div className="text-lg mb-8 text-black">
              <p><strong>회의명 :</strong> {minutes.agenda}</p>
              <p><strong>일시, 장소 :</strong> {`${formattedDate} ${formattedTime}`} {minutes.location}</p>
          </div>
          <table className="w-full border-collapse border border-black table-fixed">
              <thead>
                  <tr className="bg-gray-100">
                      <th className="border border-black p-2 font-semibold text-black w-[10%]">순번</th>
                      <th className="border border-black p-2 font-semibold text-black w-[20%]">이름</th>
                      <th className="border border-black p-2 font-semibold text-black w-[35%]">소속</th>
                      <th className="border border-black p-2 font-semibold text-black w-[15%]">직책</th>
                      <th className="border border-black p-2 font-semibold text-black w-[20%]">서명</th>
                  </tr>
              </thead>
              <tbody>
                  {attendees.map((attendee, index) => (
                      <tr key={attendee.id}>
                          <td className="border border-black p-1 text-center text-black">{index + 1}</td>
                          <td className="border border-black p-1 text-center">
                            <input 
                                type="text" 
                                value={attendee.name} 
                                onChange={e => handleAttendeeChange(attendee.id, 'name', e.target.value)} 
                                className={`${commonInputClass} text-center`}
                                list="personnel-list"
                            />
                          </td>
                          <td className="border border-black p-1"><input type="text" value={attendee.affiliation} onChange={e => handleAttendeeChange(attendee.id, 'affiliation', e.target.value)} className={`${commonInputClass} text-center`}/></td>
                          <td className="border border-black p-1"><input type="text" value={attendee.position} onChange={e => handleAttendeeChange(attendee.id, 'position', e.target.value)} className={`${commonInputClass} text-center`}/></td>
                          <td className="border border-black p-1 text-center h-14 relative">
                            <input 
                                type="file" 
                                accept="image/*" 
                                id={`sig-upload-${attendee.id}`} 
                                onChange={(e) => handleAttendeeSignatureUpload(attendee.id, e)} 
                                className="hidden" 
                            />
                            {!attendee.signature ? (
                                <button 
                                onClick={() => document.getElementById(`sig-upload-${attendee.id}`)?.click()} 
                                className="text-xs px-2 py-1 bg-gray-200 rounded print:hidden"
                                >
                                서명 업로드
                                </button>
                            ) : (
                                <>
                                <img src={attendee.signature} alt="signature" className="absolute inset-0 w-full h-full object-contain p-1" />
                                <div className="absolute top-1 right-1 flex print:hidden">
                                    <button 
                                        onClick={() => document.getElementById(`sig-upload-${attendee.id}`)?.click()} 
                                        className="text-xs px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded-l-md"
                                        title="다시 선택하기"
                                    >
                                        다시 선택
                                    </button>
                                    <button 
                                        onClick={() => removeAttendeeSignature(attendee.id)} 
                                        className="text-xs px-2 py-1 bg-red-200 hover:bg-red-300 text-red-800 rounded-r-md"
                                        title="삭제"
                                    >
                                        X
                                    </button>
                                </div>
                                </>
                            )}
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
          <datalist id="personnel-list">
            {allPersonnel.map(p => <option key={p.name} value={p.name} />)}
          </datalist>
          <div className="text-center mt-4 space-x-4 print:hidden">
              <button onClick={addAttendee} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-semibold text-black">참석자 추가</button>
              <button onClick={removeLastAttendee} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md text-sm font-semibold text-black">참석자 삭제</button>
          </div>
          <div className="text-center mt-12">
              <h3 className="text-3xl text-black">(사)동아시아바다공동체 오션</h3>
          </div>
        </div>

        <div className="max-w-4xl mx-auto bg-white p-8 shadow-lg mt-8 print:mt-0 page-container flex flex-col" id="page-3">
          <div className="relative">
            <p className="absolute top-0 left-0 text-lg text-black">[별지2]</p>
          </div>
          
          <div className="flex-grow flex flex-col items-center justify-center">
              {receiptImage ? (
                  <div className="w-full">
                      <div className="text-right mb-2">
                          <button onClick={handleClearReceipt} className="text-red-500 hover:underline print:hidden">
                              삭제
                          </button>
                      </div>
                      <div className="border p-2 rounded-md w-full flex justify-center">
                          <img src={receiptImage} alt="receipt" className="max-w-md object-contain mx-auto" style={{ maxHeight: '60vh' }}/>
                      </div>
                  </div>
              ) : (
                  <div className="text-gray-500 print:hidden">
                      영수증을 업로드해주세요.
                  </div>
              )}
          </div>
        </div>
      </main>
      <style>{`
        body {
          font-family: 'NanumSquare', sans-serif;
        }
        @media screen {
          .page-container {
            width: 100%;
            max-width: 8.5in;
            min-height: 11in;
            margin-left: auto;
            margin-right: auto;
          }
        }
        @media print {
          @page {
            size: A4;
            margin: 20mm;
          }
          body {
            background-color: white !important;
            margin: 0;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .page-container {
            box-shadow: none !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
            page-break-inside: avoid;
            display: block !important; /* Override flex for printing */
          }
          #page-2, #page-3 {
             page-break-before: always;
             margin-top: 0 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          input, textarea, select {
             border: none !important;
             box-shadow: none !important;
             background-color: transparent !important;
             color: black !important;
             -webkit-appearance: none;
             -moz-appearance: none;
             appearance: none;
             padding: 1px;
          }
          input[type="date"]::-webkit-calendar-picker-indicator {
            display: none !important;
          }
          .bg-gray-100 {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
