// 02_weth.ts

import { Deploy } from '@luxdefi/contracts/utils/deploy'

export default Deploy('WETH', {}, async ({ hre, deploy, deployments, deps }) => {
  await deploy()
})