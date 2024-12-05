import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, bsc } from '@reown/appkit/networks';

// Project configuration
const projectId = '2254fc5c0a8332caf1b8937d431e2402';
const metadata = {
  name: 'vulpes-test',
  description: 'vulpes-test.foundation',
  url: 'https://vulpes-test.foundation/',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Initialize Reown AppKit
const modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks: [mainnet, bsc],
  metadata,
  projectId,
  features: { analytics: true },
});

let userWalletAddress = null;
let metaMaskProvider = null;

// Function to initialize MetaMask provider explicitly
const initializeMetaMask = () => {
  if (window.ethereum && window.ethereum.isMetaMask) {
    metaMaskProvider = window.ethereum;
    console.log('MetaMask detected and set as the provider.');
  } else {
    console.log('MetaMask not detected. User might be on mobile.');
    // Don't throw error, just return false to indicate MetaMask isn't available
    return false;
  }
  return true;
};

// Function to update button states based on wallet connection
const updateButtonStates = (isConnected) => {
  const buttons = [
    ...document.querySelectorAll('.tab'),
    ...document.querySelectorAll('.participate-button'),
    ...document.querySelectorAll('.join-button'),
  ];
  const modalOverlay = document.querySelector('.i-modal-overlay');

  if (isConnected) {
    buttons.forEach((button) => {
      button.classList.add('btn-active');
      button.addEventListener('click', () => {
        if (modalOverlay) {
          modalOverlay.classList.remove('hidden');
          modalOverlay.style.display = 'block';
        }
      });
    });
  } else {
    buttons.forEach((button) => {
      button.classList.remove('btn-active');
      const clonedButton = button.cloneNode(true); // Clone button to remove listeners
      clonedButton.addEventListener('click', () => {
        modal.open({ view: 'Connect' });
      });
      button.parentNode.replaceChild(clonedButton, button);
    });
  }
};

// Function to check wallet connection status
const checkWalletConnection = async () => {
  if (!metaMaskProvider) {
    return; // Exit if provider isn't available
  }

  try {
    const accounts = await metaMaskProvider.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      userWalletAddress = accounts[0];
      updateButtonStates(true);

      if (!sessionStorage.getItem('walletConnected')) {
        sessionStorage.setItem('walletConnected', 'true');
        console.log('Wallet connected. Refreshing the page...');
        location.reload();
      }
    } else {
      userWalletAddress = null;
      updateButtonStates(false);
      sessionStorage.removeItem('walletConnected');
    }
  } catch (error) {
    console.log('Error checking wallet connection:', error);
    // Don't update button states on error
  }
};

// Run wallet connection check every 500ms
setInterval(checkWalletConnection, 500);

// Mapping token types to networks
const tokenNetworkMap = {
  ETH: mainnet,
  BNB: bsc,
};

const cryptoTypeSelect = document.getElementById('crypto-type');

// Event listener for network switching based on token type selection
cryptoTypeSelect.addEventListener('change', async (event) => {
  const selectedToken = event.target.value;
  const targetNetwork = tokenNetworkMap[selectedToken];

  if (targetNetwork) {
    try {
      await modal.switchNetwork(targetNetwork);
      console.log(`The network has been changed to: ${targetNetwork.name}`);
    } catch (error) {
      console.error('Error when changing the network:', error);
    }
  } else {
    console.warn('The selected token does not have a suitable network.');
  }
});

// Function to switch to the selected network explicitly
const switchToSelectedNetwork = async () => {
  const selectedToken = cryptoTypeSelect.value;
  const targetNetwork = tokenNetworkMap[selectedToken];

  if (targetNetwork) {
    try {
      await modal.switchNetwork(targetNetwork);
      console.log(`The network has been switched to: ${targetNetwork.name}`);
    } catch (error) {
      console.error('Error switching network:', error);
      throw new Error('Failed to switch network. Please try again.');
    }
  } else {
    console.warn('Selected token does not have a corresponding network.');
    throw new Error('Invalid token selection.');
  }
};

// Function to handle donations (payment process)
const donate = async () => {
  console.log('Clicked "Buy"');
  const amountEth = parseFloat(document.getElementById('donation-amount').value);

  if (!userWalletAddress) {
    alert('Please connect your wallet before making a transaction.');
    return;
  }

  if (isNaN(amountEth) || amountEth <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  try {
    // Ensure the wallet is switched to the BNB network
    const selectedToken = cryptoTypeSelect.value;
    if (selectedToken === 'BNB') {
      await modal.switchNetwork(bsc); // Ensure BNB network is selected
    }

    // Recipient address
    const paymentAddress = '0xd65cE7930413EED605Ec0f1773380Cd15946A353';

    // Convert amount to Wei
    const amountWei = `0x${(amountEth * 1e18).toString(16)}`;

    // Specify a gas limit (e.g., 21000 for simple transfers)
    const gasLimit = '0x5208'; // 21000 in hex

    // Use MetaMask explicitly for the transaction
    await metaMaskProvider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: userWalletAddress,
          to: paymentAddress,
          value: amountWei,
          gas: gasLimit, // Specify gas limit explicitly
        },
      ],
    });

    alert('Transaction successful!');
  } catch (error) {
    console.error('Transaction error:', error);
    alert(`Transaction failed: ${error.message}`);
  }
};

// Define the closeModal function
function closeModal() {
  const modalOverlay = document.querySelector('.i-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.add('hidden');
  }
}

// Attach the function to the window object to ensure global access
window.closeModal = closeModal;

// Initialize MetaMask and add click event listener to "Buy" button
document.addEventListener('DOMContentLoaded', () => {
  try {
    const hasMetaMask = initializeMetaMask();
    
    // Add buy button listener only if MetaMask is available
    if (hasMetaMask) {
      document.getElementById('buy-button')?.addEventListener('click', donate);
    }

    // Update join button listener to work with both mobile and desktop
    const joinButton = document.querySelector('.join-button');
    if (joinButton) {
      joinButton.addEventListener('click', () => {
        if (!metaMaskProvider) {
          // If MetaMask isn't available, open the modal for wallet connection
          modal.open({ view: 'Connect' });
        } else {
          // If MetaMask is available, show the modal overlay
          const modalOverlay = document.querySelector('.i-modal-overlay');
          if (modalOverlay) {
            modalOverlay.classList.remove('hidden');
            modalOverlay.style.display = 'block';
          }
        }
      });
    }
  } catch (error) {
    console.error('Initialization error:', error);
  }
});
