const { ethers, getNamedAccounts, network } = require("hardhat");
const { getWeth, AMOUNT } = require("../scripts/getWeth.js");
const { networkConfig } = require("../helper-hardhat-config");

async function main() {
  /**
   * This is all for depositing ETH
   */
  await getWeth();
  const { deployer } = await getNamedAccounts();

  // get LendingPool address
  const lendingPool = await getLendingPool(deployer);
  console.log("LendingPool address:", lendingPool.address);

  // deposit ETH
  const wethAddress = networkConfig[network.config.chainId].wethToken;

  // approve LendingPool contract to move WETH
  await approveERC20(wethAddress, lendingPool.address, AMOUNT, deployer);
  console.log("Approved LendingPool to move WETH");

  // deposit WETH
  const transaction = await lendingPool.deposit(
    wethAddress,
    AMOUNT,
    deployer,
    0 // referral code not used for this project
  );
  transaction.wait(1); // wait for 1 confirmation
  console.log("Deposited WETH");

  /**
   * Borrow DAI
   */
  let { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await getBorrowUserData(lendingPool, deployer);

  // convert ETH to DAI
  const daiEthPrice = await convertEthToDai();
  const amountToBorrow = (availableBorrowsETH.toString() * 0.5) / daiEthPrice;
  console.log("amountToBorrow: ", amountToBorrow);
  const amountToBorrowInWei = ethers.utils.parseEther(
    amountToBorrow.toString()
  );

  // after borrowing DAI
  await BorrowDai(
    lendingPool,
    networkConfig[network.config.chainId].daiToken,
    amountToBorrowInWei,
    deployer
  );
  borrowUserData = await getBorrowUserData(lendingPool, deployer);
  console.log("borrowUserData: ", borrowUserData);

  /**
   * Repay DAI
   */
  await repayDai(
    lendingPool,
    networkConfig[network.config.chainId].daiToken,
    amountToBorrowInWei,
    deployer
  );
}

// function used in main()
async function repayDai(lendingPool, daiAddress, amountToRepay, account) {
  const signer = await ethers.getSigner(account);
  await approveERC20(daiAddress, lendingPool.address, amountToRepay, account);
  const transaction = await lendingPool.repay(
    daiAddress,
    amountToRepay,
    1,
    account
  );
  await transaction.wait(1); // wait for 1 confirmation
  console.log("Repaid DAI");
}

async function BorrowDai(lendingPool, daiAddress, amountToBorrow, account) {
  const signer = await ethers.getSigner(account);
  const dai = await ethers.getContractAt("IERC20", daiAddress, signer);
  const transaction = await lendingPool.borrow(
    daiAddress,
    amountToBorrow, // in dai wei  (stablecoin)
    1, // stable interest rate
    0, // referral code not used for this project
    account
  );
  await transaction.wait(1); // wait for 1 confirmation
  console.log("Borrowed DAI");
}
async function convertEthToDai() {
  const daiEthPrice = await ethers.getContractAt(
    "AggregatorV3Interface",
    networkConfig[network.config.chainId].daiEthPriceFeed
    // deployer why not signer? because we are not going to sign any transactions just read data
  );
  const daiEthPriceResult = (await daiEthPrice.latestRoundData())[1];
  console.log("DAI/ETH price: ", daiEthPriceResult.toString());
  return daiEthPriceResult;
}

async function getBorrowUserData(lendingPool, account) {
  signer = await ethers.getSigner(account);
  const { totalCollateralETH, totalDebtETH, availableBorrowsETH } =
    await lendingPool.getUserAccountData(signer.address);
  console.log("totalCollateralETH: ", totalCollateralETH.toString());
  console.log("totalDebtETH: ", totalDebtETH.toString());
  console.log("availableBorrowETH: ", availableBorrowsETH.toString());
  return { totalCollateralETH, totalDebtETH, availableBorrowsETH };
}

async function getLendingPool(deployer) {
  const signer = await ethers.getSigner(deployer);
  const lendingPoolAddressesProvider = await ethers.getContractAt(
    "ILendingPoolAddressesProvider",
    networkConfig[network.config.chainId].lendingPoolAddressesProvider,
    signer
  );
  const lendingPoolAddress =
    await lendingPoolAddressesProvider.getLendingPool();
  const lendingPool = await ethers.getContractAt(
    "ILendingPool",
    lendingPoolAddress,
    signer
  );
  return lendingPool;
}

// approve ERC20 token for LendingPool contract --> common error resolution
async function approveERC20(contractAddress, spender, amount, account) {
  const signer = await ethers.getSigner(account);
  const erc20 = await ethers.getContractAt("IERC20", contractAddress, signer);
  const transaction = await erc20.approve(spender, amount);
  await transaction.wait(1); // wait for 1 confirmation
  console.log("Approved", spender);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
