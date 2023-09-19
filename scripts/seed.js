// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");
const config = require('../src/config.json')

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens
const shares = ether

async function main() {
  // Fetch accounts
  console.log('Fetching accounts & network \n')
  const accounts = await ethers.getSigners()
  const deployer = accounts[0]
  const investor1 = accounts[1]
  const investor2 = accounts[2]
  const investor3 = accounts[3]
  const investor4 = accounts[4]

  // Fetch Network
  const { chainId } = await ethers.provider.getNetwork()

  console.log(`Fetching token and transferring accounts...\n`)

  // Fetch Lasse Token
  const lasse = await ethers.getContractAt('Token', config[chainId].lasse.address)
  console.log(`Lasse Token fetched: ${lasse.address}\n`)

  const usd = await ethers.getContractAt('Token', config[chainId].usd.address)
  console.log(`USD Token fetched: ${usd.address}\n`)

  //////////////////////////////////////////////////////////////////////
  // Distribute Tokens to Investors
  //

  let transaction

  // Send lasse tokens to investors 1 and 3
  transaction = await lasse.connect(deployer).transfer(investor1.address, tokens(10))
  await transaction.wait()

  transaction = await lasse.connect(deployer).transfer(investor3.address, tokens(10))
  await transaction.wait()

  // Send usd tokens to investors 2 and 4
  transaction = await usd.connect(deployer).transfer(investor2.address, tokens(10))
  await transaction.wait()

  transaction = await usd.connect(deployer).transfer(investor4.address, tokens(10))
  await transaction.wait()


  //////////////////////////////////////////////////////////////////////
  // Adding Liquidity
  //

  let amount = tokens(100)

  console.log(`Fetching AMM...\n`)

  // Fetch AMM
  const amm = await ethers.getContractAt('AMM', config[chainId].amm.address)
  console.log(`AMM fetched: ${amm.address}\n`)

  transaction = await lasse.connect(deployer).approve(amm.address, amount)
  await transaction.wait()

  transaction = await usd.connect(deployer).approve(amm.address, amount)
  await transaction.wait()

  // Deployer adds liquidity
  console.log(`Adding liquidity...\n`)
  transaction = await amm.connect(deployer).addLiquidity(amount, amount)
  await transaction.wait()


  //////////////////////////////////////////////////////////////////////
  // Investor 1 Swaps: LASSE --> USD
  //

  console.log(`Investor 1 Swaps...\n`)

  // Investor approves all tokens
  transaction = await lasse.connect(investor1).approve(amm.address, tokens(10))
  await transaction.wait()

  // Investor swaps 1 token
  transaction = await amm.connect(investor1).swapToken1(tokens(1))
  await transaction.wait()


  //////////////////////////////////////////////////////////////////////
  // Investor 2 Swaps: USD --> LASSE
  //

  console.log(`Investor 2 Swaps...\n`)

  // Investor approves all tokens
  transaction = await usd.connect(investor2).approve(amm.address, tokens(10))
  await transaction.wait()

  // Investor swaps 1 token
  transaction = await amm.connect(investor2).swapToken2(tokens(1))
  await transaction.wait()


  //////////////////////////////////////////////////////////////////////
  // Investor 3 Swaps: LASSE --> USD
  //

  console.log(`Investor 3 Swaps...\n`)

  // Investor approves all tokens
  transaction = await lasse.connect(investor3).approve(amm.address, tokens(10))
  await transaction.wait()

  // Investor swaps all 10 tokens
  transaction = await amm.connect(investor3).swapToken1(tokens(10))
  await transaction.wait()


  //////////////////////////////////////////////////////////////////////
  // Investor 4 Swaps: USD --> LASSE
  //

  console.log(`Investor 4 Swaps...\n`)

  // Investor approves all tokens
  transaction = await usd.connect(investor4).approve(amm.address, tokens(10))
  await transaction.wait()

  // Investor swaps 5 tokens
  transaction = await amm.connect(investor4).swapToken2(tokens(5))
  await transaction.wait()

  console.log(`Finished.`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
