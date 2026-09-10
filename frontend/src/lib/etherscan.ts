/**
 * Centralized Etherscan API Client
 * 
 * Provides methods to query Ethereum blockchain transactions, balances,
 * ERC-20 token transfers, and transaction details.
 */

// Base URL specified for Etherscan API
export const ETHERSCAN_BASE_URL = 'https://api.etherscan.io/api';
// Fallback V2 endpoint in case V1 endpoint triggers deprecation notice on new keys
export const ETHERSCAN_V2_BASE_URL = 'https://api.etherscan.io/v2/api';

/**
 * Retrieves the Etherscan API key from the environment.
 * Checks NEXT_PUBLIC_ETHERSCAN_API_KEY via Vite or Node environment.
 */
export function getEtherscanApiKey(): string {
  let key = '';

  // Check Vite import.meta.env
  try {
    if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
      key = (import.meta as any).env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
    }
  } catch {
    // Ignore in non-Vite environments
  }

  // Fallback to process.env if available (Node/Next.js runtime)
  if (!key) {
    try {
      const globalProcess = (globalThis as any).process;
      if (globalProcess && globalProcess.env) {
        key = globalProcess.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || '';
      }
    } catch {
      // Ignore
    }
  }

  return (key && key !== 'YOUR_KEY_HERE') ? key.trim() : '';
}

/**
 * Validates whether an input string is a valid Ethereum address.
 */
export function isValidEthereumAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

/**
 * Validates whether an input string is a valid transaction hash.
 */
export function isValidTxHash(txHash: string): boolean {
  if (!txHash || typeof txHash !== 'string') return false;
  return /^0x[a-fA-F0-9]{64}$/.test(txHash.trim());
}

/**
 * Custom error class for structured Etherscan API errors.
 */
export class EtherscanError extends Error {
  code: 'INVALID_INPUT' | 'RATE_LIMIT' | 'API_ERROR' | 'EMPTY_RESULT' | 'NETWORK_ERROR';
  details?: any;

  constructor(
    message: string,
    code: 'INVALID_INPUT' | 'RATE_LIMIT' | 'API_ERROR' | 'EMPTY_RESULT' | 'NETWORK_ERROR',
    details?: any
  ) {
    super(message);
    this.name = 'EtherscanError';
    this.code = code;
    this.details = details;
  }
}

/**
 * Helper to make a request to Etherscan with error handling & v2 fallback.
 */
async function fetchEtherscan(params: Record<string, string>): Promise<any> {
  const apiKey = getEtherscanApiKey();
  const searchParams = new URLSearchParams(params);
  if (apiKey) {
    searchParams.set('apikey', apiKey);
  }

  const primaryUrl = `${ETHERSCAN_BASE_URL}?${searchParams.toString()}`;

  try {
    const res = await fetch(primaryUrl);
    if (!res.ok) {
      throw new EtherscanError(`HTTP ${res.status}: ${res.statusText}`, 'NETWORK_ERROR');
    }

    const data = await res.json();

    // Check for Etherscan V1 deprecation warning
    if (
      data.status === '0' &&
      typeof data.result === 'string' &&
      data.result.includes('deprecated V1 endpoint')
    ) {
      // Retry using V2 endpoint with chainid=1
      searchParams.set('chainid', '1');
      const v2Url = `${ETHERSCAN_V2_BASE_URL}?${searchParams.toString()}`;
      const v2Res = await fetch(v2Url);
      if (!v2Res.ok) {
        throw new EtherscanError(`HTTP ${v2Res.status}: ${v2Res.statusText}`, 'NETWORK_ERROR');
      }
      return await v2Res.json();
    }

    return data;
  } catch (err: any) {
    if (err instanceof EtherscanError) throw err;
    throw new EtherscanError(err?.message || 'Network request failed', 'NETWORK_ERROR', err);
  }
}

/**
 * Fetches the last 25 normal transactions for a given Ethereum address.
 * 
 * @param address - Ethereum wallet address (0x...)
 * @returns Array of transaction objects (empty array if no transactions found)
 */
export async function getAddressTransactions(address: string): Promise<any[]> {
  const cleanAddress = address?.trim();
  if (!isValidEthereumAddress(cleanAddress)) {
    throw new EtherscanError(
      `Invalid Ethereum address: "${address}". Expected a 42-character hex string starting with 0x.`,
      'INVALID_INPUT'
    );
  }

  const data = await fetchEtherscan({
    module: 'account',
    action: 'txlist',
    address: cleanAddress,
    startblock: '0',
    endblock: '99999999',
    page: '1',
    offset: '25',
    sort: 'desc',
  });

  // Handle rate limits and empty results
  if (data.status === '0' && typeof data.result === 'string') {
    if (data.result.toLowerCase().includes('rate limit')) {
      throw new EtherscanError('Etherscan API rate limit exceeded. Please try again shortly.', 'RATE_LIMIT');
    }
    if (
      data.message === 'No transactions found' || 
      data.result.includes('No transactions found') || 
      data.result.includes('No records found')
    ) {
      return [];
    }
    throw new EtherscanError(data.result, 'API_ERROR', data);
  }

  return Array.isArray(data.result) ? data.result : [];
}

/**
 * Fetches the current native ETH balance for a given Ethereum address.
 * 
 * @param address - Ethereum wallet address (0x...)
 * @returns Balance object containing raw Wei and human-readable ETH
 */
export async function getAddressBalance(address: string): Promise<{ wei: string; eth: string }> {
  const cleanAddress = address?.trim();
  if (!isValidEthereumAddress(cleanAddress)) {
    throw new EtherscanError(
      `Invalid Ethereum address: "${address}". Expected a 42-character hex string starting with 0x.`,
      'INVALID_INPUT'
    );
  }

  const data = await fetchEtherscan({
    module: 'account',
    action: 'balance',
    address: cleanAddress,
    tag: 'latest',
  });

  if (data.status === '0') {
    const errorMsg = typeof data.result === 'string' ? data.result : data.message;
    if (typeof data.result === 'string' && data.result.toLowerCase().includes('rate limit')) {
      throw new EtherscanError('Etherscan API rate limit exceeded. Please try again shortly.', 'RATE_LIMIT');
    }
    throw new EtherscanError(errorMsg || 'Failed to fetch address balance', 'API_ERROR', data);
  }

  const weiString = String(data.result || '0');
  let ethString = '0';
  try {
    // Format to ETH with up to 6 decimals
    const weiBigInt = BigInt(weiString);
    const whole = weiBigInt / 1000000000000000000n;
    const remainder = weiBigInt % 1000000000000000000n;
    const decimalPart = remainder.toString().padStart(18, '0').slice(0, 6);
    ethString = `${whole.toString()}.${decimalPart}`;
  } catch {
    ethString = (Number(weiString) / 1e18).toString();
  }

  return {
    wei: weiString,
    eth: ethString,
  };
}

/**
 * Fetches the last 25 ERC-20 token transfer events for a given Ethereum address.
 * 
 * @param address - Ethereum wallet address (0x...)
 * @returns Array of ERC-20 transfer event objects (empty array if no transfers found)
 */
export async function getAddressTokenTransfers(address: string): Promise<any[]> {
  const cleanAddress = address?.trim();
  if (!isValidEthereumAddress(cleanAddress)) {
    throw new EtherscanError(
      `Invalid Ethereum address: "${address}". Expected a 42-character hex string starting with 0x.`,
      'INVALID_INPUT'
    );
  }

  const data = await fetchEtherscan({
    module: 'account',
    action: 'tokentx',
    address: cleanAddress,
    page: '1',
    offset: '25',
    sort: 'desc',
  });

  // Handle rate limits and empty results
  if (data.status === '0' && typeof data.result === 'string') {
    if (data.result.toLowerCase().includes('rate limit')) {
      throw new EtherscanError('Etherscan API rate limit exceeded. Please try again shortly.', 'RATE_LIMIT');
    }
    if (
      data.message === 'No transactions found' || 
      data.result.includes('No transactions found') || 
      data.result.includes('No records found')
    ) {
      return [];
    }
    throw new EtherscanError(data.result, 'API_ERROR', data);
  }

  return Array.isArray(data.result) ? data.result : [];
}

/**
 * Fetches single transaction details by transaction hash.
 * 
 * @param txHash - Ethereum transaction hash (0x... 66 hex characters)
 * @returns Transaction details object
 */
export async function getTransactionDetails(txHash: string): Promise<any> {
  const cleanHash = txHash?.trim();
  if (!isValidTxHash(cleanHash)) {
    throw new EtherscanError(
      `Invalid transaction hash: "${txHash}". Expected a 66-character hex string starting with 0x.`,
      'INVALID_INPUT'
    );
  }

  const data = await fetchEtherscan({
    module: 'proxy',
    action: 'eth_getTransactionByHash',
    txhash: cleanHash,
  });

  // Proxy JSON-RPC response format: { jsonrpc: "2.0", id: 1, result: { ... } }
  if (data.error) {
    const msg = data.error.message || JSON.stringify(data.error);
    if (msg.toLowerCase().includes('rate limit')) {
      throw new EtherscanError('Etherscan API rate limit exceeded.', 'RATE_LIMIT');
    }
    throw new EtherscanError(msg, 'API_ERROR', data.error);
  }

  if (data.result === null) {
    throw new EtherscanError(`Transaction not found for hash: ${cleanHash}`, 'EMPTY_RESULT');
  }

  return data.result;
}
