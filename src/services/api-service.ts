import ContractService from './contract-service';
import type {
  AddCandidateInput,
  AddCandidateSuccess,
  Candidate,
  CastVoteInput,
  CastVoteSuccess,
  VotingResult,
} from '../types';

export default class ApiService {
  private static instance: ApiService;
  private readonly contract: ContractService;

  private constructor() {
    this.contract = ContractService.getInstance();
  }

  static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  // --- READ ---
  async getAllCandidates(): Promise<Candidate[]> {
    const res = await this.contract.submitContractReadRequest<Candidate[]>({
      Service: 'Voting',
      Action: 'GetAllCandidates',
    });
    return res ?? [];
  }

  async getResults(): Promise<VotingResult[]> {
    const res = await this.contract.submitContractReadRequest<VotingResult[]>({
      Service: 'Voting',
      Action: 'GetResults',
    });
    return res ?? [];
  }

  // --- WRITE ---
  async addCandidate(input: AddCandidateInput): Promise<AddCandidateSuccess> {
    return this.contract.submitInputToContract<AddCandidateSuccess>({
      Service: 'Voting',
      Action: 'AddCandidate',
      data: input,
    });
  }

  async castVote(input: CastVoteInput): Promise<CastVoteSuccess> {
    return this.contract.submitInputToContract<CastVoteSuccess>({
      Service: 'Voting',
      Action: 'CastVote',
      data: input,
    });
  }
}
