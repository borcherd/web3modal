import { subscribeKey as subKey } from 'valtio/utils'
import { proxy, ref, subscribe as sub } from 'valtio/vanilla'
import type { Balance } from '@web3modal/common'
import {
  getLinksFromTx,
  getRandomString,
  prepareDepositTxs,
  setFeeOptions
} from '@squirrel-labs/peanut-sdk'
import { CoreHelperUtil } from '../utils/CoreHelperUtil'
import { SnackController } from './SnackController'
import { ConnectionController } from './ConnectionController'
import { AccountController } from './AccountController'
import { polygon } from '@wagmi/core/chains'
import { NetworkController } from './NetworkController'
import type { CaipNetwork } from '../..'

// -- Types --------------------------------------------- //
export interface SendControllerState {
  token?: Balance
  sendTokenAmount?: number
  receiverAddress?: string
  receiverProfileName?: string
  receiverProfileImageUrl?: string
  type?: 'Address' | 'Link'
}

type StateKey = keyof SendControllerState

// -- State --------------------------------------------- //
const state = proxy<SendControllerState>({})

// -- Controller ---------------------------------------- //
export const SendController = {
  state,

  subscribe(callback: (newState: SendControllerState) => void) {
    return sub(state, () => callback(state))
  },

  subscribeKey<K extends StateKey>(key: K, callback: (value: SendControllerState[K]) => void) {
    return subKey(state, key, callback)
  },

  setToken(token: SendControllerState['token']) {
    if (token) {
      state.token = ref(token)
    }
  },

  setTokenAmount(sendTokenAmount: SendControllerState['sendTokenAmount']) {
    state.sendTokenAmount = sendTokenAmount
  },

  setReceiverAddress(receiverAddress: SendControllerState['receiverAddress']) {
    state.receiverAddress = receiverAddress
  },

  setReceiverProfileImageUrl(
    receiverProfileImageUrl: SendControllerState['receiverProfileImageUrl']
  ) {
    state.receiverProfileImageUrl = receiverProfileImageUrl
  },

  setReceiverProfileName(receiverProfileName: SendControllerState['receiverProfileName']) {
    state.receiverProfileName = receiverProfileName
  },

  setType(type: SendControllerState['type']) {
    state.type = type
  },

  resetSend() {
    state.token = undefined
    state.sendTokenAmount = undefined
    state.receiverAddress = undefined
    state.receiverProfileImageUrl = undefined
    state.receiverProfileName = undefined
    state.type = undefined
  },

  async generateLink() {
    if (!state.token) return

    try {
      const chainId = state.token?.chainId.split(':')[1]
      const address = AccountController.state.address
      const password = await getRandomString(16)

      const linkDetails = {
        chainId: chainId ?? '',
        tokenAmount: state.sendTokenAmount ?? 0,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        tokenDecimals: 18,
        trackId: 'walletconnect',
        tokenType: 0
      } // TODO: update these values

      console.log(linkDetails)

      const network = NetworkController.state.caipNetwork
      if (network && network.id != state.token?.chainId) {
        const { approvedCaipNetworkIds, requestedCaipNetworks } = NetworkController.state

        const sortedNetworks = CoreHelperUtil.sortRequestedNetworks(
          approvedCaipNetworkIds,
          requestedCaipNetworks
        )
        const requestedNetwork = sortedNetworks.find(
          (network: CaipNetwork) => network.id === (state.token?.chainId as `${string}:${string}`)
        )

        await NetworkController.switchActiveNetwork(requestedNetwork as CaipNetwork)
        await NetworkController.setCaipNetwork(requestedNetwork as CaipNetwork)
      }

      const preparedDeposits = await prepareDepositTxs({
        passwords: [password],
        address: address ?? '',
        linkDetails
      })

      console.log(preparedDeposits)

      let idx = 0
      const signedTxsResponse: string[] = []

      for (const tx of preparedDeposits.unsignedTxs) {
        let txOptions
        try {
          txOptions = await setFeeOptions({
            chainId: chainId
          })
        } catch (error: any) {
          console.log('error setting fee options, fallback to default')
        }

        const hash = await ConnectionController.sendTransaction({
          to: address as `0x${string}`,
          value: tx.value ? BigInt(tx.value.toString()) : undefined,
          account: address as `0x${string}`
          // to: (tx.to ? tx.to : '') as `0x${string}`,
          // value: tx.value ? BigInt(tx.value.toString()) : undefined,
          // data: tx.data ? (tx.data as `0x${string}`) : undefined
          // chainId: polygon.id,
          // maxFeePerGas: txOptions?.maxFeePerGas
          //   ? BigInt(txOptions?.maxFeePerGas.toString())
          //   : undefined,
          // maxPriorityFeePerGas: txOptions?.maxPriorityFeePerGas
          //   ? BigInt(txOptions?.maxPriorityFeePerGas.toString())
          //   : undefined
        })

        console.log(hash)

        signedTxsResponse.push(hash.toString())
        idx++
      }

      // const link = await getLinksFromTx({
      //   linkDetails,
      //   passwords: [password],
      //   txHash: signedTxsResponse[signedTxsResponse.length - 1] ?? ''
      // })

      // // const link = { links: ['test'] }
      // CoreHelperUtil.copyToClopboard(link.links[0] ?? '')
      // SnackController.showSuccess('Link copied')
    } catch (error) {
      console.log(error)
    }
  }
}
