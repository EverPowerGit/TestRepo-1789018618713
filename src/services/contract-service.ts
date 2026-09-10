import type { ContractMessage, ContractResponse, Candidate, VotingResult } from '../types';

const HotPocket = (window as any).HotPocket;

interface PendingResolver {
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
}

type MockVoteStore = {
  voterPublicKey: string;
  candidateId: number;
  createdOn: string;
};

export default class ContractService {
  private static instance: ContractService;

  private client: any = null;
  private keyPair: unknown = null;
  private connected = false;
  private mockMode = false;

  private readonly promiseMap = new Map<string, PendingResolver>();

  private readonly servers: string[] = (import.meta.env.VITE_CONTRACT_URLS ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  // Mock stores (session-scoped).
  private mockCandidates: Candidate[] = [
    {
      id: 1,
      name: 'Astra Nova',
      description: 'Community-first governance candidate focusing on transparency and inclusion.',
      voteCount: 2,
      createdOn: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      lastUpdatedOn: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    },
    {
      id: 2,
      name: 'Byte Harbor',
      description: 'Infrastructure-focused candidate prioritizing reliability and performance.',
      voteCount: 1,
      createdOn: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      lastUpdatedOn: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
  ];
  private mockVotes: MockVoteStore[] = [
    { voterPublicKey: 'mock-voter-001', candidateId: 1, createdOn: new Date().toISOString() },
    { voterPublicKey: 'mock-voter-002', candidateId: 1, createdOn: new Date().toISOString() },
    { voterPublicKey: 'mock-voter-003', candidateId: 2, createdOn: new Date().toISOString() },
  ];
  private mockNextCandidateId = 3;
  private mockNextVoteRowId = 100;

  private constructor() {}

  static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  async init(): Promise<boolean> {
    const envMock = import.meta.env.VITE_MOCK_MODE === 'true';

    // Treat missing/placeholder URLs or missing HotPocket global as a reason to run in mock mode.
    const urlsJoined = this.servers.join(',');
    const hasPlaceholderUrl = /example|your-server|placeholder/i.test(urlsJoined);
    const noUrls = this.servers.length === 0;
    const noHotPocketGlobal = !HotPocket;

    if (envMock || noUrls || hasPlaceholderUrl || noHotPocketGlobal) {
      this.mockMode = true;
      console.warn(
        '🔧 EverVote is running in MOCK MODE. Set VITE_MOCK_MODE=false and configure VITE_CONTRACT_URLS to connect to real HotPocket servers.',
      );
      return true;
    }

    if (!this.keyPair) this.keyPair = await HotPocket.generateKeys();

    if (!this.client) {
      this.client = await HotPocket.createClient(this.servers, this.keyPair);
    }

    if (!this.client || typeof this.client.connect !== 'function') {
      throw new Error(
        'Failed to initialize HotPocket client. Check VITE_CONTRACT_URLS or set VITE_MOCK_MODE=true.',
      );
    }

    this.registerEvents();

    if (!this.connected) {
      const ok = await this.client.connect();
      if (!ok) {
        throw new Error(
          'HotPocket connection failed. Verify your contract nodes are reachable over wss:// or enable VITE_MOCK_MODE=true.',
        );
      }
      this.connected = true;
    }

    return true;
  }

  private registerEvents(): void {
    this.client.on(HotPocket.events.disconnect, () => {
      this.connected = false;
      window.location.reload();
    });

    this.client.on(HotPocket.events.connectionChange, (server: string, action: string) => {
      console.log(`HotPocket ${action}: ${server}`);
    });

    this.client.on(HotPocket.events.contractOutput, (r: { outputs: unknown[] }) => {
      r.outputs.forEach((output: unknown) => {
        const parsed = this.deserialize<ContractResponse>(output);
        const pId = parsed.promiseId;
        if (!pId) return;

        const pending = this.promiseMap.get(pId);
        if (!pending) return;

        if (parsed.error) pending.reject(new Error(parsed.error));
        else pending.resolve(parsed.success);

        this.promiseMap.delete(pId);
      });
    });

    this.client.on(HotPocket.events.healthEvent, (ev: unknown) => console.log(ev));
  }

  async submitContractReadRequest<T = unknown>(message: ContractMessage): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>(message);

    const output = await this.client.submitContractReadRequest(this.serialize(message));
    const parsed = this.deserialize<ContractResponse<T>>(output);
    if (parsed.error) throw new Error(parsed.error);
    return (parsed.success ?? null) as T;
  }

  async submitInputToContract<T = unknown>(message: ContractMessage): Promise<T> {
    if (this.mockMode) return this.mockResponse<T>(message);

    const promiseId = this.getUniqueId();
    const result = new Promise<T>((resolve, reject) => {
      this.promiseMap.set(promiseId, { resolve: resolve as (value: any) => void, reject });
    });

    const input = await this.client.submitContractInput(this.serialize({ promiseId, ...message }));
    const status = await input.submissionStatus;
    if (status.status !== 'accepted') {
      this.promiseMap.delete(promiseId);
      throw new Error(`Ledger rejection: ${status.reason ?? 'Unknown reason'}`);
    }

    return result;
  }

  private serialize(payload: unknown): string {
    return JSON.stringify(payload);
  }

  private deserialize<T>(output: unknown): T {
    if (typeof output === 'string') {
      try {
        return JSON.parse(output) as T;
      } catch {
        return output as T;
      }
    }
    return output as T;
  }

  private getUniqueId(): string {
    const bytes = new Uint8Array(10);
    window.crypto.getRandomValues(bytes);
    return Array.from(bytes).join('');
  }

  private async mockResponse<T>(message: ContractMessage): Promise<T> {
    await new Promise((r) => setTimeout(r, 160));
    console.log('[MOCK] Contract call:', message);

    if (message.Service !== 'Voting') {
      throw new Error('Invalid service.');
    }

    switch (message.Action) {
      case 'GetAllCandidates': {
        const candidates = [...this.mockCandidates].map((c) => ({ ...c }));
        return candidates as unknown as T;
      }

      case 'GetResults': {
        const results: VotingResult[] = [...this.mockCandidates]
          .map((c) => ({ id: c.id, name: c.name, voteCount: c.voteCount }))
          .sort((a, b) => b.voteCount - a.voteCount);
        return results as unknown as T;
      }

      case 'AddCandidate': {
        const data = (message.data ?? {}) as { name?: string; description?: string };
        const name = (data.name ?? '').trim();
        if (!name) throw new Error('name is required.');

        const now = new Date().toISOString();
        const newCandidate: Candidate = {
          id: this.mockNextCandidateId++,
          name,
          description: data.description ?? '',
          voteCount: 0,
          createdOn: now,
          lastUpdatedOn: now,
        };
        this.mockCandidates.push(newCandidate);
        return { rowId: newCandidate.id } as unknown as T;
      }

      case 'CastVote': {
        const data = (message.data ?? {}) as { candidateId?: number; voterPublicKey?: string };
        const candidateId = data.candidateId;
        const voterPublicKey = (data.voterPublicKey ?? '').trim();

        if (!candidateId || !voterPublicKey) {
          throw new Error('candidateId and voterPublicKey are required.');
        }

        const candidate = this.mockCandidates.find((c) => c.id === candidateId);
        if (!candidate) throw new Error('Candidate not found.');

        const alreadyVoted = this.mockVotes.some((v) => v.voterPublicKey === voterPublicKey);
        if (alreadyVoted) throw new Error('This voter has already cast a vote.');

        this.mockVotes.push({
          voterPublicKey,
          candidateId,
          createdOn: new Date().toISOString(),
        });

        candidate.voteCount = (candidate.voteCount ?? 0) + 1;
        candidate.lastUpdatedOn = new Date().toISOString();

        return { rowId: this.mockNextVoteRowId++, voteCount: candidate.voteCount } as unknown as T;
      }

      default: {
        throw new Error(`Invalid action: ${message.Action}`);
      }
    }
  }
}
