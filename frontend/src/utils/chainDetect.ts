/**
 * Chain detection helper for multi-chain address resolution.
 */

export type ChainType = 'bitcoin' | 'ethereum' | 'solana' | 'tron' | 'unknown';

export function detectChainType(address: string): ChainType {
  const clean = (address || '').trim();
  if (!clean) return 'unknown';

  // EVM / Ethereum (0x followed by 40 hex chars or 0x prefix)
  if (/^0x[a-fA-F0-9]{40}$/i.test(clean) || clean.startsWith('0x')) {
    return 'ethereum';
  }

  // TRON (Base58, starts with 'T', 34 chars)
  if (/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(clean)) {
    return 'tron';
  }

  // Bitcoin (Legacy '1', Nested SegWit '3', Native SegWit 'bc1q', Taproot 'bc1p')
  if (
    /^(bc1|[13])[a-km-zA-HJ-NP-Z1-9ac-qpzry9x8gf2tvdw0s3jn54khce6mua7l]{25,62}$/i.test(clean) ||
    clean.startsWith('bc1') ||
    ((clean.startsWith('1') || clean.startsWith('3')) && clean.length >= 26 && clean.length <= 35)
  ) {
    return 'bitcoin';
  }

  // Solana (Base58, 32-44 chars, excluding 0, O, I, l)
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean)) {
    return 'solana';
  }

  return 'unknown';
}

export function getChainParam(chain: ChainType): 'ethereum' | 'solana' | 'tron' | 'bitcoin' {
  switch (chain) {
    case 'ethereum':
      return 'ethereum';
    case 'solana':
      return 'solana';
    case 'tron':
      return 'tron';
    case 'bitcoin':
      return 'bitcoin';
    default:
      return 'ethereum';
  }
}
