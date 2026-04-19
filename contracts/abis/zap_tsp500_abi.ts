import { ZAP_TMC_ABI } from './zap_tmc_abi';

// ZAP_TSP500 shares the same interface as ZAP_TMC (zapMint / zapWithdraw
// / zapMintFee / zapWithdrawFee) but wraps deSPXA instead of CMC20.
// Replace this alias with a dedicated ABI if the deployed contract diverges.
export const ZAP_TSP500_ABI = ZAP_TMC_ABI;
