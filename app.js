// Get the browserified Bitcoin utilities
const { sweepPaperWalletWithBitcoinJS } = window.bitcoinUtils;

// DOM Elements
let sweepForm;
let networkSelect;
let privateKeyInput;
let destinationAddressInput;
let sourceAddressInput;
let sweepButton;
let retrieveUtxoBtn;
let disconnectedCheckbox;
let statusElement;
let generateTestnetBtn;
let backToStep1Btn;

// QR Scanner Elements
let scanSourceAddressQRBtn;
let scanPrivateKeyQRBtn;
let qrScannerModal;
let qrReaderElement;
let closeQrScannerModalBtn;
let html5QrCode;
let currentQrScanTargetInput = null;

// Add at the top:
const bitcoin = window.bitcoinjs || window.bitcoin; // fallback if loaded from CDN

// Initialize the app
function initializeApp() {
    // console.log('App is ready, initializing...');
    
    // Get DOM elements
    sweepForm = document.getElementById('sweepForm');
    networkSelect = document.getElementById('network');
    privateKeyInput = document.getElementById('privateKey');
    destinationAddressInput = document.getElementById('destinationAddress');
    sourceAddressInput = document.getElementById('sourceAddress');
    sweepButton = document.getElementById('sweepButton');
    retrieveUtxoBtn = document.getElementById('retrieveUtxoBtn');
    disconnectedCheckbox = document.getElementById('disconnectedCheckbox');
    statusElement = document.getElementById('status');
    generateTestnetBtn = document.getElementById('generateTestnetBtn');
    backToStep1Btn = document.getElementById('backToStep1Btn');

    // QR Scanner Elements
    scanSourceAddressQRBtn = document.getElementById('scanSourceAddressQR');
    scanPrivateKeyQRBtn = document.getElementById('scanPrivateKeyQR');
    qrScannerModal = document.getElementById('qrScannerModal');
    qrReaderElement = document.getElementById('qr-reader');
    closeQrScannerModalBtn = document.getElementById('closeQrScannerModalBtn');

    // Set initial network value
    const initialNetwork = networkSelect.value;
    // console.log('Initial network value:', initialNetwork, 'Button display:', generateTestnetBtn.style.display);
    if (generateTestnetBtn) {
        generateTestnetBtn.style.display = initialNetwork === 'testnet' ? 'block' : 'none';
    }

    // Verify all required elements are present
    const requiredElements = {
        sweepForm,
        networkSelect,
        privateKeyInput,
        destinationAddressInput,
        sourceAddressInput,
        sweepButton,
        retrieveUtxoBtn,
        disconnectedCheckbox,
        statusElement,
        generateTestnetBtn,
        backToStep1Btn,
        // QR Scanner Elements
        scanSourceAddressQRBtn,
        scanPrivateKeyQRBtn,
        qrScannerModal,
        qrReaderElement,
        closeQrScannerModalBtn
    };

    const missingElements = Object.entries(requiredElements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error('Missing required elements:', missingElements);
        return;
    }

    // console.log('DOM Elements found:', Object.fromEntries(
    //     Object.entries(requiredElements).map(([key, value]) => [key, !!value])
    // ));

    // Add event listeners
    networkSelect.addEventListener('change', handleNetworkChange);
    sweepForm.addEventListener('submit', handleSweepSubmit);
    retrieveUtxoBtn.addEventListener('click', handleRetrieveUtxo);
    disconnectedCheckbox.addEventListener('change', handleDisconnectedCheckbox);
    if (generateTestnetBtn) {
        generateTestnetBtn.addEventListener('click', handleGenerateTestnet);
    }
    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', handleBackToStep1);
    }

    // QR Scanner Event Listeners
    if (scanSourceAddressQRBtn) {
        scanSourceAddressQRBtn.addEventListener('click', () => startQrScan(sourceAddressInput));
    }
    if (scanPrivateKeyQRBtn) {
        scanPrivateKeyQRBtn.addEventListener('click', () => startQrScan(privateKeyInput));
    }
    if (closeQrScannerModalBtn) {
        closeQrScannerModalBtn.addEventListener('click', stopAndHideQrScanner);
    }

    // console.log('App initialization complete');

    // After showStatus function, add:
    // Modal logic for testnet address generation
    setupTestnetModal();
}

// Handle network change
function handleNetworkChange() {
    const selectedNetwork = networkSelect.value;
    // console.log('Network select value:', selectedNetwork);
    
    if (generateTestnetBtn) {
        generateTestnetBtn.style.display = selectedNetwork === 'testnet' ? 'block' : 'none';
    }
}

// Handle disconnected checkbox change
function handleDisconnectedCheckbox() {
    privateKeyInput.disabled = !disconnectedCheckbox.checked;
}

// Handle retrieve UTXOs button click
async function handleRetrieveUtxo() {
    const sourceAddress = sourceAddressInput.value.trim();
    const network = networkSelect.value;

    if (!sourceAddress) {
        showStatus('Please enter the source address public key', true);
        return;
    }
    showStatus('Retrieving UTXOs...', false);
    retrieveUtxoBtn.disabled = true;
    retrieveUtxoBtn.classList.add('loading');

    try {
        const utxos = await window.bitcoinUtils.fetchUTXOs(sourceAddress, network);
        if (utxos.length > 0) {
            window.retrievedUtxos = utxos;
            document.getElementById('step1').style.display = 'none';
            document.getElementById('step2').style.display = 'block';
            showStatus('UTXOs retrieved. Please disconnect from the network and complete Step 2.', false);
            privateKeyInput.focus();
        } else {
            showStatus('No UTXOs found for the source address. Please check the address and network.', true);
        }
    } catch (error) {
        console.error('Error retrieving UTXOs:', error);
        showStatus(`Error retrieving UTXOs: ${error.message}`, true);
    } finally {
        retrieveUtxoBtn.disabled = false;
        retrieveUtxoBtn.classList.remove('loading');
    }
}

// Handle sweep form submission
async function handleSweepSubmit(event) {
    event.preventDefault();
    // console.log('Sweep button clicked', event);

    // Clear previous tx hex UI
    const txHexContainer = document.getElementById('txHexContainer');
    if (txHexContainer) txHexContainer.innerHTML = '';

    // Get button state
    const buttonState = {
            disabled: sweepButton.disabled,
            hasLoadingClass: sweepButton.classList.contains('loading')
    };
    // console.log('Button state:', buttonState);

    // Get form values
    const network = networkSelect.value;
    // console.log('Network select value:', network);
        
        const wif = privateKeyInput.value.trim();
        const destination = destinationAddressInput.value.trim();

    // Log input values (without exposing sensitive data)
        // console.log('Input values:', {
        // wif: wif ? 'present' : 'missing',
        // destination: destination ? 'present' : 'missing',
        // network: network
    // });

    // Validate inputs
    if (!wif || !destination) {
        showStatus('Please fill in all fields in Step 2', true);
            return;
        }

    // Validate network
    // console.log('Network select value:', networkSelect.value);

    // Validate destination address
    // console.log('Validating address for network:', network);
    // console.log('Address to validate:', destination);
    try {
        // Use the correct network object
        const networkObj = network === 'testnet'
            ? bitcoin.networks.testnet
            : bitcoin.networks.bitcoin;
        bitcoin.address.toOutputScript(destination, networkObj);
        // If no error, address is valid for the selected network
    } catch (e) {
        showStatus('Invalid destination address for selected network', true);
            return;
        }
    // console.log('Address validation successful:', destination);

    // Start sweep process
    // console.log('Starting sweep process...');
    showStatus('Processing transaction...', false);

    try {
        // Disable the button and show loading state
            sweepButton.disabled = true;
            sweepButton.classList.add('loading');

        // Call the sweep function, passing the retrieved UTXOs
        const result = await sweepPaperWalletWithBitcoinJS(wif, destination, network, window.retrievedUtxos);
        // Show the transaction hex and options
        if (txHexContainer) {
            txHexContainer.innerHTML = `
              <label>Raw Transaction Hex:</label>
              <textarea id="txHex" readonly>${result.txHex}</textarea>
              <br>
              <button id="broadcastBtn" class="primary-button">Broadcast</button>
              <span class="button-group-spacing"></span>
              <button id="copyHexBtn" class="tertiary-button">Copy Hex</button>
              <div id="broadcastLoader">Broadcasting...</div>
            `;
            // Broadcast button logic
            document.getElementById('broadcastBtn').onclick = function() {
              document.getElementById('broadcastLoader').style.display = 'block';
              sweepButton.disabled = true; // Disable sweep button during broadcast
              this.disabled = true; // Disable broadcast button itself

              window.bitcoinUtils.broadcastTransaction(result.txHex, network)
                .then(txid => {
                  document.getElementById('broadcastLoader').style.display = 'none';
                  const explorerBaseUrl = network === 'testnet' 
                                      ? 'https://live.blockcypher.com/btc-testnet/tx/' 
                                      : 'https://live.blockcypher.com/btc/tx/';
                  const explorerUrl = explorerBaseUrl + txid;
                  showStatus(
                    `Broadcasted! <a href="${explorerUrl}" target="_blank">View TX: ${txid}</a>`,
                    false,
                    true // Indicate that the message contains HTML
                  );
                  // Optionally, disable copy hex button too or change its text
                  document.getElementById('copyHexBtn').disabled = true;
                })
                .catch(err => {
                  document.getElementById('broadcastLoader').style.display = 'none';
                  showStatus('Broadcast error: ' + err.message, true);
                  sweepButton.disabled = false; // Re-enable sweep button on broadcast error
                  this.disabled = false; // Re-enable broadcast button on error
                });
            };
            // Copy hex button logic
            document.getElementById('copyHexBtn').onclick = function() {
              navigator.clipboard.writeText(result.txHex);
              alert('Transaction hex copied to clipboard!');
            };
        }
        showStatus(`Transaction created! Fee: ${result.fee} sats. Review the hex below.`, false);
        } catch (error) {
        console.error('Sweep failed:', error);
        showStatus(`Sweep failed: ${error.message}`, true);
        } finally {
        // Reset button state
            // console.log('Resetting button state');
            sweepButton.disabled = false;
            sweepButton.classList.remove('loading');
        }
}

// Modal logic for testnet address generation
function setupTestnetModal() {
    const modal = document.getElementById('testnetModal');
    const closeBtn = document.getElementById('closeTestnetModal');
    const generateBtn = document.getElementById('generateNewTestnetAddress');
    const addressDiv = document.getElementById('generatedTestnetAddress');

    if (!modal || !closeBtn || !generateBtn || !addressDiv) return;

    // Close modal on X click
    closeBtn.onclick = function() {
        modal.style.display = 'none';
        addressDiv.textContent = '';
    };
    // Close modal on outside click
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            addressDiv.textContent = '';
        }
    };
    // Generate new testnet address
    generateBtn.onclick = function() {
        // Generate random keypair
        const keyPair = bitcoin.ECPair.makeRandom({ network: bitcoin.networks.testnet });
        const { address } = bitcoin.payments.p2pkh({ pubkey: keyPair.publicKey, network: bitcoin.networks.testnet });
        const wif = keyPair.toWIF();
        addressDiv.innerHTML = `<b>Address:</b> <code>${address}</code><br><b>WIF:</b> <code>${wif}</code>`;
    };
}

// Update handleGenerateTestnet to open the modal
function handleGenerateTestnet() {
    const modal = document.getElementById('testnetModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// Show status message
function showStatus(message, isError, containsHtml = false) {
    // console.log('Showing status:', message, 'isError:', isError);
    if (containsHtml) {
        statusElement.innerHTML = message; // Use innerHTML if message contains HTML
    } else {
        statusElement.textContent = message; // Use textContent otherwise
    }
    statusElement.className = `status ${isError ? 'error' : 'success'}`;
    if (!isError && !message.toLowerCase().includes('error') && !message.toLowerCase().includes('failed')){
        statusElement.classList.remove('error');
        statusElement.classList.add('success');
    } else if (isError) {
        statusElement.classList.remove('success');
        statusElement.classList.add('error');
    }
    // console.log('Status element updated:', statusElement);
}

// Added function to handle going back to step 1
function handleBackToStep1() {
    document.getElementById('step2').style.display = 'none';
    document.getElementById('step1').style.display = 'block';

    window.retrievedUtxos = [];
    privateKeyInput.value = '';
    destinationAddressInput.value = '';
    disconnectedCheckbox.checked = false;
    privateKeyInput.disabled = true;

    const txHexContainer = document.getElementById('txHexContainer');
    if (txHexContainer) txHexContainer.innerHTML = '';
    
    showStatus('Ready to retrieve UTXOs for a new source address.', false);
    sourceAddressInput.focus();
}

// --- QR Code Scanning Functions ---
function startQrScan(targetInput) {
    currentQrScanTargetInput = targetInput;
    qrScannerModal.style.display = 'flex'; // Use flex as modals are styled with display:flex

    // Initialize Html5Qrcode if not already done
    if (!html5QrCode) {
        html5QrCode = new Html5Qrcode("qr-reader");
    }

    const qrConfig = { fps: 10, qrbox: { width: 250, height: 250 } };
    // Prefer back camera
    html5QrCode.start({ facingMode: "environment" }, qrConfig, onQrScanSuccess, onQrScanFailure)
        .catch(err => {
            // console.warn(`Unable to start QR scanner with back camera: ${err}, trying front camera...`);
            // If back camera fails, try default (often front)
            html5QrCode.start({ facingMode: "user" }, qrConfig, onQrScanSuccess, onQrScanFailure)
                .catch(err_front => {
                    console.error(`Failed to start QR scanner with any camera: ${err_front}`);
                    showStatus('Failed to start QR scanner. Check camera permissions.', true);
                    stopAndHideQrScanner(); // Hide modal if camera fails entirely
                });
        });
}

function onQrScanSuccess(decodedText, decodedResult) {
    if (currentQrScanTargetInput) {
        currentQrScanTargetInput.value = decodedText;
        // Trigger input event for any listeners on the input field
        const event = new Event('input', { bubbles: true, cancelable: true });
        currentQrScanTargetInput.dispatchEvent(event);
    }
    // console.log(`QR Code detected: ${decodedText}`, decodedResult);
    showStatus('QR Code scanned successfully!', false);
    stopAndHideQrScanner();
}

function onQrScanFailure(error) {
    // console.warn(`QR Code scan error: ${error}`);
    // This callback is called frequently, so extensive logging can be noisy.
    // Library often handles "no QR code found" internally.
}

function stopAndHideQrScanner() {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            // console.log("QR Scanner stopped.");
        }).catch(err => {
            console.error("Error stopping QR scanner: ", err);
        });
    }
    qrScannerModal.style.display = 'none';
    currentQrScanTargetInput = null;
}

// Initialize the app when the DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp); 