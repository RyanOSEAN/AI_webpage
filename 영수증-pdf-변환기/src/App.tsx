import React, { useState, useRef } from 'react';
import { Upload, FileText, Download, Loader2, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractReceiptInfo } from './lib/gemini';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ReceiptData {
  paymentMethod: string;
  purpose: string;
  amount: string;
  date: string;
  image: string | null;
}

export default function App() {
  const [data, setData] = useState<ReceiptData>({
    paymentMethod: '',
    purpose: '',
    amount: '',
    date: '',
    image: null,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setData(prev => ({ ...prev, image: base64 }));

      try {
        const result = await extractReceiptInfo(base64, file.type);
        
        // Format date to YYYY-MM-DD for input
        setData(prev => ({
          ...prev,
          amount: result.amount.toLocaleString(),
          date: result.date,
        }));
      } catch (err) {
        console.error(err);
        setError('영수증 정보를 읽는 데 실패했습니다. 수동으로 입력해 주세요.');
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownload = async () => {
    if (!previewRef.current) return;

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      const imgProps = pdf.getImageProperties(imgData);
      const canvasWidth = imgProps.width;
      const canvasHeight = imgProps.height;

      // Calculate scaling to fit within A4 with margins
      const margin = 25; // Increased margin to make the receipt smaller on the page
      const maxWidth = pdfWidth - (margin * 2);
      const maxHeight = pdfHeight - (margin * 2);
      
      let finalWidth = maxWidth;
      let finalHeight = (canvasHeight * finalWidth) / canvasWidth;

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight;
        finalWidth = (canvasWidth * finalHeight) / canvasHeight;
      }

      // Center the image on the page
      const x = (pdfWidth - finalWidth) / 2;
      const y = (pdfHeight - finalHeight) / 2;

      pdf.addImage(imgData, 'JPEG', x, y, finalWidth, finalHeight);

      // Filename format: (yy.mm.dd) [Purpose] 건 영수증.pdf
      const dateObj = new Date(data.date);
      const yy = String(dateObj.getFullYear()).slice(-2);
      const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dateObj.getDate()).padStart(2, '0');
      
      const fileName = `(${yy}.${mm}.${dd}) ${data.purpose || '미지정'} 건 영수증.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error(err);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">영수증 PDF 변환기</h1>
          <p className="text-slate-600 text-lg">영수증을 업로드하면 정산용 PDF로 변환해 드립니다.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Side: Controls */}
          <div className="space-y-6">
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-500" />
                영수증 업로드
              </h2>
              
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={isProcessing}
                />
                <div className={`
                  border-2 border-dashed rounded-xl p-8 text-center transition-all
                  ${isProcessing ? 'bg-slate-50 border-slate-200' : 'bg-blue-50/30 border-blue-200 group-hover:border-blue-400 group-hover:bg-blue-50'}
                `}>
                  {isProcessing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                      <p className="text-slate-600 font-medium">AI가 영수증을 분석 중입니다...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-slate-900 font-medium">클릭하거나 이미지를 드래그하세요</p>
                        <p className="text-slate-500 text-sm mt-1">JPG, PNG 파일 지원</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {error && <p className="mt-2 text-red-500 text-sm">{error}</p>}
            </section>

            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                정보 입력
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">결제 수단</label>
                  <input
                    type="text"
                    value={data.paymentMethod}
                    onChange={(e) => setData({ ...data, paymentMethod: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="예: 법인카드 결제, 홍길동 개인카드"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">구매 용도</label>
                  <input
                    type="text"
                    value={data.purpose}
                    onChange={(e) => setData({ ...data, purpose: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="예: 사무용품 구매, 택배 발송 등"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">금액</label>
                    <input
                      type="text"
                      value={data.amount}
                      onChange={(e) => setData({ ...data, amount: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="예: 42,900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">날짜</label>
                    <input
                      type="date"
                      value={data.date}
                      onChange={(e) => setData({ ...data, date: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            <button
              onClick={handleDownload}
              disabled={!data.image}
              className={`
                w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all
                ${data.image 
                  ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-[0.98]' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'}
              `}
            >
              <Download className="w-6 h-6" />
              PDF 다운로드
            </button>
          </div>

          {/* Right Side: Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-4 py-2 flex justify-between items-center">
                <span className="text-slate-300 text-sm font-medium uppercase tracking-wider">미리보기</span>
                {data.image && (
                  <button 
                    onClick={() => setData({ ...data, image: null, amount: '', date: '', purpose: '' })}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <div className="p-8 bg-white min-h-[600px] flex flex-col items-center">
                <AnimatePresence mode="wait">
                  {data.image ? (
                    <motion.div
                      key="preview-content"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="w-full"
                    >
                      {/* This is the part that will be captured for PDF */}
                      <div ref={previewRef} className="bg-white p-4 w-full">
                        <div className="flex flex-wrap justify-center items-center gap-x-1 text-center mb-6 py-3 border-b border-slate-100 leading-relaxed">
                          <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                            {data.paymentMethod || '결제수단'}
                          </span>
                          <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                            / {data.purpose || '구매용도'}
                          </span>
                          <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                            / {data.amount ? `${data.amount}원` : '금액'}
                          </span>
                          <span className="text-sm font-medium text-slate-900 whitespace-nowrap">
                            / {formatDateDisplay(data.date) || '날짜'}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <img 
                            src={data.image} 
                            alt="Receipt" 
                            className="max-w-[85%] max-h-[55vh] object-contain shadow-sm border border-slate-100"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center h-[500px] text-slate-400"
                    >
                      <FileText className="w-16 h-16 mb-4 opacity-20" />
                      <p className="text-lg font-medium">영수증을 업로드하면</p>
                      <p>여기에 미리보기가 표시됩니다</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
