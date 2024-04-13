const {
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { expect } = require("chai");
const { ethers } = require("hardhat");
  

  describe("Token contract", function () {
    async function deployTokenFixture() {
      const [owner, recipient, pleb0, pleb1, pleb2] = await ethers.getSigners();
  
      const contribution = ethers.parseEther("1.0");
      const targetAmount = ethers.parseEther("3.0");

      const Token = await ethers.getContractFactory("Token");
      const token = await Token.deploy(contribution,recipient,targetAmount);
        
      // Fixtures can return anything you consider useful for your tests
      return { token, contribution, targetAmount, owner, recipient, pleb0, pleb1, pleb2};
    }
  
    describe("Deployment", function () {
        it("Should assign the minimum contribution, recipient and target amount correctly", async function () {
            const { token, contribution, targetAmount,recipient} = await loadFixture(deployTokenFixture);
        
            expect(contribution).to.equal(await token.minimumContribution());
            expect(targetAmount).to.equal(await token.contractTargetAmount());
            expect(recipient).to.equal(await token.recipientAddress());
          });      
    })
    
    describe("Funding", function () {

        it("Should revert transactions below the minimum amount", async function () {
          const { token, pleb0} = await loadFixture(deployTokenFixture);

          await expect(pleb0.sendTransaction({to: token.target,value: ethers.parseEther("1.5")})).to.not.be.revertedWith("Ether value below minimum contribution");
          await expect(pleb0.sendTransaction({to: token.target,value: ethers.parseEther("0.5")})).to.be.reverted;
        })

        it("Should revert transactions after the payment goal has been reached", async function () {
          const { token, pleb0, pleb1} = await loadFixture(deployTokenFixture);

          await pleb0.sendTransaction({
            to: token.target,
            value: ethers.parseEther("1.0")
          });

          await pleb1.sendTransaction({
            to: token.target,
            value: ethers.parseEther("2.0")
          });

          await expect(pleb0.sendTransaction({to: token.target,value: ethers.parseEther("1.5")})).to.be.revertedWith("Target balance will be exceeded");

        })

        it("Should keep track of the funds provided by the plebs", async function () {
            const { token, pleb0, pleb2} = await loadFixture(deployTokenFixture);
            
            await pleb0.sendTransaction({
              to: token.target,
              value: ethers.parseEther("1.0")
            });

            await pleb0.sendTransaction({
              to: token.target,
              value: ethers.parseEther("1.0")
            });

            await pleb2.sendTransaction({
              to: token.target,
              value: ethers.parseEther("1.0")
            });

            expect(await token.participantContribution(pleb0)).to.equal(ethers.parseEther("2.0"));
            expect(await token.participantContribution(pleb2)).to.equal(ethers.parseEther("1.0"));
        });

        it("Should return 0 for addresses that have not contributed ether to the address", async function () {
          const { token, pleb0} = await loadFixture(deployTokenFixture);
            
          expect(await token.participantContribution(pleb0)).to.equal(ethers.parseEther("0.0"));
        })
    })

    describe("Transaction Execution", function () {

      it("Transaction execution should fail if target amount has not been raised", async function () {
        const { token, pleb0} = await loadFixture(deployTokenFixture);

        await pleb0.sendTransaction({
          to: token.target,
          value: ethers.parseEther("1.0")
        });

        await expect(token.executeTransaction()).to.be.reverted;
      })

      it("Transaction execution should succeed if target amount has been raised", async function () {
        const { token, pleb0, pleb1, pleb2} = await loadFixture(deployTokenFixture);

        await pleb0.sendTransaction({
          to: token.target,
          value: ethers.parseEther("1.0")
        });

        await pleb1.sendTransaction({
          to: token.target,
          value: ethers.parseEther("1.0")
        });

        await pleb2.sendTransaction({
          to: token.target,
          value: ethers.parseEther("1.0")
        });

        await expect(token.executeTransaction()).to.not.be.reverted;
      })
    })
  });