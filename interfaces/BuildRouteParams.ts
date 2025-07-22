import { Address } from 'viem';
import { RouteSummary } from './RouteSummary';

export interface BuildRouteParams {
  routeSummary: RouteSummary;
  sender: Address;
  recipient: Address;
  slippageTolerance: number;
  deadline?: number;
  source?: string;
  permit?: string;
  ignoreCappedSlippage?: boolean;
  enableGasEstimation?: boolean;
}
