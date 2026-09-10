import type { MouseEvent } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CircleCheck, CircleAlert, Info, X } from 'lucide-react';
import type { RootState } from '../../app/store';
import { hideSnackbar, type SnackbarSeverity } from '../../features/snackbar/snackbarSlice';

const ICONS: Record<SnackbarSeverity, typeof Info> = {
  success: CircleCheck,
  error: CircleAlert,
  info: Info,
};

const COLORS: Record<SnackbarSeverity, string> = {
  success: 'bg-emerald-600',
  error: 'bg-rose-600',
  info: 'bg-indigo-600',
};

function isSnackbarSeverity(value: unknown): value is SnackbarSeverity {
  return value === 'success' || value === 'error' || value === 'info';
}

export default function Snackbar() {
  const dispatch = useDispatch();
  const { open, message, severity } = useSelector((state: RootState) => state.snackbar);

  if (!open) return null;

  const safeSeverity: SnackbarSeverity = isSnackbarSeverity(severity) ? severity : 'info';
  const Icon = ICONS[safeSeverity];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-white shadow-lg ${COLORS[safeSeverity]}`}
    >
      <Icon className="h-5 w-5" />
      <span className="text-sm">{message}</span>
      <button
        onClick={(e: MouseEvent<HTMLButtonElement>) => {
          e.preventDefault();
          dispatch(hideSnackbar());
        }}
        className="ml-2"
        aria-label="Dismiss"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
