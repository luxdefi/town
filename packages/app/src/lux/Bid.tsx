import { EyeIcon, PencilIcon } from '@heroicons/react/solid'
import { BigintIsh, Currency, Token, ZERO_ADDRESS } from '@luxdefi/sdk'
import { useEffect, useState } from 'react'
import TimeAgo from 'react-timeago'
import { getCurrencyTokenLowerCase } from '../config/currencies'
import { formatCurrencyAmountWithCommas, shortenAddress } from '../functions'
import { useActiveWeb3React } from '../hooks'
import { getContent } from './state'
import { BidResponse } from './types'

export type BidProps = {
  bid: BidResponse
  getUsdAmount: (tokenAddress: string, tokenAmount: BigintIsh) => {}
  hideToken?: boolean
}

const Bid = ({ bid, getUsdAmount, hideToken }: BidProps) => {
  const { chainId, account } = useActiveWeb3React()
  const [formattedAmount, setFormattedAmount] = useState(null)
  const [currencyToken, setCurrencyToken] = useState(new Token(chainId, ZERO_ADDRESS, 18) as Currency)
  const [tokenId, setTokenId] = useState(null)
  const [type, setType] = useState(null)

  useEffect(() => {
    const token = getCurrencyTokenLowerCase(bid.currency.id, chainId)
    if (token) {
      setCurrencyToken(token)
      setFormattedAmount(formatCurrencyAmountWithCommas(token, bid.amount))
    }
    if (bid.media) {
      const { type } = getContent(bid.media.contentURI)
      setType(type)
      setTokenId(bid.media.id)
    }
  }, [chainId])

  const usdAmount = getUsdAmount(bid.currency.id, bid.amount)

  return (
    <div className="my-3 Bid">
      {!hideToken && <div>
          <span className="text-lg text-gray-300">{type}</span>
          <span className="px-2 py-1 ml-2 text-xs font-bold text-black bg-gray-300 rounded-full lux-font Asset__token-id">
            {tokenId}
          </span>
        </div>}
      <div className="grid grid-cols-2">
        <div className="">
          <div>
            {shortenAddress(bid?.bidder?.id)} Placed a bid
          </div>
          <small className="text-gray-500">
            <TimeAgo date={new Date(parseInt(bid.createdAtTimestamp) * 1000)} />
          </small>
        </div>
        <div className="flex justify-end">
          <div className="text-right">
            <div>
              {formattedAmount} {currencyToken?.symbol}
            </div>
            {usdAmount !== '0' && <small className="text-gray-500">${usdAmount}</small>}
          </div>
          <div>
            {account.toLowerCase() === bid.media.owner.id.toLowerCase() ? (
              <PencilIcon className="p-2 ml-3 bg-gray-700 rounded-full cursor-pointer" width={32} />
            ) : (
              <EyeIcon className="p-2 ml-3 bg-gray-700 rounded-full cursor-pointer" width={32} />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Bid