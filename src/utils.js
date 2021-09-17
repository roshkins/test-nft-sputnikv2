import { connect, Contract, keyStores, WalletConnection, utils } from 'near-api-js'
import getConfig from './config'

const nearConfig = getConfig(process.env.NODE_ENV || 'development')
const StakingFactory = 'stake-your-nfts.moopaloo.testnet';

// Initialize contract & set global variables
export async function initContract() {

  const keyStore = new keyStores.BrowserLocalStorageKeyStore();
  // Initialize connection to the NEAR testnet
  window.near = await connect(Object.assign({ deps: { keyStore } }, nearConfig))


  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new WalletConnection(near)

  // Getting the Account ID. If still unauthorized, it's just empty string
  window.accountId = window.walletConnection.getAccountId()
  window.keyId = (await keyStore.getKey(nearConfig.networkId, window.accountId)).getPublicKey().toString();

  window.stakingContractFactory = await new Contract(
    window.walletConnection.account(), StakingFactory,
    {
      viewMethods: [''],
      changeMethods: ['create'],
    }
  );

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
  window.walletConnection.requestSignIn(StakingFactory);
}

export function connectToDao({ DAOAddress }) {
  window.walletConnection.requestSignIn(DAOAddress);
}

export async function addNFT({ DAOAddress, StakingContractName, NFTVoteMap }) {
  //Code to initialize staking contract with nfts if needed
  //then add NFT
  // Initializing our contract APIs by contract name and configuration


  //Convert NFTVoteMap string to object
  const token_ids_with_vote_weights = NFTVoteMap.split(',').
    map(elm => elm.trim().split(':').
      map(e => e.trim())).
    reduce((prev, curr) => {
      prev[curr[0]] = prev[curr[0]] || 0;
      prev[curr[0]] = String(prev[curr[0]] + Number(curr[1]));
      return prev;
    }, {})

  const initArgs = {
    "owner_id": DAOAddress,
    token_ids_with_vote_weights,
    "unstake_period": "1000000000",
  };
  const createArgs = {
    "name": StakingContractName,
    "public_key": window.keyId,
    "args": window.btoa(JSON.stringify(initArgs))
  }
  console.log('createArgs', createArgs)
  await window.stakingContractFactory.create({ ...createArgs }, 300000000000000, utils.format.parseNearAmount("5"))

}

export async function proposeStakingContract({ DAOAddress, StakingContractName }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: [''],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['add_proposal'],
  })

  const stakingContractAddress = `${StakingContractName}.stake-your-nfts.moopaloo.testnet`;

  await daoContract.add_proposal({ proposal: { description: "Add NFT staking contract", kind: { "SetStakingContract": { staking_id: stakingContractAddress } } } }, 300000000000000, utils.format.parseNearAmount("5"))
}

export async function createTokenWeightCouncil({ CouncilName: name }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['get_policy'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['add_proposal'],
  })
  let policy = await daoContract.get_policy();
  policy.roles.push({
    name,
    kind: { "Member": "1" },
    permissions: ["*:AddProposal",
      "*:VoteApprove",
      "*:VoteReject"]
  })
  await daoContract.add_proposal({
    proposal: {
      description: `Add ${CouncilName} with TokenWeight`, kind: {
        "ChangePolicy": {
          policy
        }
      }
    }
  }, 300000000000000, utils.format.parseNearAmount("5"))

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