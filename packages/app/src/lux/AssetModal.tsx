import { Modal } from 'react-morphing-modal'
import { HiOutlineChevronLeft } from 'react-icons/hi'

import Asset from './Asset'
import { useState, forwardRef, useEffect, useCallback } from 'react'
import { useActiveWeb3React, useContract } from '../hooks'
import { useCurrencyBalance, useETHBalances } from '../state/wallet/hooks'
import Dots from '../components/Dots'
import { t } from '@lingui/macro'
import { i18n } from '@lingui/core'
import Moralis from 'moralis'
import { shortenAddress } from '../functions'
import { useGasPrice } from '../state/network/hooks'
import { getCurrency } from '../config/currencies'

const AssetModal = (props: any) => {
  const { modalProps, tokenId, type, height, image, video } = props
  const [showHow, setShowHow] = useState(false)
  const { chainId, account } = useActiveWeb3React()
  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const [currentAskPrice, setCurrentAskPrice] = useState(null)
  const [currency, setCurrency] = useState(null)
  // const [currencyBalance, setCurrencyBalance] = useState(null)
  const gasPrice = useGasPrice()
  const app = useContract('App')
  const media = useContract('Media')
  const market = useContract('Market')

  const buyNFT = async () => {
    // console.log(app)
    const tx = await app.buyNFT(1, props.tokenId, { from: account, gasPrice, value: Moralis.Units.ETH('1') })
    console.log(tx)
    const tx2 = await market.bidForTokenBidder(1, account)
    console.log(tx2)
    // const tx3 = await market.isReserved(1)
    // console.log(tx3)

    // const options = { type: 'native', amount: Moralis.Units.ETH('0.5'), receiver: app.address }
    // let result = await Moralis.
  }

  const currencyBalance = useCurrencyBalance(account, currency)

  const updateAssetDetails = useCallback(async () => {
    if (!tokenId) return
    const ask = await market.currentAskForToken(tokenId)
    setCurrentAskPrice(ask.amount)
    const currency = getCurrency(ask.currency, chainId)
    setCurrency(currency)
  }, [tokenId, market, account])

  useEffect(() => {
    updateAssetDetails()
  }, [tokenId, updateAssetDetails])

  useEffect(() => {
    if (props.tokenId) {
      market?.getReservation(props.tokenId).then(console.log)
    }
  }, [props.tokenId, chainId])

  return (
    <Modal {...props.modalProps} padding={0} closeButton={false}>
      <div className="grid md:grid-cols-2 gap-30 sm:grid-cols-1">
        <div className="">
          <div
            onClick={modalProps.close}
            className="flex items-center justify-center mt-5 ml-5 bg-gray-800 rounded-full shadow-2xl cursor-pointer md:absolute h-14 w-14"
          >
            <HiOutlineChevronLeft />
          </div>
          <div className="flex items-stretch md:h-screen">
            <Asset
              className="self-center m-auto w-96"
              tokenId={tokenId}
              type={type}
              showPrice
              image={image}
              video={video}
              autoPlay
            />
          </div>
        </div>
        <div className="flex items-stretch bg-gray-900 md:h-screen">
          <div className="self-center m-auto w-96">
            {showHow ? (
              <div>
                <h2 className="pb-4 text-2xl">How do reservations work?</h2>
                <p className="mb-5">
                  Reserve your NFT to ensure you are part of the LUX network at launch. If your bid is not accepted,
                  your reservation will be refunded.
                </p>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-base font-semibold text-center text-white transition duration-200 ease-in bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:ring-offset-indigo-200 focus:outline-none focus:ring-offset-2 "
                  onClick={() => setShowHow(false)}
                >
                  Ok
                </button>
              </div>
            ) : (
              <div className="sm:p-4 md:p-0">
                <div className="py-3 text-right">
                  <div className="text-gray-500">{account && shortenAddress(account)}</div>
                  <div className="text-xl">
                    {account && chainId && currency && (
                      <>
                        {currencyBalance ? (
                          <div>
                            Balance {currencyBalance?.toFixed(0)} {currency.symbol}
                          </div>
                        ) : (
                          <Dots>{i18n._(t`Loading`)}</Dots>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full px-4 py-3 text-xl text-center text-white transition duration-200 ease-in bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-700 focus:ring-offset-indigo-200 focus:outline-none focus:ring-offset-2"
                  onClick={buyNFT}
                >
                  Reserve {type}{' '}
                  <span className="px-2 py-1 ml-1 text-xs font-bold text-black bg-gray-300 rounded-full lux-font AssetModal__token-id">
                    {tokenId}
                  </span>
                </button>
                <div className="pt-3">
                  <p className="text-center">You cannot withdraw a reservation once submitted.</p>
                  <p className="text-center text-indigo-400 cursor-pointer" onClick={() => setShowHow(true)}>
                    How do reservations work?
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AssetModal
