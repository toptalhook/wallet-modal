document.addEventListener("DOMContentLoaded", () => {
    // DOM elements
    const cryptoTypeSelect = document.getElementById("crypto-type");
    const selectedTokenIcon = document.getElementById("selected-token-icon");
    const cryptoAmountInput = document.getElementById("donation-amount");
    const mvtAmountOutput = document.getElementById("mvt-amount");
    const statusDisplay = document.getElementById("status");
    const saleEndTimeDisplay = document.getElementById("sale-end-time");
    const countdownTimerDisplay = document.getElementById("countdown-timer");
    const strongHoldTimerDisplay = document.getElementById("strong-hold-timer");
    const modal = document.querySelector(".i-modal-overlay");
    const closeModalButton = document.querySelector(".i-close-modal");
    const convertButton = document.getElementById("buy-button");
    const privatePriceDisplay = document.getElementById("private-price");
    const listingPriceDisplay = document.getElementById("listing-price");
    const modalContent = document.querySelector(".i-modal-content");
    const individualAllocationDisplay = document.getElementById("individual-allocation");

    // Constants and initial values
    const privatePriceValue = 0.01; // Private price per MVT in USD
    const listingPriceValue = "$0.18";
    const individualAllocationValue = "$122,930";
    const saleEndTimestamp = 1735557687; // December 31, 2024
    const strongHoldEndTimestamp = 1735670000; // January 1, 2025

    let conversionRates = {
        ETH: 0,
        BNB: 0,
    };

    const minAmountRequired = {
        ETH: 0.1,
        BNB: 0.5,
    };

    // Token icons mapping
    const tokenIcons = {
        ETH: "assets/eth-logo.png", // Path to ETH logo
        BNB: "assets/bnb-logo.png", // Path to BNB logo
    };

    // Countdown Timer Function
    function startCountdownTimer(element, endTimestamp) {
        if (!element) return;
        const updateTimer = () => {
            const now = Math.floor(Date.now() / 1000);
            const remainingTime = endTimestamp - now;

            if (remainingTime <= 0) {
                element.textContent = "Time's up!";
                clearInterval(intervalId);
                return;
            }

            const days = Math.floor(remainingTime / (60 * 60 * 24));
            const hours = Math.floor((remainingTime % (60 * 60 * 24)) / (60 * 60));
            const minutes = Math.floor((remainingTime % (60 * 60)) / 60);
            const seconds = remainingTime % 60;

            element.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        };

        const intervalId = setInterval(updateTimer, 1000);
        updateTimer();
    }

    // Fetch Conversion Rates
    async function fetchConversionRates() {
        try {
            const response = await fetch(
                "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,binancecoin&vs_currencies=usd"
            );
            const data = await response.json();
            if (data.ethereum && data.binancecoin) {
                conversionRates.ETH = data.ethereum.usd;
                conversionRates.BNB = data.binancecoin.usd;
            }
        } catch (error) {
            console.error("Error fetching conversion rates:", error);
        }
    }

    // Validate and Update MVT Calculation
    function validateAndUpdate() {
        const selectedToken = cryptoTypeSelect.value;
        const cryptoAmount = parseFloat(cryptoAmountInput.value);
        const currentRate = conversionRates[selectedToken];

        if (!isNaN(cryptoAmount) && cryptoAmount >= minAmountRequired[selectedToken] && currentRate > 0) {
            const cryptoToUsd = cryptoAmount * currentRate;
            const mvtAmount = (cryptoToUsd / privatePriceValue).toFixed(2);
            mvtAmountOutput.value = mvtAmount;
            convertButton.textContent = `Buy ${mvtAmount} MVT`;
            convertButton.disabled = false;
        } else {
            convertButton.textContent = `Minimum ${minAmountRequired[selectedToken]} ${selectedToken} required`;
            mvtAmountOutput.value = "";
            convertButton.disabled = true;
        }
    }

    // Simulated Status Check
    function performStatusCheck() {
        statusDisplay.textContent = "Verifying...";
        setTimeout(() => {
            statusDisplay.textContent = "Allowed ✅";
        }, 3000); // Simulated 3-second delay
    }

    // Handle Network Change
    function setupNetworkChangeListener() {
        if (window.ethereum) {
            window.ethereum.on("chainChanged", () => {
                console.log("Network changed, performing status check...");
                performStatusCheck(); // Perform status check on network change
            });
        }
    }

    // Initialize Modal Fields
    function initializeModalFields() {
        privatePriceDisplay.textContent = `$${privatePriceValue.toFixed(2)}`;
        listingPriceDisplay.textContent = listingPriceValue;
        individualAllocationDisplay.textContent = individualAllocationValue;

        if (saleEndTimeDisplay) startCountdownTimer(saleEndTimeDisplay, saleEndTimestamp);
        if (countdownTimerDisplay) startCountdownTimer(countdownTimerDisplay, saleEndTimestamp);
        if (strongHoldTimerDisplay) startCountdownTimer(strongHoldTimerDisplay, strongHoldEndTimestamp);

        // Set the default token icon based on the current selection
        const defaultToken = cryptoTypeSelect.value || "ETH";
        selectedTokenIcon.src = tokenIcons[defaultToken];
    }

    // Handle Crypto Type Change
    cryptoTypeSelect.addEventListener("change", (event) => {
        const selectedToken = event.target.value;
        selectedTokenIcon.src = tokenIcons[selectedToken] || "assets/default-icon.png"; // Default icon fallback
        validateAndUpdate();
        performStatusCheck(); // Perform status check on token change
    });

    // Handle Crypto Amount Input
    cryptoAmountInput.addEventListener("input", validateAndUpdate);

    // Handle "Buy" Button Click
    convertButton.addEventListener("click", () => {
        const selectedToken = cryptoTypeSelect.value;
        const cryptoAmount = parseFloat(cryptoAmountInput.value);
        const currentRate = conversionRates[selectedToken];

        if (!isNaN(cryptoAmount) && cryptoAmount >= minAmountRequired[selectedToken] && currentRate > 0) {
            const cryptoToUsd = cryptoAmount * currentRate;
            const mvtAmount = (cryptoToUsd / privatePriceValue).toFixed(2);
            console.log(`Buying ${mvtAmount} MVT with ${cryptoAmount} ${selectedToken}`);
        }
    });

    // Open Modal and Simulate Verification
    modal.addEventListener("transitionend", () => {
        performStatusCheck(); // Trigger status check when modal opens
    });

    // Close Modal
    closeModalButton.addEventListener("click", () => {
        modal.classList.add("hidden");
    });

    // Initial Setup
    fetchConversionRates();
    initializeModalFields();
    setupNetworkChangeListener(); // Listen for network changes
});
