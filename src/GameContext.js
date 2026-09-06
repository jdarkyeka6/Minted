import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext(null);
const SAVE_KEY = 'minted-save-v3';
const LEGACY_KEYS = ['minted-save-v2', 'minted-save-v1'];
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
const MARKET_TICK_MS = 4500;
const MARKET_EVENT_MS = 22000;

const clickTiers = [1, 3, 10, 50, 250, 1000, 5000, 25000, 100000, 500000];
const clickCosts = [0, 50, 400, 4000, 30000, 250000, 2000000, 15000000, 120000000, 900000000];

const businessCatalogData = [
  { id: 'cart', name: 'Street Cart', icon: '🥤', industry: 'Food', cost: 150, baseIncome: 0.45, margin: 0.42, staff: 2 },
  { id: 'coffee', name: 'Coffee House', icon: '☕️', industry: 'Food', cost: 2500, baseIncome: 5, margin: 0.34, staff: 6 },
  { id: 'studio', name: 'Design Studio', icon: '🎨', industry: 'Creative', cost: 22000, baseIncome: 38, margin: 0.48, staff: 12 },
  { id: 'logistics', name: 'Atlas Logistics', icon: '🚚', industry: 'Transport', cost: 160000, baseIncome: 230, margin: 0.29, staff: 28 },
  { id: 'software', name: 'Orbit Software', icon: '💻', industry: 'Technology', cost: 1400000, baseIncome: 1800, margin: 0.58, staff: 45 },
  { id: 'factory', name: 'Forge Industries', icon: '🏭', industry: 'Manufacturing', cost: 12000000, baseIncome: 16500, margin: 0.25, staff: 95 },
  { id: 'bank', name: 'Crown Capital', icon: '🏦', industry: 'Finance', cost: 110000000, baseIncome: 145000, margin: 0.51, staff: 180 },
  { id: 'airline', name: 'Nova Air', icon: '✈️', industry: 'Transport', cost: 950000000, baseIncome: 1100000, margin: 0.18, staff: 620 },
  { id: 'space', name: 'Asterion Space', icon: '🚀', industry: 'Technology', cost: 8500000000, baseIncome: 8800000, margin: 0.31, staff: 1300 },
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
  { id: 'moon', name: 'Lunar Residence', icon: '🌕', cost: 9000000000, prestige: 35000 },
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
  { id: 'executive', name: 'Executive', icon: '🧥', incomePerSec: 180, unlockNetWorth: 2500000 },
];

const rankTiers = [
  { name: 'Starter', min: 0, icon: '•' },
  { name: 'Builder', min: 1000, icon: '◆' },
  { name: 'Operator', min: 10000, icon: '▦' },
  { name: 'Mogul', min: 100000, icon: '◇' },
  { name: 'Millionaire', min: 1000000, icon: 'M' },
  { name: 'Tycoon', min: 10000000, icon: 'T' },
  { name: 'Titan', min: 100000000, icon: '▲' },
  { name: 'Billionaire', min: 1000000000, icon: 'B' },
  { name: 'Empire', min: 10000000000, icon: '∞' },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const todayKey = () => new Date().toISOString().slice(0, 10);
const keyToDayNumber = (key) => Math.floor(Date.parse(`${key}T00:00:00Z`) / 86400000);

const getBusinessIncome = (businesses) => businesses.reduce((sum, business) => sum + (business.incomePerSec || 0), 0);
const getPropertyIncome = (properties) => properties.reduce((sum, property) => sum + (property.rentPerSec || 0) * (property.count || 0), 0);
const getJobIncome = (jobs, activeJobId) => jobs.find((job) => job.id === activeJobId)?.incomePerSec || 0;
const getDividendIncome = (stocks) => stocks.reduce((sum, stock) => sum + stock.shares * stock.price * stock.yieldRate, 0);
const getPassiveFromSave = (save) =>
  getBusinessIncome(save.businesses || []) +
  getPropertyIncome(save.properties || []) +
  getJobIncome(save.jobs || defaultJobs, save.activeJobId) +
  getDividendIncome(save.stocks || defaultStocks);

const mergeMarket = (defaults, saved, quantityKey) =>
  defaults.map((base) => {
    const prior = saved?.find((item) => item.id === base.id);
    if (!prior) return { ...base };
    return {
      ...base,
      ...prior,
      [quantityKey]: Number(prior[quantityKey] || 0),
      avgCost: Number(prior.avgCost || 0),
    };
  });

const addActivityItem = (setActivity, text, type = 'money') => {
  setActivity((items) => [
    { id: `${Date.now()}-${Math.random()}`, text, type, at: Date.now() },
    ...items,
  ].slice(0, 24));
};

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
  const [activity, setActivity] = useState([]);
  const [claimedAchievements, setClaimedAchievements] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastDailyClaim, setLastDailyClaim] = useState(null);
  const [marketHeadline, setMarketHeadline] = useState('Markets are open. Prices move every few seconds.');

  useEffect(() => {
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(SAVE_KEY);
        let sourceKey = SAVE_KEY;

        if (!raw) {
          for (const key of LEGACY_KEYS) {
            raw = await AsyncStorage.getItem(key);
            if (raw) {
              sourceKey = key;
              break;
            }
          }
        }

        if (raw) {
          const save = JSON.parse(raw);
          const migratedStocks = mergeMarket(defaultStocks, save.stocks, 'shares');
          const migratedCrypto = mergeMarket(defaultCrypto, save.crypto, 'units');
          const migratedJobs = defaultJobs.map((base) => ({ ...base, ...(save.jobs?.find((job) => job.id === base.id) || {}) }));
          const migratedBusinesses = (save.businesses || []).map((business) => {
            const base = businessCatalogData.find((item) => item.id === business.id);
            const managerLevel = business.managerLevel || 0;
            return {
              ...business,
              level: business.level || 1,
              units: business.units || 1,
              multiplier: business.multiplier || 1,
              managerLevel,
              managerCost: business.managerCost || Math.ceil((base?.cost || Math.max(1, business.value || 1)) * 2.4 * Math.pow(2.7, managerLevel)),
            };
          });
          const savedAt = save.lastSavedAt || Date.now();
          const elapsedSeconds = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (Date.now() - savedAt) / 1000));
          const offline = sourceKey === 'minted-save-v1'
            ? 0
            : getPassiveFromSave({ ...save, businesses: migratedBusinesses, stocks: migratedStocks, jobs: migratedJobs }) * elapsedSeconds;

          setBalance(Number(save.balance || 0) + offline);
          setTotalEarned(Number(save.totalEarned || 0) + offline);
          setTotalClicks(Number(save.totalClicks || 0));
          setClickTier(Math.min(Number(save.clickTier || 0), clickTiers.length - 1));
          setBusinesses(migratedBusinesses);
          setProperties(save.properties || []);
          setAssets(save.assets || []);
          setStocks(migratedStocks);
          setCrypto(migratedCrypto);
          setJobs(migratedJobs);
          setActiveJobId(save.activeJobId || 'delivery');
          setTaxDue(Number(save.taxDue || 0));
          setOfflineEarnings(offline);
          setActivity(save.activity || []);
          setClaimedAchievements(save.claimedAchievements || []);
          setDailyStreak(Number(save.dailyStreak || 0));
          setLastDailyClaim(save.lastDailyClaim || null);
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
      setTaxDue((value) => value + add * 0.035);
    }, 200);
    return () => clearInterval(id);
  }, [loaded, passivePerSec]);

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(() => {
      const moveMarket = (items) => items.map((item) => {
        const shock = (Math.random() - 0.49) * item.volatility;
        const move = clamp(shock + item.drift, -0.18, 0.18);
        const nextPrice = Math.max(0.25, item.price * (1 + move));
        return { ...item, price: nextPrice, changePct: move * 100 };
      });
      setStocks((items) => moveMarket(items));
      setCrypto((items) => moveMarket(items));
    }, MARKET_TICK_MS);
    return () => clearInterval(id);
  }, [loaded]);

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(() => {
      const useCrypto = Math.random() < 0.35;
      const source = useCrypto ? defaultCrypto : defaultStocks;
      const target = source[Math.floor(Math.random() * source.length)];
      const positive = Math.random() > 0.45;
      const magnitude = 0.04 + Math.random() * 0.12;
      const move = positive ? magnitude : -magnitude;
      const setter = useCrypto ? setCrypto : setStocks;
      setter((items) => items.map((item) => item.id === target.id
        ? { ...item, price: Math.max(0.25, item.price * (1 + move)), changePct: move * 100 }
        : item));
      const verb = positive
        ? ['surges after a strong update', 'jumps on fresh demand', 'rallies after upbeat guidance'][Math.floor(Math.random() * 3)]
        : ['slides after a weak report', 'drops on nervous trading', 'falls after a rough outlook'][Math.floor(Math.random() * 3)];
      setMarketHeadline(`${target.symbol} ${verb} · ${move > 0 ? '+' : ''}${(move * 100).toFixed(1)}%`);
    }, MARKET_EVENT_MS);
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
          activity,
          claimedAchievements,
          dailyStreak,
          lastDailyClaim,
          lastSavedAt: now,
        }));
      } catch (error) {
        console.warn('Minted save could not be written', error);
      }
    }, 2500);
    return () => clearInterval(id);
  }, [
    loaded,
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
    activity,
    claimedAchievements,
    dailyStreak,
    lastDailyClaim,
  ]);

  const stockValue = useMemo(() => stocks.reduce((sum, stock) => sum + stock.shares * stock.price, 0), [stocks]);
  const cryptoValue = useMemo(() => crypto.reduce((sum, coin) => sum + coin.units * coin.price, 0), [crypto]);
  const marketValue = stockValue + cryptoValue;
  const businessValue = useMemo(() => businesses.reduce((sum, business) => sum + (business.value || 0), 0), [businesses]);
  const propertyValue = useMemo(() => properties.reduce((sum, property) => sum + (property.value || 0), 0), [properties]);
  const assetValue = useMemo(() => assets.reduce((sum, asset) => sum + (asset.cost || 0), 0), [assets]);
  const prestige = useMemo(() => assets.reduce((sum, asset) => sum + (asset.prestige || 0), 0), [assets]);
  const netWorth = Math.max(0, balance + businessValue + propertyValue + marketValue + assetValue - taxDue);

  const rankIndex = rankTiers.reduce((best, tier, index) => netWorth >= tier.min ? index : best, 0);
  const rank = rankTiers[rankIndex];
  const nextRank = rankTiers[rankIndex + 1] || null;
  const rankProgress = nextRank
    ? clamp((netWorth - rank.min) / Math.max(1, nextRank.min - rank.min), 0, 1)
    : 1;

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

  const dailyAvailable = lastDailyClaim !== todayKey();
  const dailyReward = Math.max(250, Math.min(50000000, 250 + netWorth * 0.002 + Math.max(1, dailyStreak + 1) * 250));

  const achievements = [
    { id: 'first1k', title: 'Four figures', detail: 'Reach $1K net worth', reward: 500, unlocked: netWorth >= 1000 },
    { id: 'business', title: 'Founder', detail: 'Open your first business', reward: 1250, unlocked: businesses.length > 0 },
    { id: 'investor', title: 'Investor', detail: 'Own any stock or crypto', reward: 2500, unlocked: stocks.some((s) => s.shares > 0) || crypto.some((c) => c.units > 0) },
    { id: 'landlord', title: 'Landlord', detail: 'Buy your first property', reward: 5000, unlocked: properties.length > 0 },
    { id: '100k', title: 'Six figures', detail: 'Reach $100K net worth', reward: 20000, unlocked: netWorth >= 100000 },
    { id: 'million', title: 'Millionaire', detail: 'Reach $1M net worth', reward: 150000, unlocked: netWorth >= 1000000 },
    { id: 'mogul', title: 'Portfolio monster', detail: 'Own 5 businesses or properties', reward: 500000, unlocked: businesses.length + properties.length >= 5 },
    { id: 'billion', title: 'Billion club', detail: 'Reach $1B net worth', reward: 25000000, unlocked: netWorth >= 1000000000 },
  ].map((achievement) => ({
    ...achievement,
    claimed: claimedAchievements.includes(achievement.id),
  }));

  const spend = (amount) => {
    if (!Number.isFinite(amount) || amount <= 0 || balance < amount) return false;
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
    addActivityItem(setActivity, `Tap power upgraded to $${nextClickValue.toLocaleString()} per tap.`, 'upgrade');
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
      managerLevel: 0,
      incomePerSec: base.baseIncome,
      unitCost: Math.ceil(base.cost * 0.6),
      upgradeCost: Math.ceil(base.cost * 1.25),
      managerCost: Math.ceil(base.cost * 2.4),
      value: base.cost,
    }]);
    addActivityItem(setActivity, `${base.name} launched.`, 'business');
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
    addActivityItem(setActivity, `${owned.name} expanded to ${owned.units + 1} locations.`, 'business');
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
    addActivityItem(setActivity, `${owned.name} upgraded to level ${owned.level + 1}.`, 'upgrade');
  };

  const hireManager = (id) => {
    const owned = businesses.find((business) => business.id === id);
    const managerCost = owned?.managerCost || 0;
    if (!owned || !spend(managerCost)) return;
    setBusinesses((items) => items.map((business) => business.id === id ? {
      ...business,
      managerLevel: (business.managerLevel || 0) + 1,
      multiplier: business.multiplier * 1.2,
      incomePerSec: business.incomePerSec * 1.2,
      value: business.value + managerCost,
      managerCost: Math.ceil(managerCost * 2.7),
    } : business));
    addActivityItem(setActivity, `${owned.name} hired a stronger management team.`, 'upgrade');
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
    addActivityItem(setActivity, `${base.name} purchased in ${base.location}.`, 'property');
  };

  const buyAsset = (id) => {
    const item = assetCatalog.find((asset) => asset.id === id);
    if (!item || item.owned || !item.unlocked || !spend(item.cost)) return;
    setAssets((items) => [...items, item]);
    addActivityItem(setActivity, `${item.name} added to the collection.`, 'asset');
  };

  const tradeStock = (id, quantity, direction) => {
    const item = stocks.find((stock) => stock.id === id);
    const qty = Math.max(1, Math.floor(quantity || 1));
    if (!item) return;
    if (direction === 'buy') {
      const cost = item.price * qty;
      if (!spend(cost)) return;
      setStocks((items) => items.map((stock) => stock.id === id ? {
        ...stock,
        avgCost: ((stock.avgCost * stock.shares) + cost) / (stock.shares + qty),
        shares: stock.shares + qty,
      } : stock));
      addActivityItem(setActivity, `Bought ${qty} ${item.symbol} for $${Math.round(cost).toLocaleString()}.`, 'market');
    } else {
      const actualQty = Math.min(qty, item.shares);
      if (actualQty <= 0) return;
      const proceeds = item.price * actualQty;
      setBalance((value) => value + proceeds);
      setStocks((items) => items.map((stock) => stock.id === id ? {
        ...stock,
        shares: stock.shares - actualQty,
        avgCost: stock.shares - actualQty <= 0 ? 0 : stock.avgCost,
      } : stock));
      addActivityItem(setActivity, `Sold ${actualQty} ${item.symbol} for $${Math.round(proceeds).toLocaleString()}.`, 'market');
    }
  };

  const tradeCrypto = (id, quantity, direction) => {
    const item = crypto.find((coin) => coin.id === id);
    const qty = Math.max(1, Math.floor(quantity || 1));
    if (!item) return;
    if (direction === 'buy') {
      const cost = item.price * qty;
      if (!spend(cost)) return;
      setCrypto((items) => items.map((coin) => coin.id === id ? {
        ...coin,
        avgCost: ((coin.avgCost * coin.units) + cost) / (coin.units + qty),
        units: coin.units + qty,
      } : coin));
      addActivityItem(setActivity, `Bought ${qty} ${item.symbol} for $${Math.round(cost).toLocaleString()}.`, 'market');
    } else {
      const actualQty = Math.min(qty, item.units);
      if (actualQty <= 0) return;
      const proceeds = item.price * actualQty;
      setBalance((value) => value + proceeds);
      setCrypto((items) => items.map((coin) => coin.id === id ? {
        ...coin,
        units: coin.units - actualQty,
        avgCost: coin.units - actualQty <= 0 ? 0 : coin.avgCost,
      } : coin));
      addActivityItem(setActivity, `Sold ${actualQty} ${item.symbol} for $${Math.round(proceeds).toLocaleString()}.`, 'market');
    }
  };

  const buyStock = (id, quantity = 1) => tradeStock(id, quantity, 'buy');
  const sellStock = (id, quantity = 1) => tradeStock(id, quantity, 'sell');
  const buyCrypto = (id, quantity = 1) => tradeCrypto(id, quantity, 'buy');
  const sellCrypto = (id, quantity = 1) => tradeCrypto(id, quantity, 'sell');

  const takeJob = (id) => {
    const job = jobs.find((item) => item.id === id);
    if (!job || netWorth < job.unlockNetWorth) return;
    setActiveJobId(id);
    addActivityItem(setActivity, `${job.name} is now your active career.`, 'career');
  };

  const payTaxes = () => {
    if (taxDue <= 0 || balance <= 0) return;
    const payment = Math.min(balance, taxDue);
    setBalance((value) => value - payment);
    setTaxDue((value) => Math.max(0, value - payment));
    addActivityItem(setActivity, `Paid $${Math.round(payment).toLocaleString()} in taxes.`, 'tax');
  };

  const claimDaily = () => {
    if (!dailyAvailable) return;
    const today = todayKey();
    let nextStreak = 1;
    if (lastDailyClaim) {
      const diff = keyToDayNumber(today) - keyToDayNumber(lastDailyClaim);
      nextStreak = diff === 1 ? dailyStreak + 1 : 1;
    }
    const reward = Math.max(250, Math.min(50000000, 250 + netWorth * 0.002 + nextStreak * 250));
    setBalance((value) => value + reward);
    setTotalEarned((value) => value + reward);
    setDailyStreak(nextStreak);
    setLastDailyClaim(today);
    addActivityItem(setActivity, `Daily streak ${nextStreak}: +$${Math.round(reward).toLocaleString()}.`, 'reward');
  };

  const claimAchievement = (id) => {
    const achievement = achievements.find((item) => item.id === id);
    if (!achievement || !achievement.unlocked || achievement.claimed) return;
    setClaimedAchievements((items) => [...items, id]);
    setBalance((value) => value + achievement.reward);
    setTotalEarned((value) => value + achievement.reward);
    addActivityItem(setActivity, `${achievement.title} claimed: +$${achievement.reward.toLocaleString()}.`, 'reward');
  };

  const clearOfflineEarnings = () => setOfflineEarnings(0);

  const getBusinessDetails = (id) => {
    const owned = businesses.find((business) => business.id === id);
    const base = businessCatalogData.find((business) => business.id === id);
    if (!owned || !base) return null;
    const profit = owned.incomePerSec;
    const revenue = profit / Math.max(0.08, base.margin);
    const expenses = revenue - profit;
    const employees = Math.max(1, Math.round(base.staff * owned.units * (1 + (owned.level - 1) * 0.18)));
    const reputation = clamp(56 + owned.level * 5 + (owned.managerLevel || 0) * 7 + Math.log10(owned.units + 1) * 8, 0, 99);
    return { revenuePerSec: revenue, expensesPerSec: expenses, profitPerSec: profit, employees, reputation };
  };

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
      activity,
      achievements,
      dailyAvailable,
      dailyReward,
      dailyStreak,
      marketHeadline,
      rank,
      nextRank,
      rankProgress,
      tap,
      buyClickUpgrade,
      buyBusiness,
      expandBusiness,
      upgradeBusiness,
      hireManager,
      buyProperty,
      buyAsset,
      buyStock,
      sellStock,
      buyCrypto,
      sellCrypto,
      takeJob,
      payTaxes,
      claimDaily,
      claimAchievement,
      clearOfflineEarnings,
      getBusinessDetails,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
