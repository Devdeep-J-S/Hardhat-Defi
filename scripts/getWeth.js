const { getNamedAccounts, network } = require("hardhat");
const { networkConfig } = require("../helper-hardhat-config");

const AMOUNT = ethers.utils.parseEther("0.01");
async function getWeth() {
  const { deployer } = await getNamedAccounts();
  // call deposit() on the WETH contract
  // to get some ETH into the contract
  // get abi and address from the WETH contract
  const signer = await ethers.getSigner(deployer);
  const iWeth = await ethers.getContractAt(
    "IWeth",
    networkConfig[network.config.chainId].wethToken,
    signer
  );
  const transaction = await iWeth.deposit({
    value: AMOUNT,
  });
  await transaction.wait();
  console.log("WETH deposited");
  const wethBalace = await iWeth.balanceOf(deployer);
  console.log(
    "WETH balance in ETH: ",
    ethers.utils.formatEther(wethBalace),
    ", WETH: ",
    wethBalace.toString()
  );
}

module.exports = { getWeth, AMOUNT };
