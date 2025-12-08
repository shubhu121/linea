// Veritus Search API Client
// https://discover.veritus.ai/api

interface VeritusCombinedSearchParams {
  phrases: string[];
  query: string;
  limit?: 100 | 200 | 300;
  fieldsOfStudy?: string[];
  minCitationCount?: number;
  openAccessPdf?: boolean;
  downloadable?: boolean;
  quartileRanking?: string[];
  publicationTypes?: string[];
  sort?: string;
  year?: string;
  enrich?: boolean;
}

interface VeritusJob {
  jobId: string;
  status?: 'queued' | 'success' | 'error';
  results?: VeritusPaper[];
}

interface VeritusPaper {
  abstract: string | null;
  authors: string;
  doi: string | null;
  downloadable: boolean;
  engine?: string;
  fieldsOfStudy: string[];
  id: string;
  impactFactor: {
    citationCount: number;
    influentialCitationCount: number;
    referenceCount: number;
  };
  isOpenAccess?: boolean;
  isPrePrint?: boolean;
  journalName: string | null;
  link?: string;
  pdfLink?: string;
  publicationType: string | null;
  publishedAt: string | null;
  score: number | null;
  semanticLink?: string;
  title: string;
  titleLink?: string;
  tldr: string | null;
  v_country: string | null;
  v_journal_name: string | null;
  v_publisher: string | null;
  v_quartile_ranking: string | null;
  year: number | null;
}

interface VeritusCallbackPayload {
  data: VeritusPaper[];
  event: {
    api_version: string;
    createdAt: string;
    id: string;
  };
  job: {
    id: string;
  };
}

const VERITUS_API_URL = 'https://discover.veritus.ai/api';
const VERITUS_API_KEY = process.env.VERITUS_API_KEY;

if (!VERITUS_API_KEY) {
  console.warn('VERITUS_API_KEY not configured. Using mock mode for development.');
}

// Mock search job for development when API key is not configured
export async function createMockSearchJob(params: any): Promise<VeritusJob> {
  const mockJobId = `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  console.log('Creating mock Veritus job:', mockJobId);
  
  return {
    jobId: mockJobId,
    status: 'queued',
  };
}

export async function createCombinedSearchJob(
  params: VeritusCombinedSearchParams,
  callbackUrl: string
): Promise<VeritusJob> {
  if (!VERITUS_API_KEY || VERITUS_API_KEY === 'your_veritus_api_key_here') {
    console.warn('VERITUS_API_KEY not properly configured. Cannot create real search job.');
    throw new Error('Veritus API key not configured');
  }

  try {
    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.limit) queryParams.set('limit', params.limit.toString());
    if (params.fieldsOfStudy?.length) queryParams.set('fieldsOfStudy', params.fieldsOfStudy.join(','));
    if (params.minCitationCount) queryParams.set('minCitationCount', params.minCitationCount.toString());
    if (params.openAccessPdf !== undefined) queryParams.set('openAccessPdf', params.openAccessPdf.toString());
    if (params.downloadable !== undefined) queryParams.set('downloadable', params.downloadable.toString());
    if (params.quartileRanking?.length) queryParams.set('quartileRanking', params.quartileRanking.join(','));
    if (params.publicationTypes?.length) queryParams.set('publicationTypes', params.publicationTypes.join(','));
    if (params.sort) queryParams.set('sort', params.sort);
    if (params.year) queryParams.set('year', params.year);

    const response = await fetch(
      `${VERITUS_API_URL}/v1/job/combinedSearch?${queryParams.toString()}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${VERITUS_API_KEY}`,
        },
        body: JSON.stringify({
          phrases: params.phrases,
          query: params.query,
          callbackUrl,
          enrich: params.enrich ?? false,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Veritus API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return { jobId: data.jobId };
  } catch (error) {
    console.error('Failed to create Veritus search job:', error);
    throw error;
  }
}

export async function getJobStatus(jobId: string): Promise<VeritusJob> {
  if (!VERITUS_API_KEY || VERITUS_API_KEY === 'your_veritus_api_key_here') {
    throw new Error('Veritus API key not configured');
  }

  try {
    const response = await fetch(`${VERITUS_API_URL}/v1/job/${jobId}`, {
      headers: {
        'Authorization': `Bearer ${VERITUS_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get job status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get Veritus job status:', error);
    throw error;
  }
}

export type {
  VeritusCombinedSearchParams,
  VeritusJob,
  VeritusPaper,
  VeritusCallbackPayload,
};