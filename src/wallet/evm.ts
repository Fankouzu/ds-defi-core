import { ethers, Wallet, JsonRpcProvider, TransactionRequest } from 'ethers';

export type Chain = 'ethereum' | 'base' | 'polygon' | 'arbitrum';

const RPC_URLS: Record<Chain, string> = {
  ethereum: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-api-key',
  base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
  polygon: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
  arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
};

export class EVMWallet {
  private wallet: Wallet;

  constructor(privateKey?: string) {
    if (privateKey) {
      this.wallet = new Wallet(privateKey);
    } else {
      this.wallet = Wallet.createRandom();
    }
  }

  /**
   * Generate a new EVM wallet
   */
  static createWallet(): EVMWallet {
    return new EVMWallet();
  }

  /**
   * Get balance for a specific address and chain
   */
  async getBalance(address: string, chain: Chain): Promise<bigint> {
    const provider = new JsonRpcProvider(RPC_URLS[chain]);
    return await provider.getBalance(address);
  }

  /**
   * Send native token transaction
   */
  async sendTransaction(to: string, amount: bigint, chain: Chain): Promise<string> {
    const provider = new JsonRpcProvider(RPC_URLS[chain]);
    const walletWithProvider = this.wallet.connect(provider);
    
    const tx = await walletWithProvider.sendTransaction({
      to,
      value: amount,
    });
    
    return tx.hash;
  }

  /**
   * Sign an arbitrary message
   */
  async signMessage(message: string): Promise<string> {
    return await this.wallet.signMessage(message);
  }

  /**
   * Verify a signature
   */
  static verifySignature(message: string, signature: string, address: string): boolean {
    const recoveredAddress = ethers.verifyMessage(message, signature);
    return recoveredAddress.toLowerCase() === address.toLowerCase();
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(tx: TransactionRequest, chain: Chain): Promise<bigint> {
    const provider = new JsonRpcProvider(RPC_URLS[chain]);
    return await provider.estimateGas(tx);
  }

  /**
   * Watch an address for incoming transactions (Simplified Polling)
   * Real implementation would use WebSockets or a robust listener
   */
  async watchAddress(address: string, chain: Chain, callback: (tx: any) => void) {
    const provider = new JsonRpcProvider(RPC_URLS[chain]);
    provider.on('block', async (blockNumber) => {
      const block = await provider.getBlock(blockNumber, true);
      if (block && block.prefetchedTransactions) {
          block.prefetchedTransactions.forEach((tx: any) => {
            if (tx.to && tx.to.toLowerCase() === address.toLowerCase()) {
              callback(tx);
            }
          });
      }
    });
  }

  getAddress(): string {
    return this.wallet.address;
  }
}
