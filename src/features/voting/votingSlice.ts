import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Candidate, VotingResult } from '../../types';

export interface VotingState {
  candidates: Candidate[];
  results: VotingResult[];
}

const initialState: VotingState = {
  candidates: [],
  results: [],
};

const votingSlice = createSlice({
  name: 'voting',
  initialState,
  reducers: {
    setCandidates(state: VotingState, action: PayloadAction<Candidate[]>) {
      state.candidates = action.payload;
    },
    setResults(state: VotingState, action: PayloadAction<VotingResult[]>) {
      state.results = action.payload;
    },
  },
});

export const { setCandidates, setResults } = votingSlice.actions;
export default votingSlice.reducer;
