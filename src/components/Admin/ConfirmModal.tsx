import './ConfirmModal.css';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  isDangerous?: boolean; // Makes confirm button red/orange styling
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  isDangerous = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div className="confirm-modal-overlay" onClick={onCancel} />
      <div className="confirm-modal-container">
        <div className="confirm-modal">
          <div className="confirm-modal-header">
            <h2 className="confirm-modal-title">{title}</h2>
          </div>
          <div className="confirm-modal-body">
            <p className="confirm-modal-message">{message}</p>
          </div>
          <div className="confirm-modal-footer">
            <button
              className="confirm-modal-btn cancel-btn"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelText}
            </button>
            <button
              className={`confirm-modal-btn confirm-btn ${isDangerous ? 'dangerous' : ''}`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
