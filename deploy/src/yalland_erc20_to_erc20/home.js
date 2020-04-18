const assert = require('assert')
const Web3Utils = require('web3-utils')
const { web3Home, HOME_RPC_URL, deploymentPrivateKey } = require('../web3')
const {
  deployContract,
  privateKeyToAddress,
  upgradeProxy,
} = require('../deploymentUtils')
const {
  DEPLOYMENT_ACCOUNT_PRIVATE_KEY,
} = require('../loadEnv')

const {
  homeContracts: {
    EternalStorageProxy,
    HomeAMBErc677ToErc677: HomeBridge,
  }
} = require('../loadContracts')

const DEPLOYMENT_ACCOUNT_ADDRESS = privateKeyToAddress(DEPLOYMENT_ACCOUNT_PRIVATE_KEY)

async function deployHome() {
  let nonce = await web3Home.eth.getTransactionCount(DEPLOYMENT_ACCOUNT_ADDRESS)

  console.log('\n[Home] Deploying Bridge Mediator storage\n')
  const homeBridgeStorage = await deployContract(EternalStorageProxy, [], {
    from: DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })
  nonce++
  console.log('[Home] Bridge Mediator Storage: ', homeBridgeStorage.options.address)

  console.log('\n[Home] Deploying Bridge Mediator implementation\n')
  const homeBridgeImplementation = await deployContract(HomeBridge, [], {
    from: DEPLOYMENT_ACCOUNT_ADDRESS,
    nonce
  })
  nonce++
  console.log('[Home] Bridge Mediator Implementation: ', homeBridgeImplementation.options.address)

  console.log('\n[Home] Hooking up Mediator storage to Mediator implementation')
  await upgradeProxy({
    proxy: homeBridgeStorage,
    implementationAddress: homeBridgeImplementation.options.address,
    version: '1',
    nonce,
    url: HOME_RPC_URL
  })
  nonce++

  console.log('\nHome part of ERC677-to-ERC677 bridge deployed\n')
  return {
    homeBridgeMediator: {
      address: homeBridgeStorage.options.address,
      abi: HomeBridge.abi
    },
  }
}

module.exports = deployHome
