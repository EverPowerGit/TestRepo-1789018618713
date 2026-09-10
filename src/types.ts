// Contract wire types.
export interface ContractMessage {
  Service: string;
  Action: string;
  data?: unknown;
}

export interface ContractResponse<T = unknown> {
  success?: T;
  error?: string;
  promiseId?: string;
}

// ---------------------------
// Voting domain (mirrors backend exactly)
// ---------------------------

export interface Candidate {
  id: number;
  name: string;
  description: string;
  voteCount: number;
  createdOn?: string;
  lastUpdatedOn?: string;
}

export interface VotingResult {
  id: number;
  name: string;
  voteCount: number;
}

export interface AddCandidateInput {
  name: string;
  description?: string;
}

export interface AddCandidateSuccess {
  rowId: number;
}

export interface CastVoteInput {
  candidateId: number;
  voterPublicKey: string;
}

export interface CastVoteSuccess {
  rowId: number;
  voteCount: number;
}
