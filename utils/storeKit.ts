// StoreKit 2 / In-App Purchase wrapper.
//
// Enables buying coin packs (or removing ads later) via App Store IAP on iOS.
// Products must be created + approved in App Store Connect first — the IDs
// below are what the app expects to fetch.
//
// The flow uses a small Swift plugin (StoreKitPlugin.swift) that exposes:
//   getProducts()             — returns SKProduct info
//   purchase(productId)       — starts the buy flow, returns success/failure
//   restorePurchases()        — invokes the standard restore sheet
//
// All calls are safe no-ops off-iOS.

import { isNative } from './nativeBridge';

export const PRODUCTS = {
    coinsSmall:  'com.henrysjourney.coins.100',   // 100 coins   — $0.99
    coinsMedium: 'com.henrysjourney.coins.500',   // 500 coins   — $3.99
    coinsLarge:  'com.henrysjourney.coins.2000',  // 2000 coins  — $9.99
    removeAds:   'com.henrysjourney.removeads',   // Consumable-free tier
} as const;

export type ProductId = typeof PRODUCTS[keyof typeof PRODUCTS];

export interface Product {
    productId: ProductId;
    title: string;
    description: string;
    price: string; // Localized (e.g. "$0.99")
    priceValue: number;
    currency: string;
}

async function callPlugin(method: string, data?: any) {
    const cap = (window as any).Capacitor;
    if (!cap?.Plugins?.StoreKit) return null;
    try {
        return await cap.Plugins.StoreKit[method](data ?? {});
    } catch (e) {
        console.warn(`[storeKit] ${method} failed:`, e);
        return null;
    }
}

/** Fetch product info from App Store Connect. Cached after first call. */
let productCache: Product[] | null = null;
export const getProducts = async (): Promise<Product[]> => {
    if (!isNative()) return [];
    if (productCache) return productCache;
    const r = await callPlugin('getProducts', { productIds: Object.values(PRODUCTS) });
    const products: Product[] = r?.products || [];
    productCache = products;
    return products;
};

/** Start a purchase flow. Resolves with the granted product on success. */
export const purchase = async (productId: ProductId): Promise<{ granted: boolean; transactionId?: string; }> => {
    if (!isNative()) return { granted: false };
    const r = await callPlugin('purchase', { productId });
    return {
        granted: !!r?.success,
        transactionId: r?.transactionId,
    };
};

/** Show the "Restore Purchases" flow (required by App Store). */
export const restorePurchases = async (): Promise<void> => {
    if (!isNative()) return;
    await callPlugin('restorePurchases');
};

/** How many coins a given product grants (call after purchase → server-side
 *  verification is skipped here for kids-simple flow; add later if needed). */
export const coinsForProduct = (productId: ProductId): number => {
    switch (productId) {
        case PRODUCTS.coinsSmall:  return 100;
        case PRODUCTS.coinsMedium: return 500;
        case PRODUCTS.coinsLarge:  return 2000;
        default:                   return 0;
    }
};
