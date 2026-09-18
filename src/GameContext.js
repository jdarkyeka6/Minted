import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext = createContext(null);
const SAVE_KEY = 'minted-save-v4';
const LEGACY_KEYS = ['minted-save-v3', 'minted-save-v2', 'minted-save-v1'];
const OFFLINE_CAP_SECONDS = 8 * 60 * 60;
const MARKET_TICK_MS = 4500;
const MARKET_EVENT_MS = 22000;
const TAX_PERIOD_MS = 72 * 60 * 60 * 1000;
const TAX_RATES = { business: 0.07, stocks: 0.04, realEstate: 0.05 };
const JOB_SHIFT_SECONDS = 15;
const JOB_COOLDOWN_MS = 12 * 1000;

const clickTiers = [1, 3, 10, 50, 250, 1000, 5000, 25000, 100000, 500000];
const clickCosts = [0, 50, 400, 4000, 30000, 250000, 2000000, 15000000, 120000000, 900000000];

const businessCatalogData = [
  { id: 'shop', name: 'Shop', icon: '🛍️', industry: 'Retail', cost: 4800, baseIncome: 3.4, margin: 0.34, staff: 3 },
  { id: 'taxi', name: 'Taxi Company', icon: '🚕', industry: 'Transport', cost: 10000, baseIncome: 7.8, margin: 0.31, staff: 5 },
  { id: 'shipping', name: 'Shipping Company', icon: '🚚', industry: 'Logistics', cost: 22000, baseIncome: 17, margin: 0.28, staff: 9 },
  { id: 'factory', name: 'Factory', icon: '🏭', industry: 'Manufacturing', cost: 52000, baseIncome: 42, margin: 0.25, staff: 18 },
  { id: 'construction', name: 'Construction Company', icon: '🏗️', industry: 'Construction', cost: 125000, baseIncome: 105, margin: 0.27, staff: 25 },
  { id: 'dealership', name: 'Car Dealership', icon: '🚘', industry: 'Automotive', cost: 300000, baseIncome: 270, margin: 0.24, staff: 32 },
  { id: 'software', name: 'IT Company', icon: '💻', industry: 'Technology', cost: 950000, baseIncome: 930, margin: 0.56, staff: 28 },
  { id: 'hotel', name: 'Hotel Group', icon: '🏨', industry: 'Hospitality', cost: 4200000, baseIncome: 4300, margin: 0.36, staff: 90 },
  { id: 'bank', name: 'Bank', icon: '🏦', industry: 'Finance', cost: 18000000, baseIncome: 21000, margin: 0.49, staff: 160 },
  { id: 'sports', name: 'Sports Club', icon: '🏟️', industry: 'Sport', cost: 65000000, baseIncome: 88000, margin: 0.29, staff: 220 },
  { id: 'energy', name: 'Energy Company', icon: '⛽️', industry: 'Energy', cost: 280000000, baseIncome: 410000, margin: 0.33, staff: 410 },
  { id: 'airline', name: 'Airline', icon: '✈️', industry: 'Aviation', cost: 1300000000, baseIncome: 2050000, margin: 0.19, staff: 980 },
  { id: 'holding', name: 'Holding Company', icon: '📊', industry: 'Investments', cost: 6500000000, baseIncome: 11200000, margin: 0.61, staff: 250 },
  { id: 'space', name: 'Space Company', icon: '🚀', industry: 'Aerospace', cost: 28000000000, baseIncome: 52000000, margin: 0.38, staff: 1800 },
];

const acquisitionTargetData = [
  { id: 'cobalt-corner', name: 'Cobalt Corner', typeId: 'shop', icon: '🛍️', industry: 'Retail', region: 'Perth', value: 18000, incomePerSec: 16, units: 3, level: 2, managerLevel: 1, employees: 14, reputation: 67, growth: 7 },
  { id: 'swiftline-cabs', name: 'Swiftline Cabs', typeId: 'taxi', icon: '🚕', industry: 'Transport', region: 'Sydney', value: 52000, incomePerSec: 48, units: 5, level: 3, managerLevel: 1, employees: 31, reputation: 72, growth: 9 },
  { id: 'harbor-haul', name: 'Harbor Haul', typeId: 'shipping', icon: '🚚', industry: 'Logistics', region: 'Fremantle', value: 165000, incomePerSec: 170, units: 7, level: 3, managerLevel: 2, employees: 74, reputation: 75, growth: 8 },
  { id: 'ironvale-works', name: 'Ironvale Works', typeId: 'factory', icon: '🏭', industry: 'Manufacturing', region: 'Melbourne', value: 610000, incomePerSec: 720, units: 4, level: 5, managerLevel: 2, employees: 180, reputation: 71, growth: 12 },
  { id: 'northspan-build', name: 'Northspan Build', typeId: 'construction', icon: '🏗️', industry: 'Construction', region: 'Brisbane', value: 1800000, incomePerSec: 2400, units: 6, level: 5, managerLevel: 3, employees: 310, reputation: 79, growth: 14 },
  { id: 'apex-motors', name: 'Apex Motors', typeId: 'dealership', icon: '🚘', industry: 'Automotive', region: 'Gold Coast', value: 6200000, incomePerSec: 9800, units: 8, level: 6, managerLevel: 3, employees: 420, reputation: 83, growth: 16 },
  { id: 'brightbyte', name: 'BrightByte', typeId: 'software', icon: '💻', industry: 'Technology', region: 'Singapore', value: 22000000, incomePerSec: 44000, units: 3, level: 8, managerLevel: 4, employees: 350, reputation: 88, growth: 24 },
  { id: 'vanta-stays', name: 'Vanta Stays', typeId: 'hotel', icon: '🏨', industry: 'Hospitality', region: 'Tokyo', value: 78000000, incomePerSec: 145000, units: 12, level: 7, managerLevel: 5, employees: 1300, reputation: 86, growth: 15 },
  { id: 'meridian-capital', name: 'Meridian Capital', typeId: 'bank', icon: '🏦', industry: 'Finance', region: 'London', value: 340000000, incomePerSec: 760000, units: 18, level: 9, managerLevel: 6, employees: 4200, reputation: 91, growth: 18 },
  { id: 'vertex-athletics', name: 'Vertex Athletics', typeId: 'sports', icon: '🏟️', industry: 'Sport', region: 'Los Angeles', value: 1200000000, incomePerSec: 3200000, units: 9, level: 10, managerLevel: 6, employees: 5800, reputation: 94, growth: 20 },
  { id: 'solstice-energy', name: 'Solstice Energy', typeId: 'energy', icon: '⛽️', industry: 'Energy', region: 'Dubai', value: 5200000000, incomePerSec: 15800000, units: 21, level: 12, managerLevel: 7, employees: 12400, reputation: 92, growth: 17 },
  { id: 'altair-airways', name: 'Altair Airways', typeId: 'airline', icon: '✈️', industry: 'Aviation', region: 'Global', value: 21000000000, incomePerSec: 69000000, units: 30, level: 14, managerLevel: 8, employees: 39000, reputation: 95, growth: 21 },
  { id: 'monolith-holdings', name: 'Monolith Holdings', typeId: 'holding', icon: '📊', industry: 'Investments', region: 'Global', value: 88000000000, incomePerSec: 360000000, units: 16, level: 16, managerLevel: 9, employees: 8400, reputation: 97, growth: 26 },
  { id: 'zenith-orbital', name: 'Zenith Orbital', typeId: 'space', icon: '🚀', industry: 'Aerospace', region: 'Orbit', value: 420000000000, incomePerSec: 1900000000, units: 11, level: 18, managerLevel: 10, employees: 26000, reputation: 99, growth: 31 },
];

const propertyCatalogData = [
  { id: 'parking', name: 'Parking Space', location: 'Perth', icon: '🅿️', cost: 7500, rentPerSec: 0.55 },
  { id: 'studioFlat', name: 'Studio Apartment', location: 'Perth', icon: '🏢', cost: 42000, rentPerSec: 3.4 },
  { id: 'suburban', name: 'Suburban House', location: 'Melbourne', icon: '🏡', cost: 185000, rentPerSec: 16 },
  { id: 'townhouse', name: 'Townhouse', location: 'Brisbane', icon: '🏘️', cost: 480000, rentPerSec: 46 },
  { id: 'cityUnit', name: 'City Tower Unit', location: 'Sydney', icon: '🌆', cost: 1450000, rentPerSec: 155 },
  { id: 'beachVilla', name: 'Beach Villa', location: 'Gold Coast', icon: '🌴', cost: 6200000, rentPerSec: 760 },
  { id: 'penthouse', name: 'Luxury Penthouse', location: 'Singapore', icon: '🌃', cost: 24000000, rentPerSec: 3400 },
  { id: 'hotel', name: 'Boutique Hotel', location: 'Tokyo', icon: '🏨', cost: 95000000, rentPerSec: 15000 },
  { id: 'tower', name: 'Office Tower', location: 'New York', icon: '🏙️', cost: 620000000, rentPerSec: 112000 },
  { id: 'resort', name: 'Island Resort', location: 'Maldives', icon: '🏝️', cost: 4800000000, rentPerSec: 980000 },
  { id: 'district', name: 'Commercial District', location: 'Dubai', icon: '🌇', cost: 26000000000, rentPerSec: 5900000 },
  { id: 'skyline', name: 'Skyline Portfolio', location: 'Global', icon: '🌐', cost: 125000000000, rentPerSec: 32000000 },
];

const assetCatalogData = [
  { id: 'sneakers', name: 'Collector Sneakers', icon: '👟', category: 'style', cost: 5000, prestige: 5 },
  { id: 'watch', name: 'Mechanical Watch', icon: '⌚️', category: 'style', cost: 35000, prestige: 18 },
  { id: 'jewels', name: 'Gemstone Set', icon: '💎', category: 'style', cost: 180000, prestige: 55 },
  { id: 'rareCoin', name: 'Rare Coin', icon: '🪙', category: 'style', cost: 650000, prestige: 150 },

  { id: 'classicCar', name: 'Classic Coupe', icon: '🚗', category: 'cars', cost: 85000, prestige: 28 },
  { id: 'sportsCar', name: 'Sports Car', icon: '🏎️', category: 'cars', cost: 250000, prestige: 60 },
  { id: 'supercar', name: 'Hypercar', icon: '🔥', category: 'cars', cost: 2500000, prestige: 180 },
  { id: 'prototypeCar', name: 'Concept Hypercar', icon: '⚡️', category: 'cars', cost: 18000000, prestige: 650 },

  { id: 'speedboat', name: 'Performance Boat', icon: '🚤', category: 'yachts', cost: 600000, prestige: 90 },
  { id: 'yacht', name: 'Superyacht', icon: '🛥️', category: 'yachts', cost: 18000000, prestige: 520 },
  { id: 'megayacht', name: 'Mega Yacht', icon: '⚓️', category: 'yachts', cost: 210000000, prestige: 4200 },

  { id: 'propPlane', name: 'Private Prop Plane', icon: '🛩️', category: 'aircraft', cost: 1200000, prestige: 130 },
  { id: 'jet', name: 'Private Jet', icon: '✈️', category: 'aircraft', cost: 75000000, prestige: 1400 },
  { id: 'airliner', name: 'Private Airliner', icon: '🛫', category: 'aircraft', cost: 650000000, prestige: 9200 },

  { id: 'tinyIsland', name: 'Tiny Private Island', icon: '🏝️', category: 'islands', cost: 90000000, prestige: 2200 },
  { id: 'island', name: 'Private Island', icon: '🌊', category: 'islands', cost: 550000000, prestige: 5000 },
  { id: 'islandEstate', name: 'Island Estate', icon: '🌴', category: 'islands', cost: 6200000000, prestige: 48000 },

  { id: 'painting', name: 'Masterwork Painting', icon: '🖼️', category: 'collectibles', cost: 450000, prestige: 95 },
  { id: 'signature', name: 'Historic Signature', icon: '✍️', category: 'collectibles', cost: 5000000, prestige: 700 },
  { id: 'meteorite', name: 'Meteorite Fragment', icon: '☄️', category: 'collectibles', cost: 42000000, prestige: 3500 },
  { id: 'crown', name: 'Royal Relic', icon: '👑', category: 'collectibles', cost: 950000000, prestige: 28000 },
];

const residenceCatalogData = [
  { id: 'apartment', name: 'City Apartment', icon: '🏢', cost: 75000 },
  { id: 'penthouse', name: 'Skyline Penthouse', icon: '🌃', cost: 1200000 },
  { id: 'estate', name: 'Coastal Estate', icon: '🏡', cost: 18000000 },
  { id: 'compound', name: 'Private Compound', icon: '🏰', cost: 280000000 },
  { id: 'citadel', name: 'Billionaire Citadel', icon: '🏯', cost: 4200000000 },
];

const residenceImprovementData = [
  { id: 'garage', name: 'Collector Garage', icon: '🚘', cost: 120000, minTier: 0 },
  { id: 'gym', name: 'Private Gym', icon: '🏋️', cost: 260000, minTier: 0 },
  { id: 'pool', name: 'Infinity Pool', icon: '🏊', cost: 850000, minTier: 1 },
  { id: 'cinema', name: 'Private Cinema', icon: '🎬', cost: 1600000, minTier: 1 },
  { id: 'vault', name: 'High Security Vault', icon: '🔐', cost: 12000000, minTier: 2 },
  { id: 'helipad', name: 'Helipad', icon: '🚁', cost: 38000000, minTier: 2 },
  { id: 'bunker', name: 'Underground Bunker', icon: '🛡️', cost: 240000000, minTier: 3 },
  { id: 'hangar', name: 'Private Hangar', icon: '🛩️', cost: 620000000, minTier: 3 },
  { id: 'launchpad', name: 'Launch Pad', icon: '🚀', cost: 6500000000, minTier: 4 },
];

const defaultStocks = [
  { id: 'NSAI', symbol: 'NSAI', name: 'Northstar AI', icon: '✦', price: 86.25, changePct: 0, shares: 0, avgCost: 0, volatility: 0.035, drift: 0.0015, yieldRate: 0.00007 },
  { id: 'VLT', symbol: 'VLT', name: 'Volterra Motors', icon: 'V', price: 42.6, changePct: 0, shares: 0, avgCost: 0, volatility: 0.045, drift: 0.001, yieldRate: 0.00004 },
  { id: 'HEL', symbol: 'HEL', name: 'Helio Energy', icon: '☀', price: 28.4, changePct: 0, shares: 0, avgCost: 0, volatility: 0.025, drift: 0.001, yieldRate: 0.00012 },
  { id: 'ATL', symbol: 'ATL', name: 'Atlas Retail', icon: 'A', price: 61.1, changePct: 0, shares: 0, avgCost: 0, volatility: 0.02, drift: 0.0005, yieldRate: 0.00016 },
  { id: 'ORB', symbol: 'ORB', name: 'Orbit Systems', icon: '◉', price: 133.75, changePct: 0, shares: 0, avgCost: 0, volatility: 0.03, drift: 0.0012, yieldRate: 0.00008 },
  { id: 'CND', symbol: 'CND', name: 'Cinder Labs', icon: 'C', price: 18.95, changePct: 0, shares: 0, avgCost: 0, volatility: 0.06, drift: 0.0018, yieldRate: 0.00002 },
  { id: 'AUR', symbol: 'AUR', name: 'Aurora Foods', icon: 'A', price: 74.2, changePct: 0, shares: 0, avgCost: 0, volatility: 0.018, drift: 0.0006, yieldRate: 0.0002 },
  { id: 'PLS', symbol: 'PLS', name: 'Pulse Health', icon: '+', price: 119.8, changePct: 0, shares: 0, avgCost: 0, volatility: 0.028, drift: 0.001, yieldRate: 0.00009 },
  { id: 'FRG', symbol: 'FRG', name: 'Forge Global', icon: 'F', price: 210.4, changePct: 0, shares: 0, avgCost: 0, volatility: 0.022, drift: 0.0009, yieldRate: 0.00013 },
  { id: 'SKY', symbol: 'SKY', name: 'Skyline Media', icon: 'S', price: 33.7, changePct: 0, shares: 0, avgCost: 0, volatility: 0.05, drift: 0.0014, yieldRate: 0.00003 },
];

const defaultCrypto = [
  { id: 'MNT', symbol: 'MNT', name: 'MintCoin', icon: 'M', price: 24.4, changePct: 0, units: 0, avgCost: 0, volatility: 0.08, drift: 0.001 },
  { id: 'NOVA', symbol: 'NOVA', name: 'Nova', icon: '✧', price: 8.75, changePct: 0, units: 0, avgCost: 0, volatility: 0.11, drift: 0.0015 },
  { id: 'VEC', symbol: 'VEC', name: 'Vector', icon: '△', price: 61.8, changePct: 0, units: 0, avgCost: 0, volatility: 0.065, drift: 0.0008 },
  { id: 'TIDE', symbol: 'TIDE', name: 'Tide Protocol', icon: '≈', price: 3.2, changePct: 0, units: 0, avgCost: 0, volatility: 0.14, drift: 0.002 },
  { id: 'EMBER', symbol: 'EMBER', name: 'Ember', icon: '◆', price: 0.82, changePct: 0, units: 0, avgCost: 0, volatility: 0.17, drift: 0.0018 },
  { id: 'LUMA', symbol: 'LUMA', name: 'Luma', icon: '◌', price: 145.6, changePct: 0, units: 0, avgCost: 0, volatility: 0.055, drift: 0.0007 },
  { id: 'ARC', symbol: 'ARC', name: 'Arc Network', icon: 'A', price: 14.15, changePct: 0, units: 0, avgCost: 0, volatility: 0.1, drift: 0.0012 },
  { id: 'PIX', symbol: 'PIX', name: 'Pixel', icon: 'P', price: 0.18, changePct: 0, units: 0, avgCost: 0, volatility: 0.2, drift: 0.0024 },
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
const createTaxAccounts = () => ({
  business: { accrued: 0, dueAt: null, lastPaidAt: null },
  stocks: { accrued: 0, dueAt: null, lastPaidAt: null },
  realEstate: { accrued: 0, dueAt: null, lastPaidAt: null },
});

const normalizeTaxAccount = (account, active, now) => ({
  accrued: Math.max(0, Number(account?.accrued || 0)),
  dueAt: active || Number(account?.accrued || 0) > 0
    ? (Number(account?.dueAt || 0) || (now + TAX_PERIOD_MS))
    : null,
  lastPaidAt: Number(account?.lastPaidAt || 0) || null,
});

const getOfflineTaxableIncome = (ratePerSec, account, savedAt, now) => {
  if (ratePerSec <= 0) return 0;
  if (account?.accrued > 0 && account?.dueAt && account.dueAt <= savedAt) return 0;
  const capEnd = Math.min(now, savedAt + OFFLINE_CAP_SECONDS * 1000);
  const earnUntil = account?.dueAt ? Math.min(capEnd, account.dueAt) : capEnd;
  return Math.max(0, earnUntil - savedAt) / 1000 * ratePerSec;
};

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

const legacyBusinessTypeMap = {
  cart: 'shop',
  coffee: 'shop',
  studio: 'software',
  logistics: 'shipping',
  software: 'software',
  factory: 'factory',
  bank: 'bank',
  airline: 'airline',
  space: 'space',
};

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
  const [acquiredTargetIds, setAcquiredTargetIds] = useState([]);
  const [acquisitionHistory, setAcquisitionHistory] = useState([]);
  const [mergerCount, setMergerCount] = useState(0);
  const [properties, setProperties] = useState([]);
  const [assets, setAssets] = useState([]);
  const [residenceTier, setResidenceTier] = useState(-1);
  const [residenceSecurity, setResidenceSecurity] = useState(0);
  const [residenceStaff, setResidenceStaff] = useState(0);
  const [residenceImprovementsOwned, setResidenceImprovementsOwned] = useState([]);
  const [stocks, setStocks] = useState(clone(defaultStocks));
  const [crypto, setCrypto] = useState(clone(defaultCrypto));
  const [jobs, setJobs] = useState(clone(defaultJobs));
  const [activeJobId, setActiveJobId] = useState(null);
  const [lastWorkedAt, setLastWorkedAt] = useState(0);
  const [taxAccounts, setTaxAccounts] = useState(createTaxAccounts());
  const [clockNow, setClockNow] = useState(Date.now());
  const [offlineEarnings, setOfflineEarnings] = useState(0);
  const [lastSavedAt, setLastSavedAt] = useState(Date.now());
  const [activity, setActivity] = useState([]);
  const [claimedAchievements, setClaimedAchievements] = useState([]);
  const [dailyStreak, setDailyStreak] = useState(0);
  const [lastDailyClaim, setLastDailyClaim] = useState(null);
  const [marketHeadline, setMarketHeadline] = useState('Markets are open. Prices move every few seconds.');
  const saveSnapshotRef = useRef(null);

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
          const migratedBusinesses = (save.businesses || []).map((business, index) => {
            const originalType = business.typeId || business.id;
            const mappedType = legacyBusinessTypeMap[originalType] || originalType;
            const base = businessCatalogData.find((item) => item.id === mappedType);
            if (!base) return null;
            const managerLevel = business.managerLevel || 0;
            const isLegacyInstance = !business.typeId;
            return {
              ...business,
              id: isLegacyInstance ? `${mappedType}-legacy-${index}` : business.id,
              typeId: mappedType,
              name: business.name || base.name,
              icon: base.icon,
              industry: base.industry,
              level: business.level || 1,
              units: business.units || 1,
              multiplier: business.multiplier || 1,
              managerLevel,
              incomePerSec: Number(business.incomePerSec || base.baseIncome),
              unitCost: Number(business.unitCost || Math.ceil(base.cost * 0.6)),
              upgradeCost: Number(business.upgradeCost || Math.ceil(base.cost * 1.25)),
              managerCost: Number(business.managerCost || Math.ceil(base.cost * 2.4 * Math.pow(2.7, managerLevel))),
              value: Number(business.value || base.cost),
            };
          }).filter(Boolean);
          const savedAt = Number(save.lastSavedAt || Date.now());
          const now = Date.now();
          const migratedProperties = save.properties || [];
          const freshTaxSchema = sourceKey === SAVE_KEY;
          const sourceTaxes = freshTaxSchema ? (save.taxAccounts || {}) : {};
          const normalizedTaxes = {
            business: normalizeTaxAccount(sourceTaxes.business, migratedBusinesses.length > 0, now),
            stocks: normalizeTaxAccount(sourceTaxes.stocks, migratedStocks.some((stock) => stock.shares > 0), now),
            realEstate: normalizeTaxAccount(sourceTaxes.realEstate, migratedProperties.some((property) => (property.count || 0) > 0), now),
          };

          const businessOffline = getOfflineTaxableIncome(getBusinessIncome(migratedBusinesses), normalizedTaxes.business, savedAt, now);
          const propertyOffline = getOfflineTaxableIncome(getPropertyIncome(migratedProperties), normalizedTaxes.realEstate, savedAt, now);
          const stockOffline = getOfflineTaxableIncome(getDividendIncome(migratedStocks), normalizedTaxes.stocks, savedAt, now);
          const offline = businessOffline + propertyOffline + stockOffline;

          normalizedTaxes.business.accrued += businessOffline * TAX_RATES.business;
          normalizedTaxes.realEstate.accrued += propertyOffline * TAX_RATES.realEstate;
          normalizedTaxes.stocks.accrued += stockOffline * TAX_RATES.stocks;

          setBalance(Number(save.balance || 0) + offline);
          setTotalEarned(Number(save.totalEarned || 0) + offline);
          setTotalClicks(Number(save.totalClicks || 0));
          setClickTier(Math.min(Number(save.clickTier || 0), clickTiers.length - 1));
          setBusinesses(migratedBusinesses);
          setAcquiredTargetIds(save.acquiredTargetIds || []);
          setAcquisitionHistory(save.acquisitionHistory || []);
          setMergerCount(Number(save.mergerCount || 0));
          setProperties(migratedProperties);
          setAssets((save.assets || []).filter((owned) => assetCatalogData.some((item) => item.id === owned.id)));
          setResidenceTier(Number.isFinite(Number(save.residenceTier)) ? Number(save.residenceTier) : -1);
          setResidenceSecurity(Number(save.residenceSecurity || 0));
          setResidenceStaff(Number(save.residenceStaff || 0));
          setResidenceImprovementsOwned(save.residenceImprovementsOwned || []);
          setStocks(migratedStocks);
          setCrypto(migratedCrypto);
          setJobs(migratedJobs);
          setActiveJobId(save.activeJobId || null);
          setLastWorkedAt(Number(save.lastWorkedAt || 0));
          setTaxAccounts(normalizedTaxes);
          setClockNow(now);
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

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(() => setClockNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [loaded]);

  const businessGrossIncomePerSec = useMemo(() => getBusinessIncome(businesses), [businesses]);
  const propertyGrossIncomePerSec = useMemo(() => getPropertyIncome(properties), [properties]);
  const dividendGrossIncomePerSec = useMemo(() => getDividendIncome(stocks), [stocks]);

  const hasBusinessTaxSource = businesses.length > 0 || taxAccounts.business.accrued > 0;
  const hasStockTaxSource = stocks.some((stock) => stock.shares > 0) || taxAccounts.stocks.accrued > 0;
  const hasRealEstateTaxSource = properties.some((property) => (property.count || 0) > 0) || taxAccounts.realEstate.accrued > 0;

  const makeTaxStatus = (key, active) => {
    const account = taxAccounts[key] || createTaxAccounts()[key];
    const amount = Math.max(0, Number(account.accrued || 0));
    const dueAt = Number(account.dueAt || 0) || null;
    const overdue = !!(active && amount > 0 && dueAt && clockNow >= dueAt);
    return {
      key,
      active,
      amount,
      dueAt,
      overdue,
      suspended: overdue,
      rate: TAX_RATES[key],
      timeRemainingMs: dueAt ? Math.max(0, dueAt - clockNow) : null,
      lastPaidAt: account.lastPaidAt || null,
    };
  };

  const taxes = {
    business: makeTaxStatus('business', hasBusinessTaxSource),
    stocks: makeTaxStatus('stocks', hasStockTaxSource),
    realEstate: makeTaxStatus('realEstate', hasRealEstateTaxSource),
  };

  const businessIncomePerSec = taxes.business.suspended ? 0 : businessGrossIncomePerSec;
  const propertyIncomePerSec = taxes.realEstate.suspended ? 0 : propertyGrossIncomePerSec;
  const dividendIncomePerSec = taxes.stocks.suspended ? 0 : dividendGrossIncomePerSec;
  const jobIncomePerSec = 0;
  const passivePerSec = businessIncomePerSec + propertyIncomePerSec + dividendIncomePerSec;
  const hasPassiveSource = businessGrossIncomePerSec > 0 || propertyGrossIncomePerSec > 0 || dividendGrossIncomePerSec > 0;
  const totalTaxDue = taxes.business.amount + taxes.stocks.amount + taxes.realEstate.amount;

  const selectedJob = jobs.find((job) => job.id === activeJobId) || null;
  const jobShiftPay = selectedJob ? selectedJob.incomePerSec * JOB_SHIFT_SECONDS : 0;
  const jobReadyAt = lastWorkedAt ? lastWorkedAt + JOB_COOLDOWN_MS : 0;
  const jobReady = !lastWorkedAt || clockNow >= jobReadyAt;

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(() => {
      const businessAdd = taxes.business.suspended ? 0 : businessGrossIncomePerSec / 5;
      const propertyAdd = taxes.realEstate.suspended ? 0 : propertyGrossIncomePerSec / 5;
      const stockAdd = taxes.stocks.suspended ? 0 : dividendGrossIncomePerSec / 5;
      const add = businessAdd + propertyAdd + stockAdd;
      if (add <= 0) return;

      setBalance((value) => value + add);
      setTotalEarned((value) => value + add);
      setTaxAccounts((accounts) => ({
        ...accounts,
        business: businessAdd > 0 ? {
          ...accounts.business,
          accrued: Number(accounts.business.accrued || 0) + businessAdd * TAX_RATES.business,
          dueAt: accounts.business.dueAt || (Date.now() + TAX_PERIOD_MS),
        } : accounts.business,
        stocks: stockAdd > 0 ? {
          ...accounts.stocks,
          accrued: Number(accounts.stocks.accrued || 0) + stockAdd * TAX_RATES.stocks,
          dueAt: accounts.stocks.dueAt || (Date.now() + TAX_PERIOD_MS),
        } : accounts.stocks,
        realEstate: propertyAdd > 0 ? {
          ...accounts.realEstate,
          accrued: Number(accounts.realEstate.accrued || 0) + propertyAdd * TAX_RATES.realEstate,
          dueAt: accounts.realEstate.dueAt || (Date.now() + TAX_PERIOD_MS),
        } : accounts.realEstate,
      }));
    }, 200);
    return () => clearInterval(id);
  }, [
    loaded,
    businessGrossIncomePerSec,
    propertyGrossIncomePerSec,
    dividendGrossIncomePerSec,
    taxes.business.suspended,
    taxes.stocks.suspended,
    taxes.realEstate.suspended,
  ]);

  useEffect(() => {
    if (!loaded) return;
    setTaxAccounts((accounts) => {
      const now = Date.now();
      let changed = false;
      const next = { ...accounts };
      [
        ['business', businesses.length > 0],
        ['stocks', stocks.some((stock) => stock.shares > 0)],
        ['realEstate', properties.some((property) => (property.count || 0) > 0)],
      ].forEach(([key, active]) => {
        const account = next[key];
        if (active && (!account.dueAt || (account.dueAt <= now && Number(account.accrued || 0) <= 0))) {
          next[key] = { ...account, dueAt: now + TAX_PERIOD_MS };
          changed = true;
        }
      });
      return changed ? next : accounts;
    });
  }, [loaded, clockNow, businesses.length, stocks, properties]);

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

  saveSnapshotRef.current = {
    balance,
    totalEarned,
    totalClicks,
    clickTier,
    businesses,
    acquiredTargetIds,
    acquisitionHistory,
    mergerCount,
    properties,
    assets,
    residenceTier,
    residenceSecurity,
    residenceStaff,
    residenceImprovementsOwned,
    stocks,
    crypto,
    jobs,
    activeJobId,
    lastWorkedAt,
    taxAccounts,
    activity,
    claimedAchievements,
    dailyStreak,
    lastDailyClaim,
  };

  useEffect(() => {
    if (!loaded) return undefined;
    const id = setInterval(async () => {
      const now = Date.now();
      const snapshot = { ...(saveSnapshotRef.current || {}), lastSavedAt: now };
      try {
        await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(snapshot));
        setLastSavedAt(now);
      } catch (error) {
        console.warn('Minted save could not be written', error);
      }
    }, 2500);
    return () => clearInterval(id);
  }, [loaded]);

  const stockValue = useMemo(() => stocks.reduce((sum, stock) => sum + stock.shares * stock.price, 0), [stocks]);
  const cryptoValue = useMemo(() => crypto.reduce((sum, coin) => sum + coin.units * coin.price, 0), [crypto]);
  const marketValue = stockValue + cryptoValue;
  const businessValue = useMemo(() => businesses.reduce((sum, business) => sum + (business.value || 0), 0), [businesses]);
  const propertyValue = useMemo(() => properties.reduce((sum, property) => sum + (property.value || 0), 0), [properties]);
  const assetValue = useMemo(() => assets.reduce((sum, asset) => sum + (asset.cost || 0), 0), [assets]);
  const prestige = useMemo(() => assets.reduce((sum, asset) => sum + (asset.prestige || 0), 0), [assets]);
  const residence = residenceTier >= 0 ? residenceCatalogData[residenceTier] : null;
  const residenceBaseValue = residenceTier >= 0
    ? residenceCatalogData.slice(0, residenceTier + 1).reduce((sum, item) => sum + item.cost, 0)
    : 0;
  const residenceImprovementValue = residenceImprovementData
    .filter((item) => residenceImprovementsOwned.includes(item.id))
    .reduce((sum, item) => sum + item.cost, 0);
  const residenceValue = residenceBaseValue + residenceImprovementValue;
  const residenceSecurityCost = residence
    ? Math.ceil(Math.max(1500, residence.cost * 0.04) * Math.pow(1.55, residenceSecurity))
    : 0;
  const residenceStaffCost = residence
    ? Math.ceil(Math.max(1200, residence.cost * 0.03) * Math.pow(1.5, residenceStaff))
    : 0;
  const netWorth = Math.max(0, balance + businessValue + propertyValue + marketValue + assetValue + residenceValue - totalTaxDue);

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
    unlocked: index === 0 || netWorth >= business.cost * 0.22,
  }));
  const acquisitionTargets = acquisitionTargetData.map((target) => {
    const sameTypeCount = businesses.filter((business) => (business.typeId || business.id) === target.typeId).length;
    const synergyPct = clamp(sameTypeCount * 0.05, 0, 0.30);
    return {
      ...target,
      synergyPct,
      projectedIncome: target.incomePerSec * (1 + synergyPct),
      acquired: acquiredTargetIds.includes(target.id),
      unlocked: netWorth >= target.value * 0.12,
    };
  });

  const mergerGroups = businessCatalogData.map((base) => {
    const companies = businesses.filter((business) => (business.typeId || business.id) === base.id);
    return {
      typeId: base.id,
      name: base.name,
      icon: base.icon,
      industry: base.industry,
      companies,
      canMerge: companies.length >= 2,
    };
  }).filter((group) => group.companies.length >= 2);

  const propertyCatalog = propertyCatalogData.map((property, index) => ({
    ...property,
    unlocked: index === 0 || netWorth >= property.cost * 0.2,
  }));
  const assetCatalog = assetCatalogData.map((asset, index) => ({
    ...asset,
    unlocked: index === 0 || netWorth >= asset.cost * 0.18,
    owned: assets.some((owned) => owned.id === asset.id),
  }));

  const residenceCatalog = residenceCatalogData.map((item, index) => ({
    ...item,
    owned: index <= residenceTier,
    current: index === residenceTier,
    unlocked: index === 0 || residenceTier >= index - 1,
    next: index === residenceTier + 1,
  }));
  const residenceImprovements = residenceImprovementData.map((item) => ({
    ...item,
    owned: residenceImprovementsOwned.includes(item.id),
    unlocked: residenceTier >= item.minTier,
  }));

  const dailyAvailable = lastDailyClaim !== todayKey();
  const dailyReward = Math.max(250, Math.min(50000000, 250 + netWorth * 0.002 + Math.max(1, dailyStreak + 1) * 250));

  const achievements = [
    { id: 'first1k', title: 'Four figures', detail: 'Reach $1K net worth', reward: 500, unlocked: netWorth >= 1000 },
    { id: 'business', title: 'Founder', detail: 'Open your first business', reward: 1250, unlocked: businesses.length > 0 },
    { id: 'investor', title: 'Investor', detail: 'Own any stock or crypto', reward: 2500, unlocked: stocks.some((s) => s.shares > 0) || crypto.some((c) => c.units > 0) },
    { id: 'landlord', title: 'Landlord', detail: 'Buy your first property', reward: 5000, unlocked: properties.length > 0 },
    { id: 'residence', title: 'Home base', detail: 'Buy your first residence', reward: 10000, unlocked: residenceTier >= 0 },
    { id: '100k', title: 'Six figures', detail: 'Reach $100K net worth', reward: 20000, unlocked: netWorth >= 100000 },
    { id: 'million', title: 'Millionaire', detail: 'Reach $1M net worth', reward: 150000, unlocked: netWorth >= 1000000 },
    { id: 'mogul', title: 'Portfolio monster', detail: 'Own 5 businesses or properties', reward: 500000, unlocked: businesses.length + properties.length >= 5 },
    { id: 'dealmaker', title: 'Deal maker', detail: 'Acquire a competitor', reward: 750000, unlocked: acquisitionHistory.length > 0 },
    { id: 'merger', title: 'Consolidator', detail: 'Complete a company merger', reward: 1500000, unlocked: mergerCount > 0 },
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
  };

  const buyClickUpgrade = () => {
    if (!canBuyClick || !spend(clickUpgradeCost)) return;
    setClickTier((value) => Math.min(value + 1, clickTiers.length - 1));
    addActivityItem(setActivity, `Tap power upgraded to $${nextClickValue.toLocaleString()} per tap.`, 'upgrade');
  };

  const buyBusiness = (id, customName = '') => {
    const base = businessCatalog.find((business) => business.id === id);
    if (!base || !base.unlocked || !spend(base.cost)) return false;
    const companyId = `${base.id}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const chosenName = String(customName || '').trim().slice(0, 28) || base.name;
    setBusinesses((items) => [...items, {
      id: companyId,
      typeId: base.id,
      name: chosenName,
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
    setTaxAccounts((accounts) => ({
      ...accounts,
      business: {
        ...accounts.business,
        dueAt: accounts.business.dueAt && accounts.business.dueAt > Date.now()
          ? accounts.business.dueAt
          : Date.now() + TAX_PERIOD_MS,
      },
    }));
    addActivityItem(setActivity, `${chosenName} launched.`, 'business');
    return true;
  };

  const expandBusiness = (id) => {
    const owned = businesses.find((business) => business.id === id);
    const base = businessCatalogData.find((business) => business.id === (owned?.typeId || owned?.id));
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

  const acquireTarget = (id) => {
    const target = acquisitionTargets.find((item) => item.id === id);
    const base = businessCatalogData.find((item) => item.id === target?.typeId);
    if (!target || !base || target.acquired || !target.unlocked || !spend(target.value)) return false;

    const companyId = `${target.typeId}-acq-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
    const projectedIncome = target.projectedIncome;
    setBusinesses((items) => [...items, {
      id: companyId,
      typeId: target.typeId,
      name: target.name,
      icon: target.icon,
      industry: target.industry,
      units: target.units,
      level: target.level,
      multiplier: Math.max(1, projectedIncome / Math.max(0.01, base.baseIncome * target.units)),
      managerLevel: target.managerLevel,
      incomePerSec: projectedIncome,
      unitCost: Math.ceil(base.cost * 0.85 * Math.max(1, target.units * 0.35)),
      upgradeCost: Math.ceil(target.value * 0.22),
      managerCost: Math.ceil(target.value * 0.31),
      value: target.value,
      acquiredFrom: target.id,
    }]);
    setAcquiredTargetIds((items) => [...items, target.id]);
    setAcquisitionHistory((items) => [{
      id: `${target.id}-${Date.now()}`,
      targetId: target.id,
      name: target.name,
      price: target.value,
      projectedIncome,
      synergyPct: target.synergyPct,
      at: Date.now(),
    }, ...items].slice(0, 30));
    setTaxAccounts((accounts) => ({
      ...accounts,
      business: {
        ...accounts.business,
        dueAt: accounts.business.dueAt && accounts.business.dueAt > Date.now()
          ? accounts.business.dueAt
          : Date.now() + TAX_PERIOD_MS,
      },
    }));
    addActivityItem(setActivity, `${target.name} acquired for ${Math.round(target.value).toLocaleString()}.`, 'business');
    return true;
  };

  const mergeBusinesses = (typeId) => {
    const candidates = businesses.filter((business) => (business.typeId || business.id) === typeId);
    if (candidates.length < 2) return false;
    const primary = candidates[0];
    const secondary = candidates[1];
    const mergedIncome = (primary.incomePerSec + secondary.incomePerSec) * 1.12;
    const mergedValue = (primary.value || 0) + (secondary.value || 0);
    const mergedName = primary.name.endsWith(' Group') ? primary.name : `${primary.name} Group`;

    setBusinesses((items) => items
      .filter((business) => business.id !== secondary.id)
      .map((business) => business.id === primary.id ? {
        ...business,
        name: mergedName,
        units: (primary.units || 1) + (secondary.units || 1),
        level: Math.max(primary.level || 1, secondary.level || 1) + 1,
        managerLevel: Math.max(primary.managerLevel || 0, secondary.managerLevel || 0),
        multiplier: Math.max(primary.multiplier || 1, secondary.multiplier || 1) * 1.08,
        incomePerSec: mergedIncome,
        value: mergedValue,
        unitCost: Math.ceil(Math.max(primary.unitCost || 0, secondary.unitCost || 0) * 1.2),
        upgradeCost: Math.ceil(Math.max(primary.upgradeCost || 0, secondary.upgradeCost || 0) * 1.25),
        managerCost: Math.ceil(Math.max(primary.managerCost || 0, secondary.managerCost || 0) * 1.2),
        mergerCount: (primary.mergerCount || 0) + (secondary.mergerCount || 0) + 1,
      } : business));

    setMergerCount((value) => value + 1);
    addActivityItem(setActivity, `${primary.name} merged with ${secondary.name}. Income jumped 12% from synergies.`, 'business');
    return true;
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
    setTaxAccounts((accounts) => ({
      ...accounts,
      realEstate: {
        ...accounts.realEstate,
        dueAt: accounts.realEstate.dueAt && accounts.realEstate.dueAt > Date.now()
          ? accounts.realEstate.dueAt
          : Date.now() + TAX_PERIOD_MS,
      },
    }));
    addActivityItem(setActivity, `${base.name} purchased in ${base.location}.`, 'property');
  };

  const buyAsset = (id) => {
    const item = assetCatalog.find((asset) => asset.id === id);
    if (!item || item.owned || !item.unlocked || !spend(item.cost)) return;
    setAssets((items) => [...items, item]);
    addActivityItem(setActivity, `${item.name} added to the collection.`, 'asset');
  };

  const buyResidenceTier = (index) => {
    const item = residenceCatalogData[index];
    if (!item || index !== residenceTier + 1 || !spend(item.cost)) return false;
    setResidenceTier(index);
    addActivityItem(setActivity, `${item.name} became your new residence tier.`, 'asset');
    return true;
  };

  const upgradeResidenceSecurity = () => {
    if (!residence || residenceSecurity >= 25 || !spend(residenceSecurityCost)) return false;
    setResidenceSecurity((value) => value + 1);
    addActivityItem(setActivity, `Residence security upgraded to level ${residenceSecurity + 1}.`, 'upgrade');
    return true;
  };

  const upgradeResidenceStaff = () => {
    if (!residence || residenceStaff >= 25 || !spend(residenceStaffCost)) return false;
    setResidenceStaff((value) => value + 1);
    addActivityItem(setActivity, `Residence staff upgraded to level ${residenceStaff + 1}.`, 'upgrade');
    return true;
  };

  const buyResidenceImprovement = (id) => {
    const item = residenceImprovementData.find((improvement) => improvement.id === id);
    if (!item || residenceTier < item.minTier || residenceImprovementsOwned.includes(id) || !spend(item.cost)) return false;
    setResidenceImprovementsOwned((items) => [...items, id]);
    addActivityItem(setActivity, `${item.name} added to your residence.`, 'asset');
    return true;
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
      setTaxAccounts((accounts) => ({
        ...accounts,
        stocks: {
          ...accounts.stocks,
          dueAt: accounts.stocks.dueAt && accounts.stocks.dueAt > Date.now()
            ? accounts.stocks.dueAt
            : Date.now() + TAX_PERIOD_MS,
        },
      }));
      addActivityItem(setActivity, `Bought ${qty} ${item.symbol} for ${Math.round(cost).toLocaleString()}.`, 'market');
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
    if (!job || netWorth < job.unlockNetWorth) return false;
    setActiveJobId(id);
    setLastWorkedAt(0);
    addActivityItem(setActivity, `${job.name} is now your active job.`, 'career');
    return true;
  };

  const workJob = () => {
    if (!selectedJob || !jobReady) return false;
    const pay = jobShiftPay;
    setBalance((value) => value + pay);
    setTotalEarned((value) => value + pay);
    setLastWorkedAt(Date.now());
    addActivityItem(setActivity, `Worked a ${selectedJob.name} shift: +$${Math.round(pay).toLocaleString()}.`, 'career');
    return true;
  };

  const payTax = (category) => {
    if (!['business', 'stocks', 'realEstate'].includes(category)) return false;
    const account = taxAccounts[category];
    const amount = Math.max(0, Number(account?.accrued || 0));
    if (amount <= 0 || balance < amount) return false;
    const now = Date.now();
    setBalance((value) => value - amount);
    setTaxAccounts((accounts) => ({
      ...accounts,
      [category]: {
        ...accounts[category],
        accrued: 0,
        dueAt: now + TAX_PERIOD_MS,
        lastPaidAt: now,
      },
    }));
    const names = { business: 'company', stocks: 'stock', realEstate: 'real estate' };
    addActivityItem(setActivity, `Paid $${Math.round(amount).toLocaleString()} in ${names[category]} tax.`, 'tax');
    return true;
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
    const base = businessCatalogData.find((business) => business.id === (owned?.typeId || owned?.id));
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
      hasPassiveSource,
      businessIncomePerSec,
      businessGrossIncomePerSec,
      propertyIncomePerSec,
      propertyGrossIncomePerSec,
      jobIncomePerSec,
      dividendIncomePerSec,
      dividendGrossIncomePerSec,
      taxes,
      totalTaxDue,
      businesses,
      businessCatalog,
      acquisitionTargets,
      acquisitionHistory,
      mergerGroups,
      mergerCount,
      properties,
      propertyCatalog,
      assets,
      assetCatalog,
      stocks,
      crypto,
      jobs,
      activeJobId,
      selectedJob,
      jobShiftPay,
      jobReady,
      jobReadyAt,
      stockValue,
      cryptoValue,
      marketValue,
      businessValue,
      propertyValue,
      assetValue,
      prestige,
      residence,
      residenceTier,
      residenceCatalog,
      residenceImprovements,
      residenceSecurity,
      residenceStaff,
      residenceSecurityCost,
      residenceStaffCost,
      residenceValue,
      netWorth,
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
      acquireTarget,
      mergeBusinesses,
      buyProperty,
      buyAsset,
      buyResidenceTier,
      upgradeResidenceSecurity,
      upgradeResidenceStaff,
      buyResidenceImprovement,
      buyStock,
      sellStock,
      buyCrypto,
      sellCrypto,
      takeJob,
      workJob,
      payTax,
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
