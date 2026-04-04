import React, { useState, useCallback, useRef } from 'react';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange }) => {
  const [previews, setPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const fileArray = Array.from(files);
      onFilesChange(fileArray);
      
      // FIX: Explicitly type `file` as `File` to resolve TypeScript inference issue.
      const newPreviews = fileArray.map((file: File) => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  }, [onFilesChange]);
  
  const handleClear = () => {
      setPreviews([]);
      onFilesChange([]);
      if (fileInputRef.current) {
          fileInputRef.current.value = "";
      }
  }

  return (
    <div>
      <div className="flex items-center justify-center w-full">
        <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-8 h-8 mb-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2" />
            </svg>
            <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
            <p className="text-xs text-gray-500">PNG, JPG, or other image formats</p>
          </div>
          <input id="dropzone-file" ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
        </label>
      </div>

      {previews.length > 0 && (
        <div className="mt-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-700">업로드된 파일 ({previews.length})</h3>
              <button onClick={handleClear} className="text-sm text-red-500 hover:text-red-700 font-semibold">초기화</button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previews.map((src, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border">
                <img src={src} alt={`preview ${index}`} className="w-full h-32 object-contain bg-gray-50" />
                </div>
            ))}
            </div>
        </div>
      )}
    </div>
  );
};
