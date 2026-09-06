import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext(null);
const SAVE_KEY = 'minted-save-v3';
const LEGACY_KEYS = ['minted-save-v2', 'minted-save-v1'];
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;

const clickTiers = [1, 3, 10, 50, 250, 1000, 5000, 25000, 100000, 500000];
const clickCosts = [0, 50, 400, 4000, 30000, 250000, 2000000, 15000000, 120000000, 900000000];

const businessCatalogData = [
  { id: 'cart', name: 'Street Cart', icon: '🥤', industry: 'Food', cost: 150, baseIncome: 0.45, risk: 'Low' },
  { id: 'coffee', name: 'Coffee House', icon: '☕️', industry: 'Food', cost: 2500, baseIncome: 5, risk: 'Low' },
  { id: 'studio', name: 'Design Studio', icon: '🎨', industry: 'Creative', cost: 22000, baseIncome: 38, risk: 'Medium' },
  { id: 'logistics', name: 'Atlas Logistics', icon: '🚚', industry: 'Transport', cost: 160000, baseIncome: 230, risk: 'Medium' },
  { id: 'software', name: 'Orbit Software', icon: '💻', industry: 'Technology', cost: 1400000, baseIncome: 1800, risk: 'High' },
  { id: 'factory', name: 'Forge Industries', icon: '🏭', industry: 'Manufacturing', cost: 12000000, baseIncome: 16500, risk: 'Medium' },
  { id: 'bank', name: 'Crown Capital', icon: '🏦', industry: 'Finance', cost: 110000000, baseIncome: 145000, risk: 'High' },
  { id: 'airline', name: 'Nova Air', icon: '✈️', industry: 'Transport', cost: 950000000, baseIncome: 1100000, risk: 'High' },
  { id: 'space', name: 'Asterion Space', icon: '🚀', industry: 'Technology', cost: 8500000000, baseIncome: 8800000, risk: 'Extreme' },
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

const baseStocks = [
  { id: 'NSAI', symbol: 'NSAI', name: 'Northstar AI', icon: '✦', price: 86.25, shares: 0, avgCost: 0, volatility: 0.035, drift: 0.0015, yieldRate: 0.00007, sector: 'Technology' },
  { id: 'VLT', symbol: 'VLT', name: 'Volterra Motors', icon: 'V', price: 42.6, shares: 0, avgCost: 0, volatility: 0.045, drift: 0.001, yieldRate: 0.00004, sector: 'Transport' },
  { id: 'HEL', symbol: 'HEL', name: 'Helio Energy', icon: '☀', price: 28.4, shares: 0, avgCost: 0, volatility: 0.025, drift: 0.001, yieldRate: 0.00012, sector: 'Energy' },
  { id: 'ATL', symbol: 'ATL', name: 'Atlas Retail', icon: 'A', price: 61.1, shares: 0, avgCost: 0, volatility: 0.02, drift: 0.0005, yieldRate: 0.00016, sector: 'Retail' },
  { id: 'ORB', symbol: 'ORB', name: 'Orbit Systems', icon: '◉', price: 133.75, shares: 0, avgCost: 0, volatility: 0.03, drift: 0.0012, yieldRate: 0.00008, sector: 'Technology' },
  { id: 'CND', symbol: 'CND', name: 'Cinder Labs', icon: 'C', price: 18.95, shares: 0, avgCost: 0, volatility: 0.06, drift: 0.0018, yieldRate: 0.00002, sector: 'Biotech' },
];

const baseCrypto = [
  { id: 'MNT', symbol: 'MNT', name: 'MintCoin', icon: 'M', price: 24.4, units: 0, avgCost: 0, volatility: 0.08, drift: 0.001 },
  { id: 'NOVA', symbol: 'NOVA', name: 'Nova', icon: '✧', price: 8.75, units: 0, avgCost: 0, volatility: 0.11, drift: 0.0015 },
  { id: 'VEC', symbol: 'VEC', name: 'Vector', icon: '△', price: 61.8, units: 0, avgCost: 0, volatility: 0.065, drift: 0.0008 },
  { id: 'TIDE', symbol: 'TIDE', name: 'Tide Protocol', icon: '≈', price: 3.2, units: 0, avgCost: 0, volatility: 0.14, drift: 0.002 },
];

const jobsData = [
  { id: 'delivery', name: 'Delivery Rider', icon: '🚲', incomePerSec: 2.5, unlockNetWorth: 0 },
  { id: 'barista', name: 'Barista', icon: '☕️', incomePerSec: 5, unlockNetWorth: 500 },
  { id: 'sales', name: 'Sales Assistant', icon: '🛍️', incomePerSec: 9, unlockNetWorth: 5000 },
  { id: 'developer', name: 'Junior Developer', icon: '💻', incomePerSec: 18, unlockNetWorth: 25000 },
  { id: 'consultant', name: 'Consultant', icon: '📊', incomePerSec: 55, unlockNetWorth: 250000 },
  { id: 'banker', name: 'Investment Banker', icon: '🏦', incomePerSec: 180, unlockNetWorth: 2500000 },
];

const eventDeck = [
  { id: 'ai-boom', title: 'AI boom', body: 'Tech names are catching a bid.', type: 'bull', sector: 'Technology', strength: 0.05, icon: '🤖' },
  { id: 'fuel-spike', title: 'Fuel shock', body: 'Transport margins are getting squeezed.', type: 'bear', sector: 'Transport', strength: -0.045, icon: '⛽️' },
  { id: 'rate-cut', title: 'Rate cut', body: 'Risk assets love it. Everything gets a little warmer.', type: 'bull', sector: 'ALL', strength: 0.028, icon: '📉' },
  { id: 'panic', title: 'Market panic', body: 'Traders are smashing the sell button.', type: 'bear', sector: 'ALL', strength: -0.035, icon: '🚨' },
  { id: 'retail-rush', title: 'Consumer rush', body: 'Retail and food demand just jumped.', type: 'bull', sector: 'Retail', strength: 0.045, icon: '🛍️' },
  { id: 'quiet', title: 'Quiet tape', body: 'Markets are oddly calm. Volatility cools off.', type: 'neutral', sector: 'ALL', strength: 0.006, icon: '🌙' },
];

const missionTemplates = [
  { id: 'tap-50', title: 'Make it rain', body: 'Tap 50 times', metric: 'clicks', target: 50, reward: 400 },
  { id: 'buy-business', title: 'Founder mode', body: 'Own 2 businesses', metric: 'businesses', target: 2, reward: 1800 },
  { id: 'market-10', title: 'Open the terminal', body: 'Own 10 market units', metric: 'marketUnits', target: 10, reward: 2200 },
  { id: 'property-1', title: 'Landlord arc', body: 'Own a property', metric: 'properties', target: 1, reward: 3500 },
  { id: 'worth-100k', title: 'Six figures', body: 'Reach $100K net worth', metric: 'netWorth', target: 100000, reward: 10000 },
];

const clone = (value) => JSON.parse(JSON.stringify(value));
const seedMarket = (items, unitKey) => items.map((item) => ({ ...item, changePct: 0, history: Array(12).fill(item.price), [unitKey]: item[unitKey] || 0 }));

function normalizeMarket(saved, base, unitKey) {
  return base.map((item) => {
    const old = saved?.find((savedItem) => savedItem.id === item.id) || {};
    const price = old.price ?? item.price;
    const history = Array.isArray(old.history) && old.history.length ? old.history.slice(-12) : Array(12).fill(price);
    return { ...item, ...old, [unitKey]: old[unitKey] || 0, price, history };
  });
}

const businessIncome = (businesses) => businesses.reduce((sum, item) => sum + (item.incomePerSec || 0), 0);
const propertyIncome = (properties) => properties.reduce((sum, item) => sum + (item.rentPerSec || 0) * (item.count || 0), 0);
const jobIncome = (jobs, activeJobId) => jobs.find((job) => job.id === activeJobId)?.incomePerSec || 0;
const dividendIncome = (stocks) => stocks.reduce((sum, stock) => sum + stock.shares * stock.price * stock.yieldRate, 0);
const marketUnits = (stocks, crypto) => stocks.reduce((sum, item) => sum + item.shares, 0) + crypto.reduce((sum, item) => sum + item.units, 0);

export function GameProvider({ children }) {
  const [loaded, setLoaded] = useState(false);
  const [balance, setBalance] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [clickTier, setClickTier] = useState(0);
  const [businesses, setBusinesses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [assets, setAssets] = useState([]);
  const [stocks, setStocks] = useState(seedMarket(baseStocks, 'shares'));
  const [crypto, setCrypto] = useState(seedMarket(baseCrypto, 'units'));
  const [jobs, setJobs] = useState(clone(jobsData));
  const [activeJobId, setActiveJobId] = useState('delivery');
  const [taxDue, setTaxDue] = useState(0);
  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(Date.now());
  const [event, setEvent] = useState(eventDeck[5]);
  const [eventEndsAt, setEventEndsAt] = useState(Date.now() + 45000);
  const [claimedMissions, setClaimedMissions] = useState([]);
  const [combo, setCombo] = useState(0);
  const [lastTapReward, setLastTapReward] = useState(0);
  const [lastTapCritical, setLastTapCritical] = useState(false);
  const lastTapAtRef = useRef(0);

  useEffect(() => {
    (async () => {
      try {
        let raw = await AsyncStorage.getItem(SAVE_KEY);
        if (!raw) {
          for (const key of LEGACY_KEYS) {
            raw = await AsyncStorage.getItem(key);
            if (raw) break;
          }
        }
        const save = raw ? JSON.parse(raw) : null;
        if (save) {
          const migratedStocks = normalizeMarket(save.stocks, baseStocks, 'shares');
          const migratedCrypto = normalizeMarket(save.crypto, baseCrypto, 'units');
          const migratedJobs = jobsData.map((base) => ({ ...base, ...(save.jobs?.find((job) => job.id === base.id) || {}) }));
          const savedAt = save.lastSavedAt || Date.now();
          const elapsed = Math.min(OFFLINE_CAP_SECONDS, Math.max(0, (Date.now() - savedAt) / 1000));
          const offlineRate = businessIncome(save.businesses || []) + propertyIncome(save.properties || []) + jobIncome(migratedJobs, save.activeJobId || 'delivery') + dividendIncome(migratedStocks);
          const offline = offlineRate * elapsed;

          setBalance((save.balance || 0) + offline);
          setTotalEarned((save.totalEarned || 0) + offline);
          setTotalClicks(save.totalClicks || 0);
          setClickTier(Math.min(save.clickTier || 0, clickTiers.length - 1));
          setBusinesses(save.businesses || []);
          setProperties(save.properties || []);
          setAssets(save.assets || []);
          setStocks(migratedStocks);
          setCrypto(migratedCrypto);
          setJobs(migratedJobs);
          setActiveJobId(save.activeJobId || 'delivery');
          setTaxDue(save.taxDue || 0);
          setOfflineEarnings(offline);
          setClaimedMissions(save.claimedMissions || []);
          setEvent(save.event || eventDeck[5]);
          setEventEndsAt(Date.now() + 40000);
          setLastSavedAt(Date.now());
        }
      } catch (error) {
        console.warn('Minted save could not be loaded', error);
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const businessIncomePerSec = useMemo(() => businessIncome(businesses), [businesses]);
  const propertyIncomePerSec = useMemo(() => propertyIncome(properties), [properties]);
  const jobIncomePerSec = useMemo(() => jobIncome(jobs, activeJobId), [jobs, activeJobId]);
  const dividendIncomePerSec = useMemo(() => dividendIncome(stocks), [stocks]);
  const passivePerSec = businessIncomePerSec + propertyIncomePerSec + jobIncomePerSec + dividendIncomePerSec;

  const stockValue = useMemo(() => stocks.reduce((sum, stock) => sum + stock.shares * stock.price, 0), [stocks]);
  const cryptoValue = useMemo(() => crypto.reduce((sum, coin) => sum + coin.units * coin.price, 0), [crypto]);
  const marketValue = stockValue + cryptoValue;
  const businessValue = useMemo(() => businesses.reduce((sum, business) => sum + (business.value || 0), 0), [businesses]);
  const propertyValue = useMemo(() => properties.reduce((sum, property) => sum + (property.value || 0), 0), [properties]);
  const assetValue = useMemo(() => assets.reduce((sum, asset) => sum + asset.cost, 0), [assets]);
  const prestige = useMemo(() => assets.reduce((sum, asset) => sum + asset.prestige, 0), [assets]);
  const netWorth = Math.max(0, balance + businessValue + propertyValue + marketValue + assetValue - taxDue);
  const level = Math.max(1, Math.floor(Math.log10(Math.max(10, totalEarned + netWorth + 10)) * 3));
  const reputation = Math.floor(prestige + businesses.length * 20 + properties.length * 35 + level * 5);

  const clickValue = clickTiers[clickTier];
  const maxClick = clickTier === clickTiers.length - 1;
  const nextClickValue = maxClick ? clickValue : clickTiers[clickTier + 1];
  const clickUpgradeCost = maxClick ? 0 : clickCosts[clickTier + 1];
  const canBuyClick = !maxClick && balance >= clickUpgradeCost;

  const businessCatalog = businessCatalogData.map((business, index) => ({ ...business, unlocked: index === 0 || netWorth >= business.cost * 0.35 }));
  const propertyCatalog = propertyCatalogData.map((property, index) => ({ ...property, unlocked: index === 0 || netWorth >= property.cost * 0.3 }));
  const assetCatalog = assetCatalogData.map((asset, index) => ({ ...asset, unlocked: index === 0 || netWorth >= asset.cost * 0.25, owned: assets.some((owned) => owned.id === asset.id) }));

  const missionProgress = useMemo(() => {
    const values = {
      clicks: totalClicks,
      businesses: businesses.length,
      marketUnits: marketUnits(stocks, crypto),
      properties: properties.reduce((sum, item) => sum + (item.count || 0), 0),
      netWorth,
    };
    return missionTemplates.map((mission) => ({
      ...mission,
      progress: Math.min(mission.target, values[mission.metric] || 0),
      complete: (values[mission.metric] || 0) >= mission.target,
      claimed: claimedMissions.includes(mission.id),
    }));
  }, [totalClicks, businesses, stocks, crypto, properties, netWorth, claimedMissions]);

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
      const now = Date.now();
      if (now >= eventEndsAt) {
        const next = eventDeck[Math.floor(Math.random() * eventDeck.length)];
        setEvent(next);
        setEventEndsAt(now + 35000 + Math.floor(Math.random() * 25000));
      }
      const moveMarket = (items, isCrypto = false) => items.map((item) => {
        const eventApplies = event && (event.sector === 'ALL' || event.sector === item.sector || isCrypto);
        const eventBias = eventApplies ? event.strength * (isCrypto ? 0.45 : 0.6) : 0;
        const shock = (Math.random() - 0.495) * item.volatility;
        const move = Math.max(-0.2, Math.min(0.2, shock + item.drift + eventBias));
        const nextPrice = Math.max(0.2, item.price * (1 + move));
        return { ...item, price: nextPrice, changePct: move * 100, history: [...(item.history || []), nextPrice].slice(-12) };
      });
      setStocks((items) => moveMarket(items, false));
      setCrypto((items) => moveMarket(items, true));
    }, 4500);
    return () => clearInterval(id);
  }, [loaded, event, eventEndsAt]);

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(async () => {
      const now = Date.now();
      setLastSavedAt(now);
      try {
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify({
          balance, totalEarned, totalClicks, clickTier, businesses, properties, assets,
          stocks, crypto, jobs, activeJobId, taxDue, claimedMissions, event, lastSavedAt: now,
        }));
      } catch (error) {
        console.warn('Minted save could not be written', error);
      }
    }, 3000);
    return () => clearInterval(id);
  }, [loaded, balance, totalEarned, totalClicks, clickTier, businesses, properties, assets, stocks, crypto, jobs, activeJobId, taxDue, claimedMissions, event]);

  const spend = (amount) => {
    if (!Number.isFinite(amount) || amount <= 0 || balance < amount) return false;
    setBalance((value) => value - amount);
    return true;
  };

  const tap = () => {
    const now = Date.now();
    const quick = now - lastTapAtRef.current < 700;
    const nextCombo = quick ? Math.min(25, combo + 1) : 1;
    const critChance = Math.min(0.25, 0.04 + reputation / 50000);
    const critical = Math.random() < critChance;
    const comboMultiplier = 1 + Math.min(0.5, nextCombo * 0.02);
    const reward = Math.max(1, Math.floor(clickValue * comboMultiplier * (critical ? 5 : 1)));
    lastTapAtRef.current = now;
    setCombo(nextCombo);
    setLastTapReward(reward);
    setLastTapCritical(critical);
    setBalance((value) => value + reward);
    setTotalEarned((value) => value + reward);
    setTotalClicks((value) => value + 1);
    setTaxDue((value) => value + reward * 0.01);
  };

  const buyClickUpgrade = () => {
    if (!canBuyClick || !spend(clickUpgradeCost)) return;
    setClickTier((value) => Math.min(value + 1, clickTiers.length - 1));
  };

  const buyBusiness = (id) => {
    const base = businessCatalog.find((business) => business.id === id);
    if (!base || !base.unlocked || businesses.some((business) => business.id === id) || !spend(base.cost)) return;
    setBusinesses((items) => [...items, {
      id: base.id, name: base.name, icon: base.icon, industry: base.industry, risk: base.risk,
      units: 1, level: 1, multiplier: 1, incomePerSec: base.baseIncome,
      unitCost: Math.ceil(base.cost * 0.6), upgradeCost: Math.ceil(base.cost * 1.25), value: base.cost,
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
      if (owned) return items.map((property) => property.id === id ? { ...property, count: property.count + 1, value: property.value + base.cost } : property);
      return [...items, { ...base, count: 1, value: base.cost }];
    });
  };

  const buyAsset = (id) => {
    const item = assetCatalog.find((asset) => asset.id === id);
    if (!item || item.owned || !item.unlocked || !spend(item.cost)) return;
    setAssets((items) => [...items, item]);
  };

  const trade = (collection, setter, id, unitKey, direction, quantity = 1) => {
    const qty = Math.max(1, Math.floor(quantity));
    const item = collection.find((entry) => entry.id === id);
    if (!item) return;
    if (direction === 'buy') {
      const cost = item.price * qty;
      if (!spend(cost)) return;
      setter((items) => items.map((entry) => entry.id === id ? {
        ...entry,
        avgCost: (((entry.avgCost || 0) * (entry[unitKey] || 0)) + entry.price * qty) / ((entry[unitKey] || 0) + qty),
        [unitKey]: (entry[unitKey] || 0) + qty,
      } : entry));
      return;
    }
    const owned = item[unitKey] || 0;
    const sellQty = Math.min(owned, qty);
    if (sellQty <= 0) return;
    setBalance((value) => value + item.price * sellQty);
    setter((items) => items.map((entry) => entry.id === id ? { ...entry, [unitKey]: (entry[unitKey] || 0) - sellQty } : entry));
  };

  const buyStock = (id, quantity = 1) => trade(stocks, setStocks, id, 'shares', 'buy', quantity);
  const sellStock = (id, quantity = 1) => trade(stocks, setStocks, id, 'shares', 'sell', quantity);
  const buyCrypto = (id, quantity = 1) => trade(crypto, setCrypto, id, 'units', 'buy', quantity);
  const sellCrypto = (id, quantity = 1) => trade(crypto, setCrypto, id, 'units', 'sell', quantity);

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

  const claimMission = (id) => {
    const mission = missionProgress.find((item) => item.id === id);
    if (!mission || !mission.complete || mission.claimed) return;
    setClaimedMissions((items) => [...items, id]);
    setBalance((value) => value + mission.reward);
    setTotalEarned((value) => value + mission.reward);
  };

  const clearOfflineEarnings = () => setOfflineEarnings(0);

  return (
    <GameContext.Provider value={{
      loaded, balance, totalEarned, totalClicks, clickValue, nextClickValue, clickUpgradeCost, canBuyClick, maxClick,
      passivePerSec, businessIncomePerSec, propertyIncomePerSec, jobIncomePerSec, dividendIncomePerSec,
      businesses, businessCatalog, properties, propertyCatalog, assets, assetCatalog, stocks, crypto, jobs, activeJobId,
      stockValue, cryptoValue, marketValue, businessValue, propertyValue, assetValue, prestige, reputation, level, netWorth,
      taxDue, offlineEarnings, lastSavedAt, event, eventEndsAt, missionProgress, combo, lastTapReward, lastTapCritical,
      tap, buyClickUpgrade, buyBusiness, expandBusiness, upgradeBusiness, buyProperty, buyAsset,
      buyStock, sellStock, buyCrypto, sellCrypto, takeJob, payTaxes, claimMission, clearOfflineEarnings,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
