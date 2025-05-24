const bitcoin = require('bitcoinjs-lib');
window.bitcoin = bitcoin;

// Network configuration
const networks = {
  mainnet: bitcoin.networks.bitcoin,
  testnet: bitcoin.networks.testnet
};

// Helper function to validate WIF format
function validateWIF(wif) {
  // console.log('Validating WIF format:', wif);
  if (typeof wif !== 'string') {
    throw new Error('WIF must be a string');
  }
  if (wif.length < 51 || wif.length > 53) {
    throw new Error('Invalid WIF length');
  }
  if (!/^[1-9A-HJ-NP-Za-km-z]+$/.test(wif)) {
    throw new Error('WIF contains invalid characters');
  }
  return true;
}

// Fetch UTXOs from Blockstream (mainnet) or BlockCypher (testnet)
async function fetchUTXOs(address, network) {
  const baseUrl = network === 'mainnet' ? 'https://api.blockcypher.com/v1/btc/main' : 'https://api.blockcypher.com/v1/btc/test3';
  try {
    const response = await fetch(`${baseUrl}/addrs/${address}?unspentOnly=true`);
    if (!response.ok) throw new Error(`Failed to fetch UTXOs: ${response.statusText}`);
    const data = await response.json();
    if (!data.txrefs) return [];
    return data.txrefs.map(utxo => ({
      txid: utxo.tx_hash,
      vout: utxo.tx_output_n,
      value: utxo.value,
      script: utxo.script || '' // BlockCypher may not return script
    }));
  } catch (error) {
    console.error('Error fetching UTXOs:', error);
    throw error;
  }
}

// Broadcast transaction to the network
async function broadcastTransaction(hex, network) {
  const baseUrl = network === 'mainnet' ? 'https://api.blockcypher.com/v1/btc/main' : 'https://api.blockcypher.com/v1/btc/test3';
  try {
    const response = await fetch(`${baseUrl}/txs/push`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tx: hex })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to broadcast transaction: ${errorText}`);
    }
    const data = await response.json();
    return data.tx && data.tx.hash ? data.tx.hash : JSON.stringify(data);
  } catch (error) {
    console.error('Error broadcasting transaction:', error);
    throw error;
  }
}

// Main sweep function
async function sweepPaperWalletWithBitcoinJS(privateKeyWIF, destinationAddress, network, utxosToUse) {
  try {
    // console.log('Starting sweep with BitcoinJS...');
    // console.log('Network:', network);
    // console.log('WIF:', privateKeyWIF);
    // console.log('Destination:', destinationAddress);
    validateWIF(privateKeyWIF);
    const selectedNetwork = networks[network];
    // console.log('Selected network details:', selectedNetwork);
    let keyPair;
    try {
      keyPair = bitcoin.ECPair.fromWIF(privateKeyWIF, selectedNetwork);
      // console.log('WIF parsed successfully');
      // console.log('Key pair details:', {
      //   network: keyPair.network?.messagePrefix,
      //   compressed: keyPair.compressed,
      //   publicKey: keyPair.publicKey?.toString('hex')
      // });
    } catch (error) {
      console.error('WIF parsing failed:', error); // Keep this error log
      const otherNetwork = network === 'mainnet' ? networks.testnet : networks.mainnet;
      try {
        bitcoin.ECPair.fromWIF(privateKeyWIF, otherNetwork);
        throw new Error(`This WIF is valid for ${network === 'mainnet' ? 'testnet' : 'mainnet'}, but you selected ${network}`);
      } catch (e) {
        throw new Error(`Invalid WIF format: ${error.message}`);
      }
    }
    const { address } = bitcoin.payments.p2pkh({ 
      pubkey: keyPair.publicKey,
      network: selectedNetwork 
    });
    // console.log('Source address:', address);
    // console.log('Using provided UTXOs...');
    const utxos = utxosToUse || [];
    // console.log('UTXOs found:', utxos.length);
    // utxos.forEach((utxo, index) => { console.log(`UTXO ${index + 1}:`, utxo); });
    if (utxos.length === 0) {
      throw new Error('No UTXOs found for this address');
    }
    const totalAmount = utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    // console.log('Total amount available:', totalAmount);
    // console.log('Creating transaction...');
    const txb = new bitcoin.TransactionBuilder(selectedNetwork);
    utxos.forEach(utxo => {
      txb.addInput(utxo.txid, utxo.vout);
    });
    const fee = 1000; // 0.00001 BTC
    const sendAmount = totalAmount - fee;
    if (sendAmount <= 0) {
      throw new Error('Insufficient funds to cover the transaction fee');
    }
    txb.addOutput(destinationAddress, sendAmount);
    utxos.forEach((_, idx) => {
      txb.sign(idx, keyPair);
    });
    const tx = txb.build();
    // console.log('Transaction finalized');
    const txHex = tx.toHex();
    // console.log('Transaction hex:', txHex);
    return { txHex, fee };
  } catch (error) {
    console.error('Sweep error:', error); // Keep this error log
    throw error;
  }
}

module.exports = {
  sweepPaperWalletWithBitcoinJS,
  fetchUTXOs,
  broadcastTransaction
};

// Explicitly assign to window.bitcoinUtils
window.bitcoinUtils = {
  sweepPaperWalletWithBitcoinJS,
  fetchUTXOs,
  broadcastTransaction
}; 