// migrations/2_deploy.js
require('dotenv').config()

var Web3 = require('web3');
const HypToken = artifacts.require("HypToken");
const one_hundred_million = Web3.utils.toWei('100000000', 'ether');

module.exports = async function (deployer, network, accounts) {
  await deployer.deploy(HypToken, 'Hypmydata', 'HYP', one_hundred_million);
  hypInstance = await HypToken.deployed();
  if(process.env.MINT_TO) {
    await hypInstance.mint(process.env.MINT_TO, one_hundred_million);
  }
};
