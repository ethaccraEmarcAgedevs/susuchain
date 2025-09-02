import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

const deployContracts: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  console.log("Deploying SusuChain contracts with the account:", deployer);

  // Deploy SusuToken first
  const susuTokenDeployment = await deploy("SusuToken", {
    from: deployer,
    args: [deployer], // owner
    log: true,
    autoMine: true,
  });

  console.log("SusuToken deployed to:", susuTokenDeployment.address);

  // Deploy SusuFactory
  const susuFactoryDeployment = await deploy("SusuFactory", {
    from: deployer,
    args: [deployer], // owner
    log: true,
    autoMine: true,
  });

  console.log("SusuFactory deployed to:", susuFactoryDeployment.address);

  // Get the deployed contracts
  const susuToken: Contract = await hre.ethers.getContract("SusuToken", deployer);
  const susuFactory: Contract = await hre.ethers.getContract("SusuFactory", deployer);

  // Authorize the factory to mint tokens when groups are created
  console.log("Authorizing SusuFactory as a minter...");
  const authorizeTx = await susuToken.authorizeMinter(susuFactory.target || susuFactory.address);
  await authorizeTx.wait();

  console.log("✅ All contracts deployed and configured successfully!");
  console.log("SusuToken address:", susuToken.target || susuToken.address);
  console.log("SusuFactory address:", susuFactory.target || susuFactory.address);
};

export default deployContracts;

deployContracts.tags = ["SusuToken", "SusuFactory"];
