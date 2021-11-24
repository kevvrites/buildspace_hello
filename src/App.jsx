import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';
import abi from "./utils/GreetPortal.json"

const App = () => {
  /*
  * Just a state variable to store user's public key
  */
  let totalGreetings = 0;
  const [currentAccount, setCurrentAccount] = useState("");

  const [allGreetings, setAllGreetings] = useState([]);
  const contractAddress = "0x26cd2a001053001256edB5150A7e045a418c5De5";
  
  const contractABI = abi.abi

  const getAllGreetings = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const greetPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const greetings = await greetPortalContract.getAllGreetings();

        let greetingsCleaned = [];
        greetings.forEach(greet => {
          greetingsCleaned.push({
            address: greet.sender,
            timestamp: new Date(greet.timestamp * 1000),
            message: greet.message
          });
        });

        setAllGreetings(greetingsCleaned);
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let greetPortalContract;

    const onNewGreet = (from, timestamp, message) => {
      console.log('NewGreet', from, timestamp, message);
      setAllGreetings(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };
    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      greetPortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      greetPortalContract.on('NewGreet', onNewGreet);
    }

    return () => {
      if (greetPortalContract) {
        greetPortalContract.off('NewGreet', onNewGreet);
      }
    };
  }, []);

  const checkIfWalletIsConnected = async () => {
    try {
      /*
      * First make sure we have access to window.ethereum
      */
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      /*
      * Check if we're authorized to access the user wallet
      */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account)
        getAllGreetings();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /*
  *
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  /*
  * This runs our function when the page loads
  */
  useEffect(() => {
    checkIfWalletIsConnected();
  }, [])

  const greet = async () => {
    try {
      const { ethereum } = window;
      
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const greetPortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await greetPortalContract.getTotalGreetings();
        console.log("Retrieved total greetings count...", count.toNumber());

        function getGreeting() {
          const userGreeting = document.getElementById("userGreeting").value;
          return userGreeting;
        }

        const greetTxn = await greetPortalContract.greet(getGreeting(), { gasLimit: 300000});
        console.log("Mining...", greetTxn.hash);

        await greetTxn.wait();
        console.log("Mined -- ", greetTxn.hash);

        count = await greetPortalContract.getTotalGreetings();
        console.log("Retrieved total greeting count...", count.toNumber());
        totalGreetings += 1

      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div className="mainContainer">
      <div className="dataContainer">
        <div className="header">
          Hello world!
        </div>
        <div className="bio">
        I am Kevin and I'm new to the tech industry!
        </div>
        <div className="info">
        Every day, people embark on new journeys. Say hello to the new world you're exploring!
        </div>

        <input type="text" placeholder="What's cookin' good lookin'?" id="userGreeting"></input>

        <button className="greetButton" onClick={greet}>
          Hello!
        </button>

        {!currentAccount && (
          <button className="greetButton" onClick={connectWallet}>
            Connect MetaMask
          </button>
        )}
        {allGreetings.map((greet, index) => {
          return (
            <div key={index} style={{backgroundColor: "OldLace", marginTop: "16px", padding: "8px"}}>
            <div>Address: {greet.address}</div>
            <div>Time: {greet.timestamp.toString()}</div>
            <div>Message: {greet.message}</div>
          </div>)
        })}
      </div>
    </div>
  );
}

export default App