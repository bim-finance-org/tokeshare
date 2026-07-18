import { describe, it, expect } from 'vitest';
import {
  calculateTGGPrice,
  calculateTSGPrice,
  calculateTMCPrice,
  calculateTSP500Price,
  convertWithRate,
  convertStablecoinToTGG,
  convertTGGToStablecoin,
  convertFiatToTGG,
  convertTGGToFiat,
} from './priceUtils';
import type { ExchangeRates } from '../hooks/useExchangeRates';

const rates = { EUR: 0.9, CAD: 1.35, CHF: 0.88, GBP: 0.78, USD: 1 } as ExchangeRates;

describe('price calculations', () => {
  it('derives gold/silver token prices from the ounce price', () => {
    expect(calculateTGGPrice(31.1034768)).toBeCloseTo(1, 10);
    expect(calculateTSGPrice(31.1034768)).toBeCloseTo(1, 10);
  });

  it('applies the 1/10 index ratio for TMC and TSP500', () => {
    expect(calculateTMCPrice(50)).toBe(5);
    expect(calculateTSP500Price(100)).toBe(10);
  });

  it('convertWithRate multiplies', () => {
    expect(convertWithRate(10, 1.5)).toBe(15);
  });
});

describe('stablecoin <-> TGG conversions', () => {
  it('converts stablecoin to TGG and guards a non-positive price', () => {
    expect(convertStablecoinToTGG(100, 1, 50)).toBe(2);
    expect(convertStablecoinToTGG(100, 1, 0)).toBe(0);
  });

  it('converts TGG to stablecoin and guards a non-positive rate', () => {
    expect(convertTGGToStablecoin(2, 50, 1)).toBe(100);
    expect(convertTGGToStablecoin(2, 50, 0)).toBe(0);
  });
});

describe('fiat <-> TGG conversions', () => {
  it('passes USD straight through', () => {
    expect(convertFiatToTGG(100, 'USD', rates, 50)).toBe(2);
    expect(convertTGGToFiat(2, 'USD', rates, 50)).toBe(100);
  });

  it('applies the fiat rate for other currencies', () => {
    // 90 EUR / 0.9 = 100 USD / 50 = 2 TGG
    expect(convertFiatToTGG(90, 'EUR', rates, 50)).toBeCloseTo(2, 10);
    // 2 TGG * 50 = 100 USD * 0.9 = 90 EUR
    expect(convertTGGToFiat(2, 'EUR', rates, 50)).toBeCloseTo(90, 10);
  });

  it('returns undefined when rates are missing or price is non-positive', () => {
    expect(convertFiatToTGG(100, 'EUR', undefined, 50)).toBeUndefined();
    expect(convertFiatToTGG(100, 'EUR', rates, 0)).toBeUndefined();
    expect(convertTGGToFiat(1, 'JPY', rates, 50)).toBeUndefined(); // unknown currency
  });
});
