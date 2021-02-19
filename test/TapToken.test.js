// Load dependencies
const { expect } = require('chai');

// Import utilities from Test Helpers
const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');

// Load compiled artifacts
const Hyp = artifacts.require('HypToken');

const Web3 = require('web3');

// Start test block
contract('Hyp', function ([ owner, other ]) {

  const cap = new BN('100000000');
  const initialSupply = new BN('50000000');

  beforeEach(async function () {
    this.hyp = await Hyp.new('Hypmydata', 'HYP', cap);
    await this.hyp.mint(owner, initialSupply);
  });

  it('has correct initial supply', async function () {
    // Store a value
    expect((await this.hyp.totalSupply()).toString()).to.equal(initialSupply.toString());
  });

  it('can mint more tokens', async function () {
    // Store a value
    await this.hyp.mint(owner, initialSupply);
    expect((await this.hyp.totalSupply()).toString()).to.equal(cap.toString());
  });

  it('can not mint beyond cap', async function () {
    // Store a value
    await expectRevert(
      this.hyp.mint(owner, cap),
      "ERC20Capped: cap exceeded"
    );
  });

  it('can burn tokens', async function () {
    const toBurn = new BN('20000000');
    const newSupply = new BN('30000000');
    await this.hyp.burn(toBurn);
    expect((await this.hyp.totalSupply()).toString()).to.equal(newSupply.toString());
  });

  it('has correct name', async function () {
    // Store a value
    expect(await this.hyp.name()).to.equal('Hypmydata');
  });

  it('has correct symbol', async function () {
    // Store a value
    expect(await this.hyp.symbol()).to.equal('HYP');
  });

  it('can transfer tokens', async function() {
    await this.hyp.transfer(other, 1000);
    expect((await this.hyp.balanceOf(other)).toString()).to.equal("1000");
  });

  it('can block transfer to recipient', async function() {
    const web3Receipt = await this.hyp.blockAccount(other);

    await expectEvent(
      web3Receipt,
      "Blocked",
      [ other ]
    );

    await expectRevert(
      this.hyp.transfer(other, 1000),
      "ERC20Blockable: token transfer rejected. Receiver is blocked."
    );
    expect((await this.hyp.balanceOf(other)).toString()).to.equal("0");
  });

  it('can block transfer from sender', async function() {
    await this.hyp.transfer(other, 1000);
    newBalance = await this.hyp.balanceOf(owner);
    await this.hyp.blockAccount(other);
    await expectRevert(
      this.hyp.transfer(owner, 1000, {from: other}),
      "ERC20Blockable: token transfer rejected. Sender is blocked."
    );
    expect((await this.hyp.balanceOf(owner)).toString()).to.equal(newBalance.toString());
  });

  it('can unblock account', async function() {
    await this.hyp.blockAccount(other);
    const web3Receipt = await this.hyp.unBlockAccount(other);
    await expectEvent(
      web3Receipt,
      "UnBlocked",
      [ other ]
    );

    await this.hyp.transfer(other, 1000);
    expect((await this.hyp.balanceOf(other)).toString()).to.equal("1000");
  });
  
  it('can only be blocked by blocker role account', async function() {
    await expectRevert(
      this.hyp.blockAccount(owner, {from: other}),
      "ERC20Blockable: must have blocker role to block."
    );
  });

  it('can assign blocker role', async function() {
    const role = Web3.utils.keccak256("BLOCKER_ROLE");
    const web3Receipt = await this.hyp.grantRole(role, other);
    await expectEvent(
      web3Receipt,
      "RoleGranted",
      [ role, other, owner ]
    );
    const account_to_block = '0xcb0510D1c4eA88CcD1F2395D075Af9e831C2F15d';
    await this.hyp.blockAccount(account_to_block, {from: other});
    expect(await this.hyp.isBlocked(account_to_block)).to.equal(true);
  });

  it('can be paused', async function () {
    await this.hyp.transfer(other, 1000);
    expect((await this.hyp.balanceOf(other)).toString()).to.equal("1000");

    // Pause the contract
    const web3Receipt = await this.hyp.pause();
    await expectEvent(
      web3Receipt,
      "Paused",
      [ owner ]
    );

    await expectRevert(
      this.hyp.transfer(other, 1000),
      "ERC20Pausable: token transfer while paused"
    );

    expect((await this.hyp.balanceOf(other)).toString()).to.equal("1000");
  });

  it('can only be paused by pauser role', async function () {
    await expectRevert(
      this.hyp.pause({from: other}),
      "ERC20PresetMinterPauser: must have pauser role to pause"
    );
  });

  it('can be un-paused', async function () {
    await this.hyp.pause();

    await expectRevert(
      this.hyp.transfer(other, 1000),
      "ERC20Pausable: token transfer while paused"
    );

    const web3Receipt = await this.hyp.unpause();
    await expectEvent(
      web3Receipt,
      "Unpaused",
      [ owner ]
    );

    await this.hyp.transfer(other, 1000);
    expect((await this.hyp.balanceOf(other)).toString()).to.equal("1000");
  });

  it('can only be un-paused by pauser role', async function () {
    await expectRevert(
      this.hyp.unpause({from: other}),
      "ERC20PresetMinterPauser: must have pauser role to unpause"
    );
  });

});
