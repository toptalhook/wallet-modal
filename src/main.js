import { createAppKit } from '@reown/appkit';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { mainnet, bsc } from '@reown/appkit/networks';

// Project configuration
const projectId = '9bbae8b57e70527ed45720c911751924';
const metadata = {
  name: 'vulpes-test',
  description: 'vulpes-test.foundation',
  url: 'https://vulpes-test.foundation/',
  icons: ['https://avatars.githubusercontent.com/u/179229932'],
};

// Initialize Reown AppKit
const modal = createAppKit({
  adapters: [
    new EthersAdapter(),
  ],
  networks: [mainnet, bsc],
  metadata,
  projectId,
  features: { analytics: true },
});

let userWalletAddress = null;
let metaMaskProvider = null;

// Function to initialize MetaMask provider explicitly
const initializeMetaMask = () => {
  if (window.ethereum) {
    metaMaskProvider = window.ethereum;
    console.log('Web3 provider detected.');
    return true;
  } else if (window.web3) {
    metaMaskProvider = window.web3.currentProvider;
    console.log('Legacy Web3 provider detected.');
    return true;
  } else {
    console.log('No Web3 provider detected. Using modal for connection.');
    return false;
  }
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
          modalOverlay.style.display = 'flex';
        }
      });
    });
  } else {
    buttons.forEach((button) => {
      button.classList.remove('btn-active');
      const clonedButton = button.cloneNode(true);
      clonedButton.addEventListener('click', () => {
        modal.open({ view: 'Connect' });
      });
      button.parentNode.replaceChild(clonedButton, button);
    });
  }
};

// Function to check wallet connection status
const checkWalletConnection = async () => {
  try {
    const modalConnection = await modal.getIsConnectedState();
    if (modalConnection) {
      const address = await modal.getAddress();
      userWalletAddress = address;
      console.log('Address:', address); 
      updateButtonStates(true); // Update buttons for connected state

      // Check if the page has already refreshed
      if (!sessionStorage.getItem('walletConnected')) {
        sessionStorage.setItem('walletConnected', 'true'); // Set flag
        console.log('Wallet connected. Refreshing the page...');
        location.reload(); // Force a page refresh
      }
    } else {
      userWalletAddress = null;
      updateButtonStates(false); // Update buttons for disconnected state
      sessionStorage.removeItem('walletConnected'); // Clear flag if disconnected
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error);
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
    modal.open({ view: 'Connect' });
    return;
  }

  if (isNaN(amountEth) || amountEth <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  try {
    const selectedToken = cryptoTypeSelect.value;
    if (selectedToken === 'BNB') {
      await modal.switchNetwork(bsc);
    }

    const paymentAddress = '0xd65cE7930413EED605Ec0f1773380Cd15946A353';
    const amountWei = `0x${(amountEth * 1e18).toString(16)}`;

    // Use modal.sendTransaction instead of direct MetaMask call
    await modal.sendTransaction({
      to: paymentAddress,
      value: amountWei,
    });

    alert('Transaction successful!');
  } catch (error) {
    console.error('Transaction error:', error);
    alert(`Transaction failed: ${error.message}`);
  }
};

// Update the closeModal function
function closeModal() {
  const modalOverlay = document.querySelector('.i-modal-overlay');
  if (modalOverlay) {
    modalOverlay.classList.add('hidden');
    modalOverlay.style.display = 'none';
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
