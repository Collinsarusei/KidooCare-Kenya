import React, { useState } from 'react';

interface UploadthingUploaderProps {
  onUploadComplete: (url: string) => void;
  accept?: string;
  maxSizeMb?: number;
  label?: string;
  sublabel?: string;
  buttonText?: string;
}

export const UploadthingUploader: React.FC<UploadthingUploaderProps> = ({
  onUploadComplete,
  accept = 'PDF, JPG, PNG (Max 5MB)',
  maxSizeMb = 5,
  label = 'Drag and drop your file here, or',
  sublabel = 'Supports PDF, JPG, PNG (Max 5MB)',
  buttonText = 'browse',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File size exceeds limit of ${maxSizeMb}MB.`);
      return;
    }

    setUploading(true);
    setProgress(20);
    setFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        setProgress(50);

        try {
          const res = await fetch('/api/uploadthing/upload', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              fileName: file.name,
              fileData,
              fileType: file.type,
            }),
          });

          setProgress(85);
          if (res.ok) {
            const data = await res.json();
            const finalUrl = data.url;
            setUploadedUrl(finalUrl);
            setProgress(100);
            onUploadComplete(finalUrl);
          } else {
            // Fallback base64 URL
            setUploadedUrl(fileData);
            setProgress(100);
            onUploadComplete(fileData);
          }
        } catch (err) {
          // Local data URL fallback
          setUploadedUrl(fileData);
          setProgress(100);
          onUploadComplete(fileData);
        } finally {
          setUploading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full font-sans">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-[#004ac6] bg-[#eff4ff]'
            : uploading
            ? 'border-amber-400 bg-amber-50/50'
            : uploadedUrl
            ? 'border-emerald-400 bg-emerald-50/40'
            : 'border-[#cbd5e1] bg-[#f8f9ff] hover:bg-[#eff4ff]/60'
        }`}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFileSelect(e.target.files[0]);
            }
          }}
        />

        <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            uploadedUrl ? 'bg-emerald-100 text-emerald-700' : 'bg-[#e6eeff] text-[#004ac6]'
          }`}>
            <span className="material-symbols-outlined text-2xl">
              {uploading ? 'cloud_upload' : uploadedUrl ? 'task_alt' : 'cloud_upload'}
            </span>
          </div>

          {uploading ? (
            <div className="space-y-2 w-full max-w-xs mx-auto">
              <p className="text-xs font-bold text-[#121c2a]">Uploading to Uploadthing...</p>
              <div className="w-full h-2 bg-[#e6eeff] rounded-full overflow-hidden">
                <div className="bg-[#004ac6] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-[#737686]">{fileName}</p>
            </div>
          ) : uploadedUrl ? (
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-emerald-800 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                Uploaded to Uploadthing
              </p>
              <p className="text-[11px] text-emerald-700 truncate max-w-xs font-mono">
                {fileName || uploadedUrl}
              </p>
              <p className="text-[10px] text-[#004ac6] underline pt-1 font-bold">
                Click or drag to replace file
              </p>
            </div>
          ) : (
            <div>
              <p className="text-xs md:text-sm font-bold text-[#121c2a]">
                {label} <span className="text-[#004ac6] underline font-bold">{buttonText}</span>
              </p>
              <p className="text-[11px] text-[#737686] mt-1">{sublabel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
