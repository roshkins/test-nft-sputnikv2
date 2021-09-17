import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout, addNFT, createTokenWeightCouncil, vote, createVoteProposal, getTotalOwnedVotes, getProposal } from './utils'
import './global.css'
import TextComponent from './TextComponent'

import getConfig from './config'
const { networkId } = getConfig(process.env.NODE_ENV || 'development')


export default function App() {

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  const [DAOAddress, setDAOAddress] = React.useState();
  const [StakingContractName, setStakingContractName] = React.useState();
  const [NFTVoteMap, setNFTVoteMap] = React.useState();
  const [ProposalDescription, setProposalDescription] = React.useState();

  const [ProposalStatus, setProposalStatus] = React.useState();

  const [CouncilName, setCouncilName] = React.useState();
  const [VoteCount, setVoteCount] = React.useState();
  const [TotalOwnedVotes, setTotalOwnedVotes] = React.useState(0);
  const [ProposalNumber, setProposalNumber] = React.useState();

  React.useEffect(() => {
    setTotalOwnedVotes(getTotalOwnedVotes({ StakingContractName }));
    setProposalStatus(getProposal({ ProposalNumber, StakingContractName }));
  }, [ProposalNumber]);

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

        Create and setup your DAO here: <a target="_blank" href="https://testnet-v2.sputnik.fund/">testnet-v2.sputnik.fund</a>
        <form>
          <TextComponent name="DAOAddress" value={DAOAddress} label="DAO Address" callback={setDAOAddress} />
          <TextComponent name="StakingContractName" value={StakingContractName} label="Staking Contract Name (Will create if it doesn't exist, will append .stake-your-nfts.moopaloo.testnet)" callback={setStakingContractName} />
          <TextComponent name="NFTVoteMap" value={NFTVoteMap} label='Mapping of NFTs to Vote Weights (Syntax:"NFT_NAME:4,")' placeholder="NEARpunk:4," callback={setNFTVoteMap} />
          <button onClick={() => addNFT({ DAOAddress, StakingContractName, NFTVoteMap })}>Setup NFTs in new contract and propose to associate with DAO </button>
        </form>
        Approve above proposal and make sure you have the nft mentioned above in your wallet.
        <form>
          <TextComponent name="CouncilName" value={CouncilName} label="New Council Name" callback={setCouncilName} />
          <button onClick={() => createTokenWeightCouncil(CouncilName)}>Create council using TokenWeight rather than UserWeight. Will break UI.</button>
        </form>
        <form>
          <TextComponent name="ProposalDescription" value={ProposalDescription} label="Proposal Description" callback={setProposalDescription} />
          <button onClick={() => createVoteProposal({ ProposalDescription }, (ProposalNumber) => setProposalNumber(ProposalNumber))}>Create Vote Proposal</button>
        </form>
        <form>
          Proposal status: {ProposalStatus}
          <TextComponent name="VoteCount" value={VoteCount} label={`Of ${TotalOwnedVotes}, how many would you like to use here?`} callback={setVoteCount} />

          <button onClick={() => vote({ VoteCount, ProposalNumber })}>Vote YES using votes from staked NFT</button>
          <button onClick={() => vote({ VoteCount: -1 * VoteCount, ProposalNumber })}>Vote NO using votes from staked NFT</button>
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
