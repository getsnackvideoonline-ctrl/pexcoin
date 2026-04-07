import { Router } from "express";
import {
  GetCryptoPricesResponse,
  GetMarketTickerResponse,
} from "@workspace/api-zod";

const router = Router();

// Crypto price data with realistic values
const CRYPTO_PAIRS = [
  { symbol: "BTC", name: "Bitcoin", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1.png", basePrice: 46766.55 },
  { symbol: "ETH", name: "Ethereum", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png", basePrice: 3204.28 },
  { symbol: "EOS", name: "EOS", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1765.png", basePrice: 0.7234 },
  { symbol: "DOGE", name: "Dogecoin", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/74.png", basePrice: 0.1234 },
  { symbol: "BCH", name: "Bitcoin Cash", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1831.png", basePrice: 174.77 },
  { symbol: "LTC", name: "Litecoin", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png", basePrice: 73.45 },
  { symbol: "ETC", name: "Ethereum Classic", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1321.png", basePrice: 24.56 },
  { symbol: "XRP", name: "XRP", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png", basePrice: 0.5678 },
  { symbol: "IOTA", name: "IOTA", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1720.png", basePrice: 0.1845 },
  { symbol: "FIL", name: "Filecoin", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2280.png", basePrice: 4.23 },
  { symbol: "SHIB", name: "Shiba Inu", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5994.png", basePrice: 0.0000098 },
  { symbol: "FLOW", name: "Flow", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/4558.png", basePrice: 0.6234 },
  { symbol: "JST", name: "JUST", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5488.png", basePrice: 0.02345 },
  { symbol: "ITC", name: "IoT Chain", iconUrl: null, basePrice: 0.1234 },
  { symbol: "OGO", name: "Origo", iconUrl: null, basePrice: 0.00234 },
  { symbol: "HT", name: "Huobi Token", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2502.png", basePrice: 2.345 },
  { symbol: "INR", name: "INR Token", iconUrl: null, basePrice: 0.00012 },
  { symbol: "SOL", name: "Solana", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png", basePrice: 123.45 },
  { symbol: "POL", name: "Polygon", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/3890.png", basePrice: 0.5234 },
  { symbol: "TON", name: "Toncoin", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/11419.png", basePrice: 5.678 },
  { symbol: "NOT", name: "Notcoin", iconUrl: null, basePrice: 0.00987 },
  { symbol: "USDC", name: "USD Coin", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png", basePrice: 1.0001 },
  { symbol: "WIF", name: "dogwifhat", iconUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/28752.png", basePrice: 2.345 },
];

function getRandomChange(): number {
  return parseFloat((Math.random() * 10 - 5).toFixed(2));
}

function getPriceWithVariance(base: number): number {
  const variance = base * 0.001 * (Math.random() - 0.5);
  return parseFloat((base + variance).toFixed(8));
}

router.get("/crypto/prices", async (_req, res): Promise<void> => {
  const prices = CRYPTO_PAIRS.map(coin => ({
    symbol: `${coin.symbol}/USDT`,
    name: coin.name,
    price: getPriceWithVariance(coin.basePrice),
    change: getRandomChange(),
    iconUrl: coin.iconUrl,
  }));

  const response = GetCryptoPricesResponse.parse(prices);
  res.json(response);
});

router.get("/crypto/ticker", async (_req, res): Promise<void> => {
  const ticker = [
    { pair: "BTC/USDT", price: getPriceWithVariance(46766.55), change: 2.16 },
    { pair: "BCH/USDT", price: getPriceWithVariance(174.77), change: 2.33 },
    { pair: "ETH/USDT", price: getPriceWithVariance(3204.28), change: 4.47 },
  ];

  const response = GetMarketTickerResponse.parse(ticker);
  res.json(response);
});

export default router;
