import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import snackbarReducer from '../features/snackbar/snackbarSlice';
import votingReducer from '../features/voting/votingSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    snackbar: snackbarReducer,
    voting: votingReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
