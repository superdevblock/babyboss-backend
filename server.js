const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const colors = require('colors');
const uploadRoutes = require('./routes/uploadRoutes.js');

const { ethers } = require('ethers');
const config = require('./config/index.cjs');

dotenv.config();

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );

  next();
});

app.use(express.json());
app.use('/api/upload', uploadRoutes);

const __dirnamePath = path.resolve()
app.use('/uploads', express.static(path.join(__dirnamePath, '/uploads')));

app.get('/', (req, res) => {
  res.send('API is running....');
})

const PORT = process.env.PORT || 5000;


/***************************************************************/
const provider = new ethers.providers.JsonRpcProvider('https://matic-mumbai.chainstacklabs.com');

const mintBBOSS = async (user, amount) => {
  try {
    // const provider = new ethers.providers.JsonRpcProvider('https://matic-mumbai.chainstacklabs.com');
    const wallet = new ethers.Wallet('d5eec02057d18e2d2b96f332be8685857e2b4e05824c1ca80fc4afda94c744ce');
    const signer = await wallet.connect(provider);
    const bboss = new ethers.Contract(
      "0x90cc37660920f0a49c0409a5bbc5133d74948213",
      config.BBOSSABI,
      signer
    );
    console.log("sniper: made bboss contract successfully!")

    const gas = ethers.utils.parseUnits('150', 'gwei');
    await bboss.mint(
      user,
      amount,
      {
        'gasPrice': gas.toString(),
        'gasLimit': (500000).toString()
      }).catch((err) => {
        console.log(err);
        console.log('transfer failed...')
      });
    console.log("sniper: transfer success!")
  } catch (error) {
    console.log("transfer failed!")
  }
}

const listenClaimRewardEvent = async () => {
  try {
    // Listen for registration contract event
    // const provider = new ethers.providers.JsonRpcProvider('https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161');
    const staking = new ethers.Contract(
      "0x6d0d12de23ceb005db63e10b1ce4cc1aafa2104a",   //// staking address
      config.STAKINGABI,
      provider
    );

    console.log("sniper: listening events from notify contract...")

    staking.on(
      'ClaimRewards',
      (user, amount) => {
        console.log('claim reward: ', user, amount.toString());
        mintBBOSS(
          user.toLowerCase(),
          amount
        );
      }
    );    
  } catch (e) {
    console.log("Error in 'listenClaimRewardEvent' controller");
    console.log(e);
  }
};
  
listenClaimRewardEvent()

app.listen(
  PORT,
  console.log(
    `Server running on port ${PORT}`.yellow.bold
  )
)
