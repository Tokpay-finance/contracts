# contracts
This repo holds the TBILL vault contract and the TBILL staking token developed with solidity and hardhat, it has the deployment and verification functionalities



## Hardhat Configuration

The Hardhat configuration file is `hardhat.config.js`. It includes settings for the Solidity compiler, networks, and any additional plugins used in the project. Environment variables are managed using the `dotenv` package.

## Setup

1. **Install Dependencies:**

   ``` bash
   npm install

   ```

## Create Environment Variables:

Create a .env file in the project root with the following content:

```bash
PRIVATE_KEY="your private key "
API_URL="your Alchemy API key here"
```
Replace the placeholder values with your actual Celo wallet private key and Infura/Alchemy API key for http rpc.

## Compile Contracts:

```bash
npx hardhat compile
```

## Run test

```bash
npx hardhat test
```

## Deployment
To deploy the Answerly token contract:

```bash
npx hardhat run scripts/deploy.js --network celo
```
Make sure you have the Hardhat node running (npx hardhat node) if deploying to the local network.

To verify run this command

```shell
npx hardhat verify --network celo  0x7808B151F869F7Ab6f9653742A199F22c185b980
```

this comand takes the nertwork, contract address and the time of deployment.
