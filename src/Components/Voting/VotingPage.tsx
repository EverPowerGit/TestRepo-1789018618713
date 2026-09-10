import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  BarChart3,
  Plus,
  RefreshCw,
  Users,
  Vote as VoteIcon,
  Trophy,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import ApiService from '../../services/api-service';
import StorageService from '../../services/storage-service';
import Loading from '../Shared/Loading';
import { showSnackbar } from '../../features/snackbar/snackbarSlice';
import { setCandidates, setResults } from '../../features/voting/votingSlice';
import type { RootState } from '../../app/store';
import type { AddCandidateInput, Candidate, VotingResult } from '../../types';

type TabKey = 'candidates' | 'results';

const STORAGE_KEYS = {
  voterPublicKey: 'evervote:voterPublicKey',
};

export default function VotingPage() {
  const dispatch = useDispatch();
  const candidates = useSelector((s: RootState) => s.voting.candidates);
  const results = useSelector((s: RootState) => s.voting.results);

  const [tab, setTab] = useState<TabKey>('candidates');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submittingCandidate, setSubmittingCandidate] = useState(false);
  const [submittingVoteFor, setSubmittingVoteFor] = useState<number | null>(null);

  const [voterPublicKey, setVoterPublicKey] = useState<string>(
    StorageService.get<string>(STORAGE_KEYS.voterPublicKey) ?? '',
  );

  const [candidateForm, setCandidateForm] = useState<AddCandidateInput>({
    name: '',
    description: '',
  });

  const stats = useMemo(() => {
    const total = (candidates ?? []).length;
    const totalVotes = (candidates ?? []).reduce((sum: number, c: Candidate) => sum + (c.voteCount ?? 0), 0);
    const leader = [...(results ?? [])].sort((a, b) => b.voteCount - a.voteCount)[0] ?? null;

    return { total, totalVotes, leader };
  }, [candidates, results]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [cands, res] = await Promise.all([
        ApiService.getInstance().getAllCandidates(),
        ApiService.getInstance().getResults(),
      ]);

      dispatch(setCandidates(cands ?? []));
      dispatch(setResults(res ?? []));
    } catch (err) {
      dispatch(
        showSnackbar({
          message: err instanceof Error ? err.message : 'Failed to load voting data',
          severity: 'error',
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    setRefreshing(true);
    try {
      const [cands, res] = await Promise.all([
        ApiService.getInstance().getAllCandidates(),
        ApiService.getInstance().getResults(),
      ]);
      dispatch(setCandidates(cands ?? []));
      dispatch(setResults(res ?? []));
    } catch (err) {
      dispatch(
        showSnackbar({
          message: err instanceof Error ? err.message : 'Refresh failed',
          severity: 'error',
        }),
      );
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveVoterKey = (value: string) => {
    setVoterPublicKey(value);
    StorageService.set<string>(STORAGE_KEYS.voterPublicKey, value);
  };

  const handleAddCandidate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const name = (candidateForm.name ?? '').trim();
    if (!name) {
      dispatch(showSnackbar({ message: 'Candidate name is required.', severity: 'error' }));
      return;
    }

    setSubmittingCandidate(true);
    try {
      await ApiService.getInstance().addCandidate({
        name,
        description: (candidateForm.description ?? '').trim() || undefined,
      });

      dispatch(showSnackbar({ message: 'Candidate added successfully.', severity: 'success' }));
      setCandidateForm({ name: '', description: '' });
      await refresh();
    } catch (err) {
      dispatch(
        showSnackbar({
          message: err instanceof Error ? err.message : 'Failed to add candidate',
          severity: 'error',
        }),
      );
    } finally {
      setSubmittingCandidate(false);
    }
  };

  const handleCastVote = async (candidateId: number) => {
    const key = (voterPublicKey ?? '').trim();
    if (!key) {
      dispatch(showSnackbar({ message: 'Voter Public Key is required to vote.', severity: 'error' }));
      return;
    }

    setSubmittingVoteFor(candidateId);
    try {
      await ApiService.getInstance().castVote({ candidateId, voterPublicKey: key });
      dispatch(showSnackbar({ message: 'Vote cast successfully.', severity: 'success' }));
      await refresh();
    } catch (err) {
      dispatch(
        showSnackbar({
          message: err instanceof Error ? err.message : 'Failed to cast vote',
          severity: 'error',
        }),
      );
    } finally {
      setSubmittingVoteFor(null);
    }
  };

  if (loading) return <Loading text="Loading EverVote..." />;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Hero */}
      <div className="mb-8 overflow-hidden rounded-3xl border border-indigo-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-8 text-white md:px-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">EverVote</h1>
              <p className="mt-1 text-sm text-white/80">
                Add candidates, cast one vote per voter public key, and view results—powered by a HotPocket smart contract.
              </p>
            </div>

            <button
              type="button"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                e.preventDefault();
                void refresh();
              }}
              className="inline-flex items-center gap-2 self-start rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/15 active:scale-95 md:self-auto"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-3 md:p-10">
          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Candidates</span>
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-700">
              <VoteIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Total Votes</span>
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{stats.totalVotes}</div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
            <div className="flex items-center gap-2 text-gray-700">
              <Trophy className="h-4 w-4" />
              <span className="text-sm font-medium">Leader</span>
            </div>
            <div className="mt-2 text-lg font-semibold text-gray-900">
              {stats.leader ? `${stats.leader.name} (${stats.leader.voteCount})` : '—'}
            </div>
            <div className="mt-1 text-xs text-gray-500">From GetResults (sorted by votes)</div>
          </div>
        </div>
      </div>

      {/* Voter key */}
      <div className="mb-8 rounded-2xl border border-indigo-100 bg-white p-6 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-indigo-600" />
          <h2 className="text-sm font-semibold text-gray-900">Voter Identity</h2>
        </div>
        <p className="mb-4 text-sm text-gray-600">
          The contract enforces a single vote per <span className="font-medium">VoterPublicKey</span>.
          Enter a stable identifier (e.g., your wallet/public key) and it will be saved locally in this browser.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            value={voterPublicKey}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => saveVoterKey(e.target.value)}
            placeholder="Enter your voter public key"
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          />
          <button
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              dispatch(showSnackbar({ message: 'Voter key saved in this browser.', severity: 'success' }));
            }}
            className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-95"
          >
            Save
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            setTab('candidates');
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 ${
            tab === 'candidates' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-indigo-50'
          }`}
        >
          <Users className="h-4 w-4" />
          Candidates
        </button>

        <button
          type="button"
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            setTab('results');
          }}
          className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition active:scale-95 ${
            tab === 'results' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-indigo-50'
          }`}
        >
          <BarChart3 className="h-4 w-4" />
          Results
        </button>
      </div>

      {/* Content */}
      {tab === 'candidates' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Add candidate */}
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-600" />
              <h2 className="text-base font-semibold text-gray-900">Add Candidate</h2>
            </div>

            <form onSubmit={handleAddCandidate} className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Name <span className="text-rose-500">*</span>
                </label>
                <input
                  value={candidateForm.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setCandidateForm({ ...candidateForm, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="Candidate name"
                  required
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={candidateForm.description ?? ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setCandidateForm({ ...candidateForm, description: e.target.value })
                  }
                  rows={4}
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  placeholder="What does this candidate stand for?"
                />
              </div>

              <button
                type="submit"
                disabled={submittingCandidate || !(candidateForm.name ?? '').trim()}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                {submittingCandidate ? 'Adding...' : 'Add Candidate'}
              </button>
            </form>
          </div>

          {/* Candidate list */}
          <div className="lg:col-span-2">
            {(candidates ?? []).length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
                <Users className="mx-auto mb-3 h-8 w-8 text-gray-400" />
                <div className="text-lg font-semibold text-gray-900">No candidates yet</div>
                <div className="mt-1 text-sm text-gray-600">Add the first candidate to start voting.</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {(candidates ?? []).map((c: Candidate) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-lg font-semibold text-gray-900">{c.name}</div>
                        <div className="mt-1 text-sm text-gray-600">{c.description || '—'}</div>
                      </div>
                      <div className="rounded-xl bg-indigo-50 px-3 py-2 text-center">
                        <div className="text-xs font-medium text-indigo-700">Votes</div>
                        <div className="text-xl font-bold text-indigo-700">{c.voteCount ?? 0}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                          e.preventDefault();
                          void handleCastVote(c.id);
                        }}
                        disabled={submittingVoteFor !== null}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 active:scale-95"
                      >
                        <VoteIcon className={`h-4 w-4 ${submittingVoteFor === c.id ? 'animate-pulse' : ''}`} />
                        {submittingVoteFor === c.id ? 'Casting Vote...' : 'Vote'}
                      </button>

                      <div className="text-xs text-gray-500">
                        {c.createdOn ? `Created: ${new Date(c.createdOn).toLocaleString()}` : ''}
                        {c.lastUpdatedOn ? ` • Updated: ${new Date(c.lastUpdatedOn).toLocaleString()}` : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Leaderboard</h2>
              <p className="text-sm text-gray-600">Sorted by vote count (descending) from GetResults.</p>
            </div>
          </div>

          {(results ?? []).length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-10 text-center">
              <BarChart3 className="mx-auto mb-3 h-8 w-8 text-gray-400" />
              <div className="text-lg font-semibold text-gray-900">No results yet</div>
              <div className="mt-1 text-sm text-gray-600">Add candidates and cast votes to see results.</div>
            </div>
          ) : (
            <div className="space-y-3">
              {(results ?? []).map((r: VotingResult, idx: number) => {
                const isLeader = idx === 0;
                return (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between gap-4 rounded-2xl border p-4 transition ${
                      isLeader ? 'border-amber-200 bg-amber-50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                          isLeader ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold text-gray-900">{r.name}</div>
                          {isLeader && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                              <Trophy className="h-3 w-3" />
                              Leading
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">Candidate ID: {r.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs font-medium text-gray-500">Votes</div>
                        <div className="text-xl font-bold text-gray-900">{r.voteCount ?? 0}</div>
                      </div>
                      {isLeader && <CheckCircle2 className="h-5 w-5 text-emerald-600" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
