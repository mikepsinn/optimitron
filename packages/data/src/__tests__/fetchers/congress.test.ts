import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getCongressApiKey,
  buildCongressUrl,
  fetchCongressJson,
  parseMemberListItem,
  parseMemberDetail,
  parseBillListItem,
  parseBillDetail,
  fetchMembers,
  fetchMemberDetails,
  fetchBills,
  fetchBillDetail,
  fetchBillSubjects,
  fetchBillVotes,
  fetchRollCallVote,
} from '../../fetchers/congress.js';
import type {
  RawMemberListItem,
  RawMemberDetail,
  RawBillListItem,
  RawBillDetail,
} from '../../fetchers/congress.js';

// ─── Mock data ──────────────────────────────────────────────────────

const mockMemberListItem: RawMemberListItem = {
  bioguideId: 'S000033',
  name: 'Sanders, Bernard',
  partyName: 'Independent',
  state: 'Vermont',
  terms: {
    item: [
      { chamber: 'House of Representatives', startYear: 1991, endYear: 1993 },
      { chamber: 'Senate', startYear: 2007, endYear: 2013 },
      { chamber: 'Senate', startYear: 2013, endYear: 2019 },
    ],
  },
};

const mockMemberListItem2: RawMemberListItem = {
  bioguideId: 'P000197',
  name: 'Pelosi, Nancy',
  partyName: 'Democratic',
  state: 'California',
  district: 11,
  terms: {
    item: [
      { chamber: 'House of Representatives', startYear: 1987, endYear: 2023 },
    ],
  },
};

const mockMemberDetail: RawMemberDetail = {
  bioguideId: 'S000033',
  directOrderName: 'Bernard Sanders',
  invertedOrderName: 'Sanders, Bernard',
  firstName: 'Bernard',
  lastName: 'Sanders',
  party: 'Independent',
  state: 'Vermont',
  currentMember: true,
  terms: [
    {
      memberType: 'Representative',
      congress: 102,
      chamber: 'House of Representatives',
      stateCode: 'VT',
      stateName: 'Vermont',
      startYear: 1991,
      endYear: 1993,
      partyName: 'Independent',
      partyCode: 'I',
    },
    {
      memberType: 'Senator',
      congress: 110,
      chamber: 'Senate',
      stateCode: 'VT',
      stateName: 'Vermont',
      startYear: 2007,
      endYear: 2013,
      partyName: 'Independent',
      partyCode: 'I',
    },
  ],
};

const mockBillListItem: RawBillListItem = {
  congress: 118,
  type: 'HR',
  number: 3076,
  title: 'Postal Service Reform Act of 2022',
  latestAction: {
    actionDate: '2022-04-06',
    text: 'Became Public Law No: 117-108.',
  },
  url: 'https://api.congress.gov/v3/bill/118/hr/3076',
};

const mockBillDetail: RawBillDetail = {
  congress: 118,
  type: 'HR',
  number: 3076,
  title: 'Postal Service Reform Act of 2022',
  policyArea: { name: 'Government Operations and Politics' },
  subjects: {
    legislativeSubjects: [
      { name: 'Postal service' },
      { name: 'Government employee pay' },
    ],
  },
  latestAction: {
    actionDate: '2022-04-06',
    text: 'Became Public Law No: 117-108.',
  },
};

const mockMembersListResponse = {
  members: [mockMemberListItem, mockMemberListItem2],
  pagination: { count: 2 },
};

const mockBillsListResponse = {
  bills: [mockBillListItem],
  pagination: { count: 1 },
};

const mockMemberDetailResponse = {
  member: mockMemberDetail,
};

const mockBillDetailResponse = {
  bill: mockBillDetail,
};

const mockSubjectsResponse = {
  subjects: {
    legislativeSubjects: [
      { name: 'Postal service' },
      { name: 'Government employee pay' },
    ],
    policyArea: { name: 'Government Operations and Politics' },
  },
};

const mockActionsResponse = {
  actions: [
    {
      type: 'Floor',
      recordedVotes: [
        {
          rollNumber: 42,
          chamber: 'House',
          congress: 118,
          date: '2022-02-08',
          question: 'On Passage',
          result: 'Passed',
          sessionNumber: 2,
          url: 'https://clerk.house.gov/evs/2022/roll042.xml',
        },
      ],
    },
    {
      type: 'IntroReferral',
      // no recordedVotes
    },
  ],
};

const mockRollCallResponse = {
  rollcallVote: {
    rollCallNumber: 42,
    congress: 118,
    chamber: 'House',
    session: 1,
    date: '2023-01-10',
    question: 'On Passage',
    result: 'Passed',
    members: [
      { bioguideId: 'S000033', votePosition: 'Yea' },
      { bioguideId: 'P000197', votePosition: 'Yea' },
      { bioguideId: 'M000303', votePosition: 'Nay' },
    ],
  },
};

// ─── Tests ──────────────────────────────────────────────────────────

describe('Congress Fetcher', () => {
  const originalFetch = globalThis.fetch;
  const originalEnv = process.env['CONGRESS_API_KEY'];

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env['CONGRESS_API_KEY'] = 'test-congress-key';
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnv !== undefined) {
      process.env['CONGRESS_API_KEY'] = originalEnv;
    } else {
      delete process.env['CONGRESS_API_KEY'];
    }
  });

  // ─── API Key ────────────────────────────────────────────────────

  describe('getCongressApiKey', () => {
    it('returns the API key from env', () => {
      process.env['CONGRESS_API_KEY'] = 'my-key';
      expect(getCongressApiKey()).toBe('my-key');
    });

    it('returns null when not set', () => {
      delete process.env['CONGRESS_API_KEY'];
      expect(getCongressApiKey()).toBeNull();
    });
  });

  // ─── URL Builder ──────────────────────────────────────────────────

  describe('buildCongressUrl', () => {
    it('builds URL with API key and format=json', () => {
      process.env['CONGRESS_API_KEY'] = 'test-key';
      const url = buildCongressUrl('/member', { limit: '10' });
      expect(url).toContain('https://api.congress.gov/v3/member?');
      expect(url).toContain('format=json');
      expect(url).toContain('limit=10');
      expect(url).toContain('api_key=test-key');
    });

    it('omits API key when not set', () => {
      delete process.env['CONGRESS_API_KEY'];
      const url = buildCongressUrl('/member');
      expect(url).toContain('format=json');
      expect(url).not.toContain('api_key');
    });
  });

  // ─── fetchCongressJson ────────────────────────────────────────────

  describe('fetchCongressJson', () => {
    it('returns parsed JSON on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ members: [] }),
      });

      const result = await fetchCongressJson<{ members: unknown[] }>('https://example.com');
      expect(result).toEqual({ members: [] });
    });

    it('returns null on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const result = await fetchCongressJson('https://example.com');
      expect(result).toBeNull();
    });

    it('returns null on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      const result = await fetchCongressJson('https://example.com');
      expect(result).toBeNull();
    });
  });

  // ─── Parsers ──────────────────────────────────────────────────────

  describe('parseMemberListItem', () => {
    it('parses a member list item correctly', () => {
      const member = parseMemberListItem(mockMemberListItem);
      expect(member.bioguideId).toBe('S000033');
      expect(member.name).toBe('Sanders, Bernard');
      expect(member.party).toBe('Independent');
      expect(member.state).toBe('Vermont');
      expect(member.chamber).toBe('Senate');
      expect(member.terms).toHaveLength(3);
    });

    it('uses latest term chamber', () => {
      const member = parseMemberListItem(mockMemberListItem2);
      expect(member.chamber).toBe('House of Representatives');
      expect(member.district).toBe(11);
    });

    it('handles empty terms', () => {
      const raw: RawMemberListItem = {
        ...mockMemberListItem,
        terms: { item: [] },
      };
      const member = parseMemberListItem(raw);
      expect(member.chamber).toBe('Unknown');
      expect(member.terms).toHaveLength(0);
    });
  });

  describe('parseMemberDetail', () => {
    it('parses a member detail correctly', () => {
      const member = parseMemberDetail(mockMemberDetail);
      expect(member.bioguideId).toBe('S000033');
      expect(member.name).toBe('Bernard Sanders');
      expect(member.party).toBe('Independent');
      expect(member.state).toBe('Vermont');
      expect(member.chamber).toBe('Senate');
      expect(member.terms).toHaveLength(2);
      expect(member.terms[0]?.congress).toBe(102);
      expect(member.terms[0]?.stateCode).toBe('VT');
    });

    it('falls back to invertedOrderName if directOrderName missing', () => {
      const raw: RawMemberDetail = {
        ...mockMemberDetail,
        directOrderName: undefined,
      };
      const member = parseMemberDetail(raw);
      expect(member.name).toBe('Sanders, Bernard');
    });

    it('falls back to firstName+lastName if both order names missing', () => {
      const raw: RawMemberDetail = {
        ...mockMemberDetail,
        directOrderName: undefined,
        invertedOrderName: undefined,
      };
      const member = parseMemberDetail(raw);
      expect(member.name).toBe('Bernard Sanders');
    });

    it('handles empty terms array', () => {
      const raw: RawMemberDetail = {
        ...mockMemberDetail,
        terms: [],
      };
      const member = parseMemberDetail(raw);
      expect(member.chamber).toBe('Unknown');
      expect(member.terms).toHaveLength(0);
    });
  });

  describe('parseBillListItem', () => {
    it('parses a bill list item correctly', () => {
      const bill = parseBillListItem(mockBillListItem);
      expect(bill.billId).toBe('118-hr-3076');
      expect(bill.title).toBe('Postal Service Reform Act of 2022');
      expect(bill.congress).toBe(118);
      expect(bill.type).toBe('HR');
      expect(bill.number).toBe(3076);
      expect(bill.subjects).toEqual([]);
      expect(bill.policyArea).toBeNull();
      expect(bill.latestAction).toEqual({
        date: '2022-04-06',
        text: 'Became Public Law No: 117-108.',
      });
    });

    it('handles missing latestAction', () => {
      const raw: RawBillListItem = {
        ...mockBillListItem,
        latestAction: undefined,
      };
      const bill = parseBillListItem(raw);
      expect(bill.latestAction).toBeNull();
    });
  });

  describe('parseBillDetail', () => {
    it('parses a bill detail with subjects and policy area', () => {
      const bill = parseBillDetail(mockBillDetail);
      expect(bill.billId).toBe('118-hr-3076');
      expect(bill.subjects).toEqual(['Postal service', 'Government employee pay']);
      expect(bill.policyArea).toBe('Government Operations and Politics');
    });

    it('handles missing subjects and policyArea', () => {
      const raw: RawBillDetail = {
        ...mockBillDetail,
        subjects: undefined,
        policyArea: undefined,
      };
      const bill = parseBillDetail(raw);
      expect(bill.subjects).toEqual([]);
      expect(bill.policyArea).toBeNull();
    });
  });

  // ─── Fetch functions ──────────────────────────────────────────────

  describe('fetchMembers', () => {
    it('returns parsed members on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMembersListResponse),
      });

      const members = await fetchMembers(118);
      expect(members).toHaveLength(2);
      expect(members[0]?.bioguideId).toBe('S000033');
      expect(members[1]?.bioguideId).toBe('P000197');
    });

    it('filters by chamber when specified', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMembersListResponse),
      });

      const senators = await fetchMembers(118, 'senate');
      expect(senators).toHaveLength(1);
      expect(senators[0]?.chamber).toBe('Senate');
    });

    it('filters for house members', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMembersListResponse),
      });

      const reps = await fetchMembers(118, 'house');
      expect(reps).toHaveLength(1);
      expect(reps[0]?.chamber).toBe('House of Representatives');
    });

    it('returns empty array on failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const members = await fetchMembers(118);
      expect(members).toEqual([]);
    });

    it('returns empty array on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network failure'));

      const members = await fetchMembers(118);
      expect(members).toEqual([]);
    });

    it('includes API key in request URL', async () => {
      process.env['CONGRESS_API_KEY'] = 'test-key-abc';
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMembersListResponse),
      });

      await fetchMembers(118);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('api_key=test-key-abc');
      expect(callUrl).toContain('/member/congress/118');
    });

    it('defaults to current congress when not specified', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMembersListResponse),
      });

      await fetchMembers();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/member/congress/119');
    });
  });

  describe('fetchMemberDetails', () => {
    it('returns parsed member details on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMemberDetailResponse),
      });

      const member = await fetchMemberDetails('S000033');
      expect(member).not.toBeNull();
      expect(member?.bioguideId).toBe('S000033');
      expect(member?.name).toBe('Bernard Sanders');
      expect(member?.terms).toHaveLength(2);
    });

    it('builds correct URL', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMemberDetailResponse),
      });

      await fetchMemberDetails('S000033');
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/member/S000033');
    });

    it('returns null on failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const member = await fetchMemberDetails('INVALID');
      expect(member).toBeNull();
    });

    it('returns null on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('timeout'));

      const member = await fetchMemberDetails('S000033');
      expect(member).toBeNull();
    });
  });

  describe('fetchBills', () => {
    it('returns parsed bills on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBillsListResponse),
      });

      const bills = await fetchBills(118);
      expect(bills).toHaveLength(1);
      expect(bills[0]?.billId).toBe('118-hr-3076');
      expect(bills[0]?.title).toBe('Postal Service Reform Act of 2022');
    });

    it('builds correct URL with congress number', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBillsListResponse),
      });

      await fetchBills(117, undefined, 50);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/bill/117');
      expect(callUrl).toContain('limit=50');
    });

    it('defaults to current congress', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBillsListResponse),
      });

      await fetchBills();
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/bill/119');
    });

    it('returns empty array on failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const bills = await fetchBills(118);
      expect(bills).toEqual([]);
    });
  });

  describe('fetchBillDetail', () => {
    it('returns parsed bill detail on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBillDetailResponse),
      });

      const bill = await fetchBillDetail('hr', 3076, 118);
      expect(bill).not.toBeNull();
      expect(bill?.subjects).toEqual(['Postal service', 'Government employee pay']);
      expect(bill?.policyArea).toBe('Government Operations and Politics');
    });

    it('builds correct URL', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockBillDetailResponse),
      });

      await fetchBillDetail('HR', 3076, 118);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/bill/118/hr/3076');
    });

    it('returns null on failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const bill = await fetchBillDetail('hr', 99999, 118);
      expect(bill).toBeNull();
    });
  });

  describe('fetchBillSubjects', () => {
    it('returns subjects and policy area on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubjectsResponse),
      });

      const result = await fetchBillSubjects('hr', 3076, 118);
      expect(result.subjects).toEqual(['Postal service', 'Government employee pay']);
      expect(result.policyArea).toBe('Government Operations and Politics');
    });

    it('builds correct URL', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubjectsResponse),
      });

      await fetchBillSubjects('HR', 3076, 118);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/bill/118/hr/3076/subjects');
    });

    it('returns empty subjects on failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      const result = await fetchBillSubjects('hr', 3076, 118);
      expect(result.subjects).toEqual([]);
      expect(result.policyArea).toBeNull();
    });

    it('handles missing policyArea', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            subjects: {
              legislativeSubjects: [{ name: 'Test' }],
            },
          }),
      });

      const result = await fetchBillSubjects('hr', 1, 118);
      expect(result.subjects).toEqual(['Test']);
      expect(result.policyArea).toBeNull();
    });
  });

  describe('fetchBillVotes', () => {
    it('extracts recorded votes from actions', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockActionsResponse),
      });

      const votes = await fetchBillVotes('hr', 3076, 118);
      expect(votes).toHaveLength(1);
      expect(votes[0]?.rollNumber).toBe(42);
      expect(votes[0]?.chamber).toBe('House');
    });

    it('builds correct URL', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockActionsResponse),
      });

      await fetchBillVotes('HR', 3076, 118);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/bill/118/hr/3076/actions');
    });

    it('returns empty array when no recorded votes', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            actions: [{ type: 'IntroReferral' }],
          }),
      });

      const votes = await fetchBillVotes('hr', 1, 118);
      expect(votes).toEqual([]);
    });

    it('returns empty array on failure', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      const votes = await fetchBillVotes('hr', 99999, 118);
      expect(votes).toEqual([]);
    });
  });

  describe('fetchRollCallVote', () => {
    it('returns parsed vote with member positions on success', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRollCallResponse),
      });

      const vote = await fetchRollCallVote(118, 'house', 1, 42);
      expect(vote).not.toBeNull();
      expect(vote?.rollCallNumber).toBe(42);
      expect(vote?.congress).toBe(118);
      expect(vote?.question).toBe('On Passage');
      expect(vote?.result).toBe('Passed');
      expect(vote?.memberVotes).toHaveLength(3);
      expect(vote?.memberVotes).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ bioguideId: 'S000033', position: 'Yea' }),
          expect.objectContaining({ bioguideId: 'P000197', position: 'Yea' }),
          expect.objectContaining({ bioguideId: 'M000303', position: 'Nay' }),
        ]),
      );
    });

    it('builds correct URL', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockRollCallResponse),
      });

      await fetchRollCallVote(118, 'house', 1, 42);
      const callUrl = (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('/rollcall/house/118/1/42');
    });

    it('falls back to house-vote endpoint', async () => {
      const fetchMock = vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}), // first endpoint returns empty
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              'house-vote': {
                rollCallNumber: 42,
                congress: 118,
                chamber: 'House',
                session: 1,
                date: '2023-01-10',
                question: 'On Passage',
                result: 'Passed',
                members: [
                  { bioguideId: 'S000033', votePosition: 'Yea' },
                ],
              },
            }),
        });

      globalThis.fetch = fetchMock;

      const vote = await fetchRollCallVote(118, 'house', 1, 42);
      expect(vote).not.toBeNull();
      expect(vote?.rollCallNumber).toBe(42);
      expect(vote?.memberVotes).toHaveLength(1);
      expect(fetchMock).toHaveBeenCalledTimes(2);

      const secondUrl = fetchMock.mock.calls[1]?.[0] as string;
      expect(secondUrl).toContain('/house-vote/118/1/42');
    });

    it('returns null when both endpoints fail', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({}),
      });

      const vote = await fetchRollCallVote(118, 'house', 1, 9999);
      expect(vote).toBeNull();
    });

    it('returns null on HTTP error', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      const vote = await fetchRollCallVote(118, 'house', 1, 42);
      expect(vote).toBeNull();
    });

    it('returns null on network error', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const vote = await fetchRollCallVote(118, 'house', 1, 42);
      expect(vote).toBeNull();
    });

    it('filters members with missing bioguideId or votePosition', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            rollcallVote: {
              ...mockRollCallResponse.rollcallVote,
              members: [
                { bioguideId: 'S000033', votePosition: 'Yea' },
                { bioguideId: '', votePosition: 'Nay' },
                { bioguideId: 'P000197', votePosition: undefined },
                { bioguideId: 'M000303', votePosition: 'Nay' },
              ],
            },
          }),
      });

      const vote = await fetchRollCallVote(118, 'house', 1, 42);
      expect(vote?.memberVotes).toHaveLength(2);
      expect(vote?.memberVotes[0]?.bioguideId).toBe('S000033');
      expect(vote?.memberVotes[1]?.bioguideId).toBe('M000303');
    });
  });

  // ─── Graceful degradation ─────────────────────────────────────────

  describe('graceful degradation without API key', () => {
    it('still builds valid URLs without API key', () => {
      delete process.env['CONGRESS_API_KEY'];
      const url = buildCongressUrl('/member/congress/118');
      expect(url).toContain('format=json');
      expect(url).not.toContain('api_key');
    });

    it('fetchMembers works without API key', async () => {
      delete process.env['CONGRESS_API_KEY'];
      globalThis.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockMembersListResponse),
      });

      const members = await fetchMembers(118);
      expect(members).toHaveLength(2);
    });
  });
});
