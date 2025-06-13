import { Address } from "viem"

export interface BuildRouteResponse {
    code: number
    message: string
    data: {
      amountIn: string
      amountInUsd: string
      amountOut: string
      amountOutUsd: string
      gas: string
      gasUsd: string
      data: string
      routerAddress: Address
      transactionValue: string
    }
    requestId: string
  }