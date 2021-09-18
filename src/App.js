import 'regenerator-runtime/runtime'
import React from 'react'
import { approveNft, login, logout, addNFT, createTokenWeightCouncil, vote, createVoteProposal, getProposal, connectToDao, proposeStakingContract, nftTransferCall, registerSender } from './utils'
import './global.css'
import TextComponent from './TextComponent'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')


export default function App() {

  function useStickyState(defaultValue, key) {
    const [value, setValue] = React.useState(() => {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null
        ? JSON.parse(stickyValue)
        : defaultValue;
    });
    React.useEffect(() => {
      window.localStorage.setItem(key, JSON.stringify(value));
    }, [key, value]);
    return [value, setValue];
  }

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  const [DAOAddress, setDAOAddress] = useStickyState("", "DAOAddress");
  const [StakingContractName, setStakingContractName] = useStickyState("", "StakingContractName");
  const [NFTVoteMap, setNFTVoteMap] = useStickyState("", "NFTVoteMap");
  const [ProposalDescription, setProposalDescription] = useStickyState("", "ProposalDescription");

  const [ProposalStatus, setProposalStatus] = useStickyState("", "ProposalStatus");

  const [CouncilName, setCouncilName] = useStickyState("", "CouncilName");

  const [ProposalNumber, setProposalNumber] = useStickyState("", "ProposalNumber");
  const [TokenAddress, setTokenAddress] = useStickyState("", "TokenAddress");
  const [TokenId, setTokenId] = useStickyState("", "TokenId");

  const [ApprovalId, setApprovalId] = useStickyState("", "ApprovalId");

  const getAndSetProposal = async (prop) => {
    setProposalNumber(prop)
    setProposalStatus(JSON.stringify(await getProposal({ ProposalNumber: prop, DAOAddress })))
  }
  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {
      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )



  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <h1>Welcome to NEAR!</h1>
        <p>
          To make use of the NEAR blockchain, you need to sign in. The button
          below will sign you in using NEAR Wallet.
        </p>
        <p>
          By default, when your app runs in "development" mode, it connects
          to a test network ("testnet") wallet. This works just like the main
          network ("mainnet") wallet, but the NEAR Tokens on testnet aren't
          convertible to other currencies – they're just for testing!
        </p>
        <p>
          Go ahead and click the button below to try it out:
        </p>
        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>
        <h1>
          <label
            htmlFor="greeting"
            style={{
              color: 'var(--secondary)',
              borderBottom: '2px solid var(--secondary)'
            }}
          >

          </label>
          {' '/* React trims whitespace around tags; insert literal space character when needed */}
          Stake your NFT here,{' '} {window.accountId}!
        </h1>

        Create and setup your DAO here when sputnikv2 is updated to support tokenweights: <a target="_blank" href="https://testnet-v2.sputnik.fund/">testnet-v2.sputnik.fund</a><br />
        Otherwise use sputnikr2v2.moopaloo.testnet with a locally deployed instance of <a target="_blank" href="https://github.com/roshkins/Old-Sputnikv2-UI"> https://github.com/roshkins/Old-Sputnikv2-UI </a>
        <form>
          <TextComponent name="DAOAddress" value={DAOAddress} label="DAO Address" callback={setDAOAddress} />
          <button onClick={(e) => { e.preventDefault(); connectToDao({ DAOAddress }); }}>Connect to DAO</button>
          <TextComponent name="StakingContractName" value={StakingContractName} label="Staking Contract Name (Will create if it doesn't exist, will append .stake-your-nfts.moopaloo.testnet)" callback={setStakingContractName} />
          <TextComponent name="NFTVoteMap" value={NFTVoteMap} label='Mapping of NFTs to Vote Weights (Syntax:"NFT_NAME:4,")' placeholder="NEARpunk:4," callback={setNFTVoteMap} />
          <button onClick={async (e) => { e.preventDefault(); await addNFT({ DAOAddress, StakingContractName, NFTVoteMap }) }}>Setup NFTs in new contract </button>
          <button onClick={async (e) => { e.preventDefault(); proposeStakingContract({ DAOAddress, StakingContractName }) }}> Propose to associate with DAO</button>
          <button onClick={async (e) => { e.preventDefault(); await registerSender({ StakingContractName }) }}>Register sender address with staking contract</button>

        </form>
        Approve above proposal and make sure you have the nft mentioned above in your wallet.
        <TextComponent name="TokenAddress" value={TokenAddress} label="Token Contract Address" callback={setTokenAddress} />
        <TextComponent name="TokenId" value={TokenId} label="Token Id" callback={setTokenId} />
        <button onClick={async (e) => { e.preventDefault(); await approveNft({ TokenAddress, TokenId, StakingContractName }); }}> Approve NFT for transfer to staking contract </button>
        <TextComponent name="ApprovalId" value={ApprovalId} label="Approval Id" callback={setApprovalId} />
        <button onClick={async (e) => { e.preventDefault(); await nftTransferCall({ StakingContractName, TokenAddress, TokenId, ApprovalId }) }}> Transfer NFT and call Staking Contract </button>
        <form>
          <TextComponent name="CouncilName" value={CouncilName} label="New Council Name" callback={setCouncilName} />
          <button onClick={async (e) => { e.preventDefault(); await createTokenWeightCouncil({ DAOAddress, CouncilName }) }}>Create council using TokenWeight rather than UserWeight.</button>
        </form>
        <form>
          <TextComponent name="ProposalDescription" value={ProposalDescription} label="Proposal Description" callback={setProposalDescription} />
          <button onClick={async (e) => { e.preventDefault(); await createVoteProposal({ DAOAddress, ProposalDescription }) }}>Create Vote Proposal</button>
        </form>
        <form>
          <TextComponent name="ProposalNumber" label="Proposal Number to vote on" value={ProposalNumber} callback={getAndSetProposal} />
          Proposal: {ProposalStatus}
          <button onClick={(e) => { e.preventDefault(); vote({ DAOAddress, VoteCount: +1, ProposalNumber }) }}>Vote YES using votes from staked NFT</button>
          <button onClick={(e) => { e.preventDefault(); vote({ DAOAddress, VoteCount: -1, ProposalNumber }) }}>Vote NO using votes from staked NFT</button>
        </form>
      </main>
      {showNotification && <Notification />}
    </>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'set_greeting' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
