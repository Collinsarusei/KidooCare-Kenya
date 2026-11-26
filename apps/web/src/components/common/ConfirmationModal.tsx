import React from 'react';

interface ConfirmationModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  isDestructive = false,
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 text-[#0b2a3c]">
            <span className={`material-symbols-outlined text-3xl ${isDestructive ? 'text-red-500' : 'text-[#0b6e99]'}`}>
              {isDestructive ? 'warning' : 'help'}
            </span>
            <h2 className="text-xl font-extrabold font-display">{title}</h2>
          </div>
          <p className="text-sm text-[#434655] leading-relaxed">
            {message}
          </p>
        </div>
        <div className="bg-[#f3fafd] p-4 border-t border-[#dcf0f8] flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="btn bg-white text-[#737686] border border-[#dcf0f8] px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-[#f1f3f9] transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`btn px-5 py-2.5 rounded-xl font-bold shadow-md transition-all text-white ${
              isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-[#0b6e99] hover:bg-[#085a7e]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
