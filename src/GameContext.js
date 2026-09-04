import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GameContext=createContext(null);
const SAVE_KEY='minted-save-v1';
const clickTiers=[1,5,10,100,1000,10000,100000];
const clickCosts=[0,500,5000,50000,500000,5000000,50000000];
const catalog=[
  {id:'taxi',name:'Taxi Service',cost:250,baseIncome:.6,unlocked:true},
  {id:'coffee',name:'Coffee Shop',cost:1500,baseIncome:2.5,unlocked:true},
  {id:'restaurant',name:'Restaurant',cost:7000,baseIncome:9,unlockItem:'restaurant'},
  {id:'tech',name:'Tech Startup',cost:25000,baseIncome:35,unlockItem:'laptop'},
  {id:'manufacturing',name:'Manufacturing',cost:80000,baseIncome:100,unlockItem:'factory'}
];
const defaultShop=[
  {id:'laptop',name:'Laptop',cost:500,description:'Unlocks Tech Startup',owned:false},
  {id:'restaurant',name:'Kitchen Setup',cost:1500,description:'Unlocks Restaurant',owned:false},
  {id:'factory',name:'Factory Equipment',cost:2000,description:'Unlocks Manufacturing',owned:false},
  {id:'stocks',name:'Stock Market Access',cost:10000,description:'Unlocks advanced investing later',owned:false}
];
const defaultStocks=[
  {id:'APPL',symbol:'APPL',name:'Apple-ish',price:150,shares:0},
  {id:'NVDA',symbol:'NVDA',name:'Nvidia-ish',price:95,shares:0},
  {id:'TSLA',symbol:'TSLA',name:'Tesla-ish',price:240,shares:0}
];
const defaultJobs=[
  {id:'burger',name:'Burger Flipper',incomePerSec:.25,hours:20,active:false},
  {id:'cashier',name:'Cashier',incomePerSec:.4,hours:25,active:false},
  {id:'office',name:'Office Worker',incomePerSec:1.2,hours:40,active:false}
];

export function GameProvider({children}){
  const [loaded,setLoaded]=useState(false);
  const [balance,setBalance]=useState(0);
  const [totalEarned,setTotalEarned]=useState(0);
  const [totalClicks,setTotalClicks]=useState(0);
  const [clickTier,setClickTier]=useState(0);
  const [businesses,setBusinesses]=useState([]);
  const [shopItems,setShopItems]=useState(defaultShop);
  const [stocks,setStocks]=useState(defaultStocks);
  const [jobs,setJobs]=useState(defaultJobs);

  useEffect(()=>{(async()=>{try{const raw=await AsyncStorage.getItem(SAVE_KEY); if(raw){const s=JSON.parse(raw);setBalance(s.balance??0);setTotalEarned(s.totalEarned??0);setTotalClicks(s.totalClicks??0);setClickTier(s.clickTier??0);setBusinesses(s.businesses??[]);setShopItems(s.shopItems??defaultShop);setStocks(s.stocks??defaultStocks);setJobs(s.jobs??defaultJobs);}}finally{setLoaded(true)}})()},[]);

  const passivePerSec=useMemo(()=>businesses.reduce((a,b)=>a+b.incomePerSec,0)+jobs.filter(j=>j.active).reduce((a,j)=>a+j.incomePerSec,0),[businesses,jobs]);
  useEffect(()=>{if(!loaded)return; const id=setInterval(()=>{const add=passivePerSec/10; if(add>0){setBalance(v=>v+add);setTotalEarned(v=>v+add)}},100);return()=>clearInterval(id)},[passivePerSec,loaded]);
  useEffect(()=>{if(!loaded)return; const id=setInterval(()=>AsyncStorage.setItem(SAVE_KEY,JSON.stringify({balance,totalEarned,totalClicks,clickTier,businesses,shopItems,stocks,jobs})),5000);return()=>clearInterval(id)},[loaded,balance,totalEarned,totalClicks,clickTier,businesses,shopItems,stocks,jobs]);
  useEffect(()=>{if(!loaded)return; const id=setInterval(()=>setStocks(prev=>prev.map(s=>({...s,price:Math.max(1,s.price*(1+(Math.random()-.48)*.035))}))),5000); return()=>clearInterval(id)},[loaded]);

  const clickValue=clickTiers[clickTier]; const maxClick=clickTier===clickTiers.length-1; const nextClickValue=maxClick?clickValue:clickTiers[clickTier+1]; const clickUpgradeCost=maxClick?0:clickCosts[clickTier+1]; const canBuyClick=!maxClick&&balance>=clickUpgradeCost;
  const portfolioValue=stocks.reduce((a,s)=>a+s.shares*s.price,0);
  const businessCatalog=catalog.map(b=>({...b,unlocked:b.unlocked||shopItems.some(x=>x.id===b.unlockItem&&x.owned)}));
  const spend=(n)=>{if(balance<n)return false;setBalance(v=>v-n);return true};
  const tap=()=>{setBalance(v=>v+clickValue);setTotalEarned(v=>v+clickValue);setTotalClicks(v=>v+1)};
  const buyClickUpgrade=()=>{if(canBuyClick&&spend(clickUpgradeCost))setClickTier(v=>v+1)};
  const buyShop=(id)=>setShopItems(prev=>{const item=prev.find(x=>x.id===id);if(!item||item.owned||balance<item.cost)return prev;if(!spend(item.cost))return prev;return prev.map(x=>x.id===id?{...x,owned:true}:x)});
  const buyBusiness=(id)=>{const b=businessCatalog.find(x=>x.id===id);if(!b||!b.unlocked||businesses.some(x=>x.id===id)||!spend(b.cost))return;setBusinesses(v=>[...v,{id:b.id,name:b.name,units:1,incomePerSec:b.baseIncome,value:b.cost,unitCost:Math.round(b.cost*.45),upgradeCost:Math.round(b.cost*.8),multiplier:1}])};
  const buyUnit=(id)=>{const b=businesses.find(x=>x.id===id);if(!b||!spend(b.unitCost))return;const base=catalog.find(x=>x.id===id).baseIncome;setBusinesses(v=>v.map(x=>x.id===id?{...x,units:x.units+1,incomePerSec:x.incomePerSec+base*x.multiplier,value:x.value+x.unitCost,unitCost:Math.ceil(x.unitCost*1.16)}:x))};
  const upgradeBusiness=(id)=>{const b=businesses.find(x=>x.id===id);if(!b||!spend(b.upgradeCost))return;setBusinesses(v=>v.map(x=>x.id===id?{...x,multiplier:x.multiplier*1.25,incomePerSec:x.incomePerSec*1.25,value:x.value+x.upgradeCost,upgradeCost:Math.ceil(x.upgradeCost*2.2)}:x))};
  const buyStock=(id)=>{const s=stocks.find(x=>x.id===id);if(!s||!spend(s.price))return;setStocks(v=>v.map(x=>x.id===id?{...x,shares:x.shares+1}:x))};
  const toggleJob=(id)=>setJobs(v=>v.map(x=>x.id===id?{...x,active:!x.active}:x));

  return <GameContext.Provider value={{balance,totalEarned,totalClicks,clickValue,nextClickValue,clickUpgradeCost,canBuyClick,maxClick,passivePerSec,businesses,businessCatalog,shopItems,stocks,jobs,portfolioValue,tap,buyClickUpgrade,buyShop,buyBusiness,buyUnit,upgradeBusiness,buyStock,toggleJob}}>{children}</GameContext.Provider>
}
export const useGame=()=>useContext(GameContext);
