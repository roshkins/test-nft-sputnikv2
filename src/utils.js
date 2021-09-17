import { connect, Contract, keyStores, WalletConnection } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')
const StakingFactory = 'stake-your-nfts.moopaloo.testnet';

// Initialize contract & set global variables
export async function initContract() {
  // Initialize connection to the NEAR testnet
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig))

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new WalletConnection(near)

  // Getting the Account ID. If still unauthorized, it's just empty string
  window.accountId = window.walletConnection.getAccountId()


}

export function logout() {
  window.walletConnection.signOut()
  // reload page
  window.location.replace(window.location.origin + window.location.pathname)
}

export function login() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(nearConfig.contractName)
}

export async function addNft({ DAOAddress, StakingContractName, NFTVoteMap }) {
  //Code to initialize staking contract with nfts if needed
  //then add NFT
  // Initializing our contract APIs by contract name and configuration
  window.daoContract = await new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: [''],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: [''],
  })
  window.stakingContractFactory = await new Contract(
    window.walletConnection.account(),
  );
}

export function createTokenWeightCouncil({ CouncilName }) {

}

export function createVoteProposal({ ProposalDescription }, callback) {
  callback(-1); // TODO: Callback ProposalNumber
}

export function vote({ VoteCount, ProposalNumber }) {

}

export function getTotalOwnedVotes({ StakingContractName }) {
  return -1; // TODO: implement this
}

export function getProposal({ ProposalNumber, StakingContractName }) {

}