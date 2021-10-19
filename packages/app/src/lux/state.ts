import { useEffect, useState } from 'react'
import { BigintIsh, Currency, CurrencyAmount, CurrencySymbol, Ether, Token, ZERO_ADDRESS, cachedFetch } from '@luxdefi/sdk'
import { useQuery, gql } from '@apollo/client'
import { getCurrencyToken, getCurrencyTokenLowerCase } from '../config/currencies'
import { formatCurrencyAmountWithCommas, formatCurrencyFromRawAmount, numberWithCommas } from '../functions'
import { useActiveWeb3React, useContract } from '../hooks'
import { useCurrencyBalance } from '../state/wallet/hooks'
import { Ask } from './types'

export type AssetState = {
  ask: Ask
  currencyToken: Currency
  currencyBalance: CurrencyAmount<Currency>
  formattedAmount: string
  formattedBalance: string
  isOwner: boolean
  owner: string
  symbol: string
}

export type UseAssetOptions = {
  isActive?: boolean
}

const GET_ASSET = gql`
  query GetAsset($id: Int!) {
    media(id:$id) {
      id
      contentURI
      createdAtTimestamp
      owner {
        id 
      }
      currentAsk {
        amount
        currency {
          id
        }
      }
      currentBids {
        amount
        currency {
          id
        }
        bidder {
          id
        }
      }
    }
  }
`

const defaultAsset = {
  contentURI: null,
  currentBids: [],
}

const typeLabelMap = {
  validator: 'Validator',
  atm: 'ATM',
  cash: 'ATM',
  wallet: 'Wallet',
}

export const getContent = (contentURI) => {
  const type = contentURI?.match(/\/(\w+)\.(\w+)$/)[1] || ''
  return{
    type: typeLabelMap[type],
    image: type && `/nfts/${type.toLowerCase()}.gif`,
    video: type && `/nfts/${type.toLowerCase()}.mov`,
  }
}

export function useAsset(tokenId: number | string) {
  const { account, chainId } = useActiveWeb3React()
  const [owner, setOwner] = useState(null)
  const [ask, setAsk] = useState(null)
  const [usdAmount, setUsdAmount] = useState(null)
  const [currencyToken, setCurrencyToken] = useState(new Token(chainId, ZERO_ADDRESS, 18) as Currency)
  const [formattedAmount, setFormattedAmount] = useState(null)
  const [formattedBalance, setFormattedBalance] = useState(null)
  const [asset, setAsset] = useState(defaultAsset)
  const { getUsdAmount } = usePrice()
  const { loading, error } = useQuery(GET_ASSET, {
    variables: {
      id: tokenId ? parseInt(tokenId.toString()) : 0,
    },
    onCompleted: ({ media }) => {
      setAsset(media || defaultAsset)
    }
  });

  const media = useContract('Media')
  const market = useContract('Market')

  const currencyBalance = useCurrencyBalance(account, currencyToken)

  useEffect(() => {
    if (tokenId) {
      media.ownerOf(tokenId).then(setOwner)
      market.currentAskForToken(tokenId).then(setAsk)
    }
  }, [tokenId])

  useEffect(() => {
    if (ask) {
      const token = getCurrencyToken(ask.currency, chainId)
      setCurrencyToken(token)
      setFormattedAmount(formatCurrencyAmountWithCommas(token, ask.amount))
      setUsdAmount(getUsdAmount(ask.currency, ask.amount))
    }
  }, [ask, chainId])

  useEffect(() => {
    if (currencyBalance) {
      setFormattedBalance(numberWithCommas(currencyBalance.toFixed(0)))
    }
  }, [currencyBalance])

  const { type, video, image } = getContent(asset?.contentURI)

  return {
    ask,
    owner,
    isOwner: account === owner,
    currencyToken,
    currencyBalance,
    formattedAmount,
    formattedBalance,
    usdAmount,
    balance: currencyBalance?.toFixed(0) || '0',
    symbol: currencyToken && currencyToken.symbol,
    contentURI: asset?.contentURI,
    currentBids: asset?.currentBids,
    type, 
    video, 
    image,
  }
}

export function useBids(tokenId: number | string) {

}

// Example
// {
//   ethereum: {
//     usd: 3650.52
//   }
//   weth: {
//     usd: 3640.05
//   }
// }
export type CoingeckoPrices = {
  [coinId: string]: {
    usd: number
  }
}

export const usePrice = () => {
  const coinIds = [
    'ethereum',
    'weth'
  ]
  const COINGECKO_API_V3 = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd`
  const symbolMap = {
    [CurrencySymbol.ETH]: 'ethereum',
    [CurrencySymbol.WETH]: 'weth',
  }
  const { chainId } = useActiveWeb3React()
  const [loading, setLoading] = useState<boolean>(false)
  const [prices, setPrices] = useState<CoingeckoPrices>({})

  useEffect(() => {
    const fetchPrices = async () => {
      setLoading(true)
      const prices = await cachedFetch(COINGECKO_API_V3, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }, 1000 * 60 * 2) // cache for 2 minutes
      setPrices(prices)
      setLoading(false)
    }
    
    fetchPrices()
  }, [])

  const getPrices = (symbol: string) => {
    return prices[symbolMap[symbol]]
  }

  const getUsdPrice = (symbol: string): number => {
    return getPrices(symbol)?.usd || 0
  }

  const getUsdAmount = (tokenAddress: string, tokenAmount: BigintIsh): string => {
    const currencyToken = getCurrencyTokenLowerCase(tokenAddress, chainId) || new Token(chainId, ZERO_ADDRESS, 2)
    const usdPrice = getUsdPrice(currencyToken?.symbol)
    const amount = formatCurrencyFromRawAmount(currencyToken, tokenAmount)
    return usdPrice ? numberWithCommas((parseFloat(amount) * usdPrice).toFixed(0)) : numberWithCommas(amount)
  }

  return {
    loading,
    prices,
    getPrices,
    getUsdAmount,
  }
}