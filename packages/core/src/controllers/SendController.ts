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

import { NetworkController } from './NetworkController'
import type { CaipNetwork } from '../..'
import { ModalController } from './ModalController'

// -- Types --------------------------------------------- //
export interface SendControllerState {
  token?: Balance
  sendTokenAmount?: number
  receiverAddress?: string
  receiverProfileName?: string
  receiverProfileImageUrl?: string
  type?: 'Address' | 'Link'
  createdLink?: string
  loading?: boolean
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

  setCreatedLink(createdLink: SendControllerState['createdLink']) {
    state.createdLink = createdLink
  },

  setLoading(loading: SendControllerState['loading']) {
    state.loading = loading
  },

  resetSend() {
    state.token = undefined
    state.sendTokenAmount = undefined
    state.receiverAddress = undefined
    state.receiverProfileImageUrl = undefined
    state.receiverProfileName = undefined
    state.type = undefined
    state.createdLink = undefined
    state.loading = false
  },

  async generateLink() {
    if (!state.token) return

    try {
      this.setLoading(true)
      ModalController.setStayOpen(true)
      const chainId = state.token?.chainId.split(':')[1]
      const address = AccountController.state.address
      const password = await getRandomString(16)
      //@ts-ignore-next-line - tokenAddress isnt updated in api spec yet
      let tokenAddress = state.token?.address.split(':')[2]
      if (
        !tokenAddress ||
        tokenAddress.toLowerCase() == '0x0000000000000000000000000000000000001010'
      ) {
        tokenAddress = '0x0000000000000000000000000000000000000000'
      }

      let tokenType = 1
      if (tokenAddress.toLowerCase() == '0x0000000000000000000000000000000000000000') {
        tokenType = 0
      }

      const linkDetails = {
        chainId: chainId ?? '',
        tokenAmount: state.sendTokenAmount ?? 0,
        tokenAddress,
        tokenDecimals: Number(state.token?.quantity.decimals) ?? 18,
        trackId: 'walletconnect',
        tokenType: tokenType
      }

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

      console.log('prepared deposits', preparedDeposits.unsignedTxs)

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
        console.log('before')
        await new Promise(resolve => setTimeout(resolve, 1000))
        console.log('after')
        const hash = await ConnectionController.sendTransaction({
          to: (tx.to ? tx.to : '') as `0x${string}`,
          value: tx.value ? BigInt(tx.value.toString()) : undefined,
          data: tx.data ? (tx.data as `0x${string}`) : undefined,
          chainId: Number(chainId),
          maxFeePerGas: txOptions?.maxFeePerGas
            ? BigInt(txOptions?.maxFeePerGas.toString())
            : undefined,
          maxPriorityFeePerGas: txOptions?.maxPriorityFeePerGas
            ? BigInt(txOptions?.maxPriorityFeePerGas.toString())
            : undefined,
          gas: txOptions?.gas ? BigInt(txOptions.gas.toString()) : undefined,
          gasPrice: txOptions?.gasPrice ? BigInt(txOptions.gasPrice.toString()) : undefined
        })

        signedTxsResponse.push(hash.toString())
        idx++
      }

      const link = await getLinksFromTx({
        linkDetails,
        passwords: [password],
        txHash: signedTxsResponse[signedTxsResponse.length - 1] ?? ''
      })

      console.log(link, `link generated ✨`)

      CoreHelperUtil.copyToClopboard(link.links[0] ?? '')
      SnackController.showSuccess('Link copied')

      this.setCreatedLink(link.links[0] ?? '')
    } catch (error) {
      console.log(error)
    }
  }
}
