# Bitcoin Paper Wallet Sweeper

A client-side web application that allows you to sweep funds from a Bitcoin paper wallet to a destination address.

## Features

- Sweep funds from a Bitcoin paper wallet
- Client-side processing (private keys never leave your browser)
- QR code scanning for easy public and private key input
- Support for WIF format private keys
- Clear step-by-step status updates
- Modern and responsive UI (best effort, further testing recommended on various devices)

## Important Security Notes

1.  **Client-Side Operation:** This application runs entirely in your browser. Private keys are never sent to any server. You can verify this by checking network requests in your browser's developer tools.
2.  **Offline Workflow:** For enhanced security, after retrieving UTXOs (which requires an internet connection), you can disconnect from the network, enter your private key, and generate the raw transaction hex. You can then copy this hex and broadcast it using a trusted tool on an online machine.
3.  **Testnet Default:** The application uses the Bitcoin testnet by default for safety.
4.  **Test Small Amounts:** Always test with small, non-critical amounts first, especially when using mainnet.
5.  **Secure Environment:** Use this application in a secure, trusted environment.
6.  **Private Key Secrecy:** Never share your private keys with anyone or enter them on suspicious websites.

## Getting Started

1.  Simply open the `index.html` file in your web browser.
    *   You can use any local web server for convenience.
    *   For example, using Python's built-in server:
        ```bash
        python -m http.server 8080
        ```
    *   Or using Node.js `serve` package (install with `npm install -g serve`):
        ```bash
        serve . -l 8080
        ```
2.  Open your browser and navigate to `http://localhost:8080` (or the port you used).

## Usage

The application follows a two-step process for enhanced security:

**Step 1: Retrieve Unspent Transaction Outputs (UTXOs)**
1.  Select the Network (Testnet or Mainnet). The "Generate Testnet Addresses" button can help if you're using Testnet and need a new address/WIF.
2.  Enter the Source Address Public Key from which you want to sweep funds. You can type it or use the QR code scanner button next to the field.
3.  Click "Retrieve UTXOs". The application will fetch the unspent outputs for this address.

**Step 2: Generate and Broadcast Transaction (Offline Recommended)**
1.  Once UTXOs are retrieved, the application will prompt you to disconnect from the network for enhanced security.
2.  Check the "I have disconnected from the network" checkbox. This will enable the private key field.
3.  Enter your paper wallet's Private Key (WIF format). You can type it or use the QR code scanner button.
4.  Enter the Destination Bitcoin Address where you want to send the funds.
5.  Click "Sweep Funds". The application will generate the raw transaction hex locally.
6.  **Review the Hex:** The raw transaction hex will be displayed. You can copy this hex.
    *   **Decode (Optional):** You can use an external block explorer's decode feature to verify the transaction details before broadcasting.
    *   **Broadcast:**
        *   **Via App (Online):** If you are online, you can click the "Broadcast" button. The app will attempt to broadcast the transaction using BlockCypher's API, and a link to the transaction on their explorer will be provided.
        *   **Manually (Recommended for Security):** For maximum security, especially with mainnet funds, copy the raw transaction hex and use a trusted, separate wallet or broadcast tool (on an online machine if you generated the hex offline) to submit it to the Bitcoin network.

## Technical Details

- Built with vanilla JavaScript, HTML, and CSS.
- Uses **bitcoinjs-lib** (bundled using Browserify) for core Bitcoin operations like address generation, WIF parsing, and transaction creation (via `TransactionBuilder`).
- Uses **BlockCypher's API** for fetching UTXOs and (optionally) broadcasting transactions.
- Implements a two-step workflow to allow for offline transaction generation after UTXO retrieval.
- Uses Bitcoin testnet by default for safety.
- QR code scanning facilitated by **html5-qrcode** library.

## Dependencies

- **Bundled with Browserify:**
    - `bitcoinjs-lib` (and its own dependencies like `ecpair`, `tiny-secp256k1`)
- **Loaded via CDN:**
    - `html5-qrcode`

## License

MIT 