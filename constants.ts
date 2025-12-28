
import { TaxRateYear } from './types';

export const SIMULATION_YEARS: TaxRateYear[] = [
  { year: 2027, percIBS: 0.1, percCBS: 0.9, percReducICMS: 10 },
  { year: 2028, percIBS: 0.2, percCBS: 1.8, percReducICMS: 20 },
  { year: 2029, percIBS: 0.3, percCBS: 2.7, percReducICMS: 40 },
  { year: 2030, percIBS: 0.4, percCBS: 3.6, percReducICMS: 60 },
  { year: 2031, percIBS: 0.5, percCBS: 4.5, percReducICMS: 80 },
  { year: 2032, percIBS: 0.6, percCBS: 5.4, percReducICMS: 100 },
  { year: 2033, percIBS: 0.7, percCBS: 6.3, percReducICMS: 100 }
];

export const INITIAL_YEAR = 2027;
