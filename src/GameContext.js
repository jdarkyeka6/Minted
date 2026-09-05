import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext(null);
const SAVE_KEY = 'minted-save-v2';
const LEGACY_SAVE_KEY = 'minted-save-v1';
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

const clickTiers = [1, 3, 10, 50, 250, 1000, 5000, 25000, 100000];
const clickCosts = [0, 50, 400, 4000, 30000, 250000, 2000000, 15000000, 120000000];

const businessCatalogData = [
  { id: 'cart', name: 'Street Cart', icon: '🥤', industry: 'Food', cost: 150, baseIncome: 0.45 },
  { id: 'coffee', name: 'Coffee House', icon: '☕️', industry: 'Food', cost: 2500, baseIncome: 5 },
  { id: 'studio', name: 'Design Studio', icon: '🎨', industry: 'Creative', cost: 22000, baseIncome: 38 },
  { id: 'logistics', name: 'Atlas Logistics', icon: '🚚', industry: 'Transport', cost: 160000, baseIncome: 230 },
  { id: 'software', name: 'Orbit Software', icon: '💻', industry: 'Technology', cost: 1400000, baseIncome: 1800 },
  { id: 'factory', name: 'Forge Industries', icon: '🏭', industry: 'Manufacturing', cost: 12000000, baseIncome: 16500 },
  { id: 'bank', name: 'Crown Capital', icon: '🏦', industry: 'Finance', cost: 110000000, baseIncome: 145000 },
  { id: 'airline', name: 'Nova Air', icon: '✈️', industry: 'Transport', cost: 950000000, baseIncome: 1100000 },
  { id: 'space', name: 'Asterion Space', icon: '🚀', industry: 'Technology', cost: 8500000000, baseIncome: 8800000 },
];

const propertyCatalogData = [
  { id: 'studioFlat', name: 'Studio Apartment', location: 'Perth', icon: '🏢', cost: 15000, rentPerSec: 1.4 },
  { id: 'suburban', name: 'Suburban House', location: 'Melbourne', icon: '🏡', cost: 85000, rentPerSec: 8.5 },
  { id: 'cityUnit', name: 'City Tower Unit', location: 'Sydney', icon: '🌆', cost: 650000, rentPerSec: 78 },
  { id: 'beachVilla', name: 'Beach Villa', location: 'Gold Coast', icon: '🌴', cost: 4800000, rentPerSec: 620 },
  { id: 'hotel', name: 'Boutique Hotel', location: 'Singapore', icon: '🏨', cost: 42000000, rentPerSec: 6100 },
  { id: 'tower', name: 'Office Tower', location: 'New York', icon: '🏙️', cost: 460000000, rentPerSec: 72000 },
  { id: 'resort', name: 'Private Island Resort', location: 'Maldives', icon: '🏝️', cost: 5200000000, rentPerSec: 900000 },
];

const assetCatalogData = [
  { id: 'sneakers', name: 'Collector Sneakers', icon: '👟', cost: 5000, prestige: 5 },
  { id: 'watch', name: 'Mechanical Watch', icon: '⌚️', cost: 35000, prestige: 18 },
  { id: 'sportsCar', name: 'Sports Car', icon: '🏎️', cost: 250000, prestige: 60 },
  { id: 'supercar', name: 'Hypercar', icon: '🔥', cost: 2500000, prestige: 180 },
  { id: 'yacht', name: 'Superyacht', icon: '🛥️', cost: 18000000, prestige: 520 },
  { id: 'jet', name: 'Private Jet', icon: '🛩️', cost: 75000000, prestige: 1400 },
  { id: 'island', name: 'Private Island', icon: '🌊', cost: 550000000, prestige: 5000 },
];

const defaultStocks = [
  { id: 'NSAI', symbol: 'NSAI', name: 'Northstar AI', icon: '✦', price: 86.25, changePct: 0, shares: 0, avgCost: 0, volatility: 0.035, drift: 0.0015, yieldRate: 0.00007 },
  { id: 'VLT', symbol: 'VLT', name: 'Volterra Motors', icon: 'V', price: 42.6, changePct: 0, shares: 0, avgCost: 0, volatility: 0.045, drift: 0.001, yieldRate: 0.00004 },
  { id: 'HEL', symbol: 'HEL', name: 'Helio Energy', icon: '☀', price: 28.4, changePct: 0, shares: 0, avgCost: 0, volatility: 0.025, drift: 0.001, yieldRate: 0.00012 },
  { id: 'ATL', symbol: 'ATL', name: 'Atlas Retail', icon: 'A', price: 61.1, changePct: 0, shares: 0, avgCost: 0, volatility: 0.02, drift: 0.0005, yieldRate: 0.00016 },
  { id: 'ORB', symbol: 'ORB', name: 'Orbit Systems', icon: '◉', price: 133.75, changePct: 0, shares: 0, avgCost: 0, volatility: 0.03, drift: 0.0012, yieldRate: 0.00008 },
  { id: 'CND', symbol: 'CND', name: 'Cinder Labs', icon: 'C', price: 18.95, changePct: 0, shares: 0, avgCost: 0, volatility: 0.06, drift: 0.0018, yieldRate: 0.00002 },
];

const defaultCrypto = [
  { id: 'MNT', symbol: 'MNT', name: 'MintCoin', icon: 'M', price: 24.4, changePct: 0, units: 0, avgCost: 0, volatility: 0.08, drift: 0.001 },
  { id: 'NOVA', symbol: 'NOVA', name: 'Nova', icon: '✧', price: 8.75, changePct: 0, units: 0, avgCost: 0, volatility: 0.11, drift: 0.0015 },
  { id: 'VEC', symbol: 'VEC', name: 'Vector', icon: '△', price: 61.8, changePct: 0, units: 0, avgCost: 0, volatility: 0.065, drift: 0.0008 },
  { id: 'TIDE', symbol: 'TIDE', name: 'Tide Protocol', icon: '≈', price: 3.2, changePct: 0, units: 0, avgCost: 0, volatility: 0.14, drift: 0.002 },
];

const defaultJobs = [
  { id: 'delivery', name: 'Delivery Rider', icon: '🚲', incomePerSec: 2.5, unlockNetWorth: 0 },
  { id: 'barista', name: 'Barista', icon: '☕️', incomePerSec: 5, unlockNetWorth: 500 },
  { id: 'sales', name: 'Sales Assistant', icon: '🛍️', incomePerSec: 9, unlockNetWorth: 5000 },
  { id: 'developer', name: 'Junior Developer', icon: '💻', incomePerSec: 18, unlockNetWorth: 25000 },
  { id: 'consultant', name: 'Consultant', icon: '📊', incomePerSec: 55, unlockNetWorth: 250000 },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const getBusinessIncome = (businesses) => businesses.reduce((sum, business) => sum + (business.incomePerSec || 0), 0);
const getPropertyIncome = (properties) => properties.reduce((sum, property) => sum + (property.rentPerSec || 0) * (property.count || 0), 0);
const getJobIncome = (jobs, activeJobId) => jobs.find((job) => job.id === activeJobId)?.incomePerSec || 0;
const getDividendIncome = (stocks) => stocks.reduce((sum, stock) => sum + stock.shares * stock.price * stock.yieldRate, 0);
const getPassiveFromSave = (save) =>
  getBusinessIncome(save.businesses || []) +
  getPropertyIncome(save.properties || []) +
  getJobIncome(save.jobs || defaultJobs, save.activeJobId) +
  getDividendIncome(save.stocks || defaultStocks);

export function GameProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickTier, setClickTier] = useState(0);
  const [businesses, setBusinesses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assets, setAssets] = useState([]);
  const [stocks, setStocks] = useState(clone(defaultStocks));
  const [crypto, setCrypto] = useState(clone(defaultCrypto));
  const [jobs, setJobs] = useState(clone(defaultJobs));
  const [activeJobId, setActiveJobId] = useState('delivery');
  const [taxDue, setTaxDue] = useState(0);
  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(Date.now());

  useEffect(() => {
    (async () => {
      try {
        const rawV2 = await AsyncStorage.getItem(SAVE_KEY);
        const rawLegacy = rawV2 ? null : await AsyncStorage.getItem(LEGACY_SAVE_KEY);
        const save = rawV2 ? JSON.parse(rawV2) : rawLegacy ? JSON.parse(rawLegacy) : null;

        if (save) {
          const migratedStocks = save.stocks?.some((stock) => defaultStocks.some((base) => base.id === stock.id))
            ? defaultStocks.map((base) => ({ ...base, ...(save.stocks.find((stock) => stock.id === base.id) || {}) }))
            : clone(defaultStocks);
          const migratedCrypto = defaultCrypto.map((base) => ({ ...base, ...(save.crypto?.find((coin) => coin.id === base.id) || {}) }));
          const migratedJobs = defaultJobs.map((base) => ({ ...base, ...(save.jobs?.find((job) => job.id === base.id) || {}) }));
          const savedAt = save.lastSavedAt || Date.now();
          const elapsedSeconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (Date.now() - savedAt) / 1000));
          const offline = rawV2 ? getPassiveFromSave({ ...save, stocks: migratedStocks, jobs: migratedJobs }) * elapsedSeconds : 0;

          setBalance((save.balance ?? 0) + offline);
          setTotalEarned((save.totalEarned ?? 0) + offline);
          setTotalClicks(save.totalClicks ?? 0);
          setClickTier(Math.min(save.clickTier ?? 0, clickTiers.length - 1));
          setBusinesses(save.businesses ?? []);
          setProperties(save.properties ?? []);
          setAssets(save.assets ?? []);
          setStocks(migratedStocks);
          setCrypto(migratedCrypto);
          setJobs(migratedJobs);
          setActiveJobId(save.activeJobId ?? 'delivery');
          setTaxDue(save.taxDue ?? 0);
          setOfflineEarnings(offline);
          setLastSavedAt(Date.now());
        }
      } catch (error) {
        console.warn('Minted save could not be loaded', error);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const businessIncomePerSec = useMemo(() => getBusinessIncome(businesses), [businesses]);
  const propertyIncomePerSec = useMemo(() => getPropertyIncome(properties), [properties]);
  const jobIncomePerSec = useMemo(() => getJobIncome(jobs, activeJobId), [jobs, activeJobId]);
  const dividendIncomePerSec = useMemo(() => getDividendIncome(stocks), [stocks]);
  const passivePerSec = businessIncomePerSec + propertyIncomePerSec + jobIncomePerSec + dividendIncomePerSec;

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(() => {
      const add = passivePerSec / 5;
      if (add <= 0) return;
      setBalance((value) => value + add);
      setTotalEarned((value) => value + add);
      setTaxDue((value) => value + add * 0.04);
    }, 200);
    return () => clearInterval(id);
  }, [loaded, passivePerSec]);

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(() => {
      const moveMarket = (items) => items.map((item) => {
        const shock = (Math.random() - 0.49) * item.volatility;
        const move = Math.max(-0.18, Math.min(0.18, shock + item.drift));
        const nextPrice = Math.max(0.25, item.price * (1 + move));
        return { ...item, price: nextPrice, changePct: move * 100 };
      });
      setStocks((items) => moveMarket(items));
      setCrypto((items) => moveMarket(items));
    }, 4500);
    return () => clearInterval(id);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(async () => {
      const now = Date.now();
      setLastSavedAt(now);
      try {
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify({
          balance,
          totalEarned,
          totalClicks,
          clickTier,
          businesses,
          properties,
          assets,
          stocks,
          crypto,
          jobs,
          activeJobId,
          taxDue,
          lastSavedAt: now,
        }));
      } catch (error) {
        console.warn('Minted save could not be written', error);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [loaded, balance, totalEarned, totalClicks, clickTier, businesses, properties, assets, stocks, crypto, jobs, activeJobId, taxDue]);

  const stockValue = useMemo(() => stocks.reduce((sum, stock) => sum + stock.shares * stock.price, 0), [stocks]);
  const cryptoValue = useMemo(() => crypto.reduce((sum, coin) => sum + coin.units * coin.price, 0), [crypto]);
  const marketValue = stockValue + cryptoValue;
  const businessValue = useMemo(() => businesses.reduce((sum, business) => sum + business.value, 0), [businesses]);
  const propertyValue = useMemo(() => properties.reduce((sum, property) => sum + property.value, 0), [properties]);
  const assetValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.cost, 0), [assets]);
  const prestige = useMemo(() => assets.reduce((sum, asset) => sum + asset.prestige, 0), [assets]);
  const netWorth = Math.max(0, balance + businessValue + propertyValue + marketValue + assetValue - taxDue);

  const clickValue = clickTiers[clickTier];
  const maxClick = clickTier === clickTiers.length - 1;
  const nextClickValue = maxClick ? clickValue : clickTiers[clickTier + 1];
  const clickUpgradeCost = maxClick ? 0 : clickCosts[clickTier + 1];
  const canBuyClick = !maxClick && balance >= clickUpgradeCost;

  const businessCatalog = businessCatalogData.map((business, index) => ({
    ...business,
    unlocked: index === 0 || netWorth >= business.cost * 0.35,
  }));
  const propertyCatalog = propertyCatalogData.map((property, index) => ({
    ...property,
    unlocked: index === 0 || netWorth >= property.cost * 0.3,
  }));
  const assetCatalog = assetCatalogData.map((asset, index) => ({
    ...asset,
    unlocked: index === 0 || netWorth >= asset.cost * 0.25,
    owned: assets.some((owned) => owned.id === asset.id),
  }));

  const spend = (amount) => {
    if (balance < amount) return false;
    setBalance((value) => value - amount);
    return true;
  };

  const tap = () => {
    setBalance((value) => value + clickValue);
    setTotalEarned((value) => value + clickValue);
    setTotalClicks((value) => value + 1);
    setTaxDue((value) => value + clickValue * 0.01);
  };

  const buyClickUpgrade = () => {
    if (!canBuyClick || !spend(clickUpgradeCost)) return;
    setClickTier((value) => Math.min(value + 1, clickTiers.length - 1));
  };

  const buyBusiness = (id) => {
    const base = businessCatalog.find((business) => business.id === id);
    if (!base || !base.unlocked || businesses.some((business) => business.id === id) || !spend(base.cost)) return;
    setBusinesses((items) => [...items, {
      id: base.id,
      name: base.name,
      icon: base.icon,
      industry: base.industry,
      units: 1,
      level: 1,
      multiplier: 1,
      incomePerSec: base.baseIncome,
      unitCost: Math.ceil(base.cost * 0.6),
      upgradeCost: Math.ceil(base.cost * 1.25),
      value: base.cost,
    }]);
  };

  const expandBusiness = (id) => {
    const owned = businesses.find((business) => business.id === id);
    const base = businessCatalogData.find((business) => business.id === id);
    if (!owned || !base || !spend(owned.unitCost)) return;
    setBusinesses((items) => items.map((business) => business.id === id ? {
      ...business,
      units: business.units + 1,
      incomePerSec: business.incomePerSec + base.baseIncome * business.multiplier,
      value: business.value + business.unitCost,
      unitCost: Math.ceil(business.unitCost * 1.18),
    } : business));
  };

  const upgradeBusiness = (id) => {
    const owned = businesses.find((business) => business.id === id);
    if (!owned || !spend(owned.upgradeCost)) return;
    setBusinesses((items) => items.map((business) => business.id === id ? {
      ...business,
      level: business.level + 1,
      multiplier: business.multiplier * 1.35,
      incomePerSec: business.incomePerSec * 1.35,
      value: business.value + business.upgradeCost,
      upgradeCost: Math.ceil(business.upgradeCost * 2.05),
    } : business));
  };

  const buyProperty = (id) => {
    const base = propertyCatalog.find((property) => property.id === id);
    if (!base || !base.unlocked || !spend(base.cost)) return;
    setProperties((items) => {
      const owned = items.find((property) => property.id === id);
      if (owned) {
        return items.map((property) => property.id === id ? {
          ...property,
          count: property.count + 1,
          value: property.value + base.cost,
        } : property);
      }
      return [...items, { ...base, count: 1, value: base.cost }];
    });
  };

  const buyAsset = (id) => {
    const item = assetCatalog.find((asset) => asset.id === id);
    if (!item || item.owned || !item.unlocked || !spend(item.cost)) return;
    setAssets((items) => [...items, item]);
  };

  const buyStock = (id) => {
    const item = stocks.find((stock) => stock.id === id);
    if (!item || !spend(item.price)) return;
    setStocks((items) => items.map((stock) => stock.id === id ? {
      ...stock,
      avgCost: ((stock.avgCost * stock.shares) + stock.price) / (stock.shares + 1),
      shares: stock.shares + 1,
    } : stock));
  };

  const sellStock = (id) => {
    const item = stocks.find((stock) => stock.id === id);
    if (!item || item.shares <= 0) return;
    setBalance((value) => value + item.price);
    setStocks((items) => items.map((stock) => stock.id === id ? { ...stock, shares: stock.shares - 1 } : stock));
  };

  const buyCrypto = (id) => {
    const item = crypto.find((coin) => coin.id === id);
    if (!item || !spend(item.price)) return;
    setCrypto((items) => items.map((coin) => coin.id === id ? {
      ...coin,
      avgCost: ((coin.avgCost * coin.units) + coin.price) / (coin.units + 1),
      units: coin.units + 1,
    } : coin));
  };

  const sellCrypto = (id) => {
    const item = crypto.find((coin) => coin.id === id);
    if (!item || item.units <= 0) return;
    setBalance((value) => value + item.price);
    setCrypto((items) => items.map((coin) => coin.id === id ? { ...coin, units: coin.units - 1 } : coin));
  };

  const takeJob = (id) => {
    const job = jobs.find((item) => item.id === id);
    if (!job || netWorth < job.unlockNetWorth) return;
    setActiveJobId(id);
  };

  const payTaxes = () => {
    if (taxDue <= 0 || balance <= 0) return;
    const payment = Math.min(balance, taxDue);
    setBalance((value) => value - payment);
    setTaxDue((value) => Math.max(0, value - payment));
  };

  const clearOfflineEarnings = () => setOfflineEarnings(0);

  return (
    <GameContext.Provider value={{
      loaded,
      balance,
      totalEarned,
      totalClicks,
      clickValue,
      nextClickValue,
      clickUpgradeCost,
      canBuyClick,
      maxClick,
      passivePerSec,
      businessIncomePerSec,
      propertyIncomePerSec,
      jobIncomePerSec,
      dividendIncomePerSec,
      businesses,
      businessCatalog,
      properties,
      propertyCatalog,
      assets,
      assetCatalog,
      stocks,
      crypto,
      jobs,
      activeJobId,
      stockValue,
      cryptoValue,
      marketValue,
      businessValue,
      propertyValue,
      assetValue,
      prestige,
      netWorth,
      taxDue,
      offlineEarnings,
      lastSavedAt,
      tap,
      buyClickUpgrade,
      buyBusiness,
      expandBusiness,
      upgradeBusiness,
      buyProperty,
      buyAsset,
      buyStock,
      sellStock,
      buyCrypto,
      sellCrypto,
      takeJob,
      payTaxes,
      clearOfflineEarnings,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
