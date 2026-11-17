import React, { useState } from 'react';

export interface UploadedFileMeta {
  name: string;
  size: number;
  type: string;
}

interface UploadthingUploaderProps {
  onUploadComplete: (url: string, meta?: UploadedFileMeta) => void;
  /** Bump this value to clear the uploader after the parent form is submitted */
  resetKey?: number;
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
  resetKey,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  React.useEffect(() => {
    setUploadedUrl(null);
    setFileName(null);
    setProgress(0);
    setErrorMsg(null);
  }, [resetKey]);

  const handleFileSelect = async (file: File) => {
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      alert(`File size exceeds limit of ${maxSizeMb}MB.`);
      return;
    }

    const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (file.type && !allowed.includes(file.type)) {
      setErrorMsg('Only PDF, JPG, PNG, WEBP or GIF files are allowed.');
      return;
    }

    setErrorMsg(null);
    setUploadedUrl(null);
    setUploading(true);
    setProgress(20);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onerror = () => {
      setUploading(false);
      setProgress(0);
      setErrorMsg('Could not read the selected file.');
    };
    reader.onload = async (e) => {
      const fileData = e.target?.result as string;
      setProgress(50);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/uploadthing/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ fileName: file.name, fileData, fileType: file.type }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.url) {
          throw new Error(
            (Array.isArray(data.message) ? data.message.join(', ') : data.message) ||
              `Upload failed (HTTP ${res.status})`,
          );
        }
        setProgress(100);
        setUploadedUrl(data.url);
        onUploadComplete(data.url, { name: file.name, size: file.size, type: file.type });
      } catch (err: any) {
        setProgress(0);
        setFileName(null);
        setErrorMsg(err.message || 'Upload failed. Is the API server running?');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
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
              <p className="text-xs font-bold text-[#121c2a]">Uploading file...</p>
              <div className="w-full h-2 bg-[#e6eeff] rounded-full overflow-hidden">
                <div className="bg-[#004ac6] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-[#737686]">{fileName}</p>
            </div>
          ) : uploadedUrl ? (
            <div className="space-y-1">
              <p className="text-xs font-extrabold text-emerald-800 flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-sm">verified</span>
                File uploaded
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
      {errorMsg && (
        <p className="mt-2 text-xs font-bold text-[#ba1a1a] flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">error</span>
          {errorMsg}
        </p>
      )}
    </div>
  );
};
