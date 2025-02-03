import { Platform } from 'react-native';
import { 
  initConnection,
  purchaseErrorListener,
  purchaseUpdatedListener,
  getProducts,
  requestPurchase,
  finishTransaction,
  Product
} from 'react-native-iap';

// Product IDs for your subscriptions
export const subscriptionSkus = Platform.select({
  ios: [
    'com.neobile.smarttutor.monthly',
    'com.neobile.smarttutor.yearly'
  ],
  android: [] // Add Android SKUs if needed in the future
});

class StoreKitService {
  private static instance: StoreKitService;
  private products: Product[] = [];

  private constructor() {}

  static getInstance(): StoreKitService {
    if (!StoreKitService.instance) {
      StoreKitService.instance = new StoreKitService();
    }
    return StoreKitService.instance;
  }

  async initialize() {
    try {
      await initConnection();
      // Set up purchase listeners
      purchaseUpdatedListener(async (purchase) => {
        const receipt = purchase.transactionReceipt;
        if (receipt) {
          await finishTransaction({ purchase });
        }
      });

      purchaseErrorListener((error) => {
        console.error('Purchase error:', error);
      });

      // Load products
      if (subscriptionSkus) {
        this.products = await getProducts({ skus: subscriptionSkus });
      }
    } catch (err) {
      console.error('Failed to initialize IAP:', err);
      throw err;
    }
  }

  getProducts(): Product[] {
    return this.products;
  }

  async purchaseSubscription(sku: string): Promise<void> {
    try {
      await requestPurchase({ sku });
    } catch (err) {
      console.error('Purchase failed:', err);
      throw err;
    }
  }
}

export default StoreKitService;
