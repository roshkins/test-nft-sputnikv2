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
  if (window.accountId)
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

const STAKING_FACTORY = "stake-your-nfts.moopaloo.testnet"
export async function proposeStakingContract({ DAOAddress, StakingContractName }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: [''],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['add_proposal'],
  })

  const stakingContractAddress = `${StakingContractName}.${STAKING_FACTORY}`;

  await daoContract.add_proposal({ proposal: { description: `Add NFT staking contract ${stakingContractAddress}`, kind: { "SetStakingContract": { staking_id: stakingContractAddress } } } }, 300000000000000, utils.format.parseNearAmount("5"))
}

export async function createTokenWeightCouncil({ DAOAddress, CouncilName }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['get_policy'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['add_proposal'],
  })
  let policy = await daoContract.get_policy();
  const tokenPolicy = {
    weight_kind: "TokenWeight",
    quorum: "0",
    threshold: "1"
  };
  policy.roles.push({
    "name": CouncilName,
    kind: { "Member": "1" },
    permissions: ["*:AddProposal",
      "*:VoteApprove",
      "*:VoteReject"],
    vote_policy: {
      "*": tokenPolicy
    }
  })
  policy.default_vote_policy = tokenPolicy;

  console.log("policy", policy);
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

export async function createVoteProposal({ DAOAddress, ProposalDescription }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: [''],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['add_proposal'],
  })

  const proposal = { "description": ProposalDescription, "kind": "Vote" };
  console.log("proposal", proposal);
  await daoContract.add_proposal({ proposal }, 300000000000000, utils.format.parseNearAmount("5"));
}

export async function vote({ VoteCount, ProposalNumber, DAOAddress }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: [''],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['act_proposal'],
  })
  return await daoContract.act_proposal({ id: parseInt(ProposalNumber), action: VoteCount > 0 ? "VoteApprove" : "VoteReject", memo: "" })
}

export async function getProposal({ ProposalNumber, DAOAddress }) {
  const daoContract = new Contract(window.walletConnection.account(), DAOAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['get_proposals'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: [''],
  })
  return await daoContract.get_proposals({ from_index: parseInt(ProposalNumber), limit: 1 })
}

export async function nftTransferCall({ StakingContractName, TokenAddress, TokenId, ApprovalId }) {
  const nftContract = new Contract(window.walletConnection.account(), TokenAddress, {
    changeMethods: ['nft_transfer_call']
  })

  const stakingContractAddress = `${StakingContractName}.${STAKING_FACTORY}`;

  const args = {
    "receiver_id": stakingContractAddress,
    "token_id": TokenId,
    "approval_id": parseInt(ApprovalId),
    "memo": "",
    "msg": ""
  };

  await nftContract.nft_transfer_call(args, 300000000000000, 1)
}

export async function registerSender({ StakingContractName }) {
  const stakingContractAddress = `${StakingContractName}.${STAKING_FACTORY}`;

  const nftContract = new Contract(window.walletConnection.account(), stakingContractAddress, {
    changeMethods: ['storage_deposit']
  })


  const args = {
    "account_id": window.walletConnection.getAccountId(),
    "registration_only": true
  };

  await nftContract.storage_deposit(args, 300000000000000, utils.format.parseNearAmount("5"))
}

export async function approveNft({ TokenAddress, TokenId, StakingContractName }) {
  const nftContract = new Contract(window.walletConnection.account(), TokenAddress, {
    changeMethods: ['nft_approve']
  })

  const stakingContractAddress = `${StakingContractName}.${STAKING_FACTORY}`;

  const args = { "token_id": TokenId, "account_id": stakingContractAddress };
  await nftContract.nft_approve(args, 300000000000000, utils.format.parseNearAmount("5"))

}

export async function getApprovalNumber({ StakingContractName, TokenAddress, TokenId }) {
  if (TokenId.length < 1) return null;
  const nftContract = new Contract(window.walletConnection.account(), TokenAddress, {
    viewMethods: ['nft_token'],
    changeMethods: ['']
  })

  const stakingContractAddress = `${StakingContractName}.${STAKING_FACTORY}`;

  const args = { "token_id": TokenId };
  console.log("Token Args", args);
  const token = await nftContract.nft_token(args);
  console.log("Token", token);
  return token.approved_account_ids[stakingContractAddress] === undefined ? null : token.approved_account_ids[stakingContractAddress];
}

export async function delegateVotes({ StakingContractName, TokenId }) {
  const stakingContractAddress = `${StakingContractName}.${STAKING_FACTORY}`;

  const stakingContract = new Contract(window.walletConnection.account(), stakingContractAddress, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: [''],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['delegate'],
  })

  const args = { "account_id": window.walletConnection.getAccountId(), "token_id": TokenId, "amount": "1" }
  stakingContract.delegate(args, 300000000000000, utils.format.parseNearAmount("0"))
}