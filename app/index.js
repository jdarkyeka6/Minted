import React, { useMemo, useState } from 'react';
import { SafeAreaView, View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '../src/GameContext';

const money = (n) => {
  if (n >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return '$' + (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
  return '$' + Math.floor(n).toLocaleString();
};

function Card({ children, style }) { return <View style={[styles.card, style]}>{children}</View>; }
function Pill({ label, active, onPress }) { return <Pressable onPress={onPress} style={[styles.pill, active && styles.pillActive]}><Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text></Pressable>; }

export default function App() {
  const [tab, setTab] = useState('Home');
  const game = useGame();
  const netWorth = game.balance + game.businesses.reduce((a,b)=>a+b.value,0) + game.portfolioValue;
  const passivePerSec = game.passivePerSec;

  return <SafeAreaView style={styles.safe}>
    <View style={styles.topbar}>
      <View><Text style={styles.eyebrow}>NET WORTH</Text><Text style={styles.balance}>{money(netWorth)}</Text></View>
      <View style={styles.incomeBadge}><Text style={styles.incomeText}>+{money(passivePerSec)}/s</Text></View>
    </View>
    <View style={styles.body}>
      {tab === 'Home' && <Home game={game} />}
      {tab === 'Business' && <Business game={game} />}
      {tab === 'Invest' && <Invest game={game} />}
      {tab === 'Job' && <Jobs game={game} />}
      {tab === 'Profile' && <Profile game={game} netWorth={netWorth} />}
    </View>
    <View style={styles.nav}>
      {['Invest','Business','Home','Job','Profile'].map(t => <Pressable key={t} onPress={()=>setTab(t)} style={[styles.navItem, tab===t&&styles.navItemActive]}><Text style={[styles.navText, tab===t&&styles.navTextActive]}>{t}</Text></Pressable>)}
    </View>
  </SafeAreaView>
}

function Home({game}) {
  return <ScrollView contentContainerStyle={styles.scroll}>
    <Text style={styles.title}>Build your empire.</Text>
    <Text style={styles.subtitle}>Tap, buy, automate, repeat. Tiny capitalism in your pocket.</Text>
    <Pressable onPress={()=>{ game.tap(); Haptics.selectionAsync(); }} style={styles.tapButton}>
      <Text style={styles.tapSmall}>TAP TO EARN</Text><Text style={styles.tapBig}>+{money(game.clickValue)}</Text>
    </Pressable>
    <Card><View style={styles.row}><View><Text style={styles.cardTitle}>Click Upgrade</Text><Text style={styles.muted}>Next tap value: {money(game.nextClickValue)}</Text></View><Pressable onPress={game.buyClickUpgrade} disabled={!game.canBuyClick} style={[styles.action, !game.canBuyClick&&styles.disabled]}><Text style={styles.actionText}>{game.maxClick ? 'MAX' : money(game.clickUpgradeCost)}</Text></Pressable></View></Card>
    <Text style={styles.section}>Shop</Text>
    {game.shopItems.map(item=><Card key={item.id}><View style={styles.row}><View style={{flex:1}}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.muted}>{item.description}</Text></View><Pressable disabled={item.owned||game.balance<item.cost} onPress={()=>game.buyShop(item.id)} style={[styles.action,(item.owned||game.balance<item.cost)&&styles.disabled]}><Text style={styles.actionText}>{item.owned?'Owned':money(item.cost)}</Text></Pressable></View></Card>)}
  </ScrollView>
}

function Business({game}) {
  return <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Businesses</Text><Text style={styles.subtitle}>The bit that eventually makes clicking look adorable.</Text>
    {game.businessCatalog.map(b => {
      const owned = game.businesses.find(x=>x.id===b.id);
      return <Card key={b.id}><Text style={styles.cardTitle}>{b.name}</Text><Text style={styles.muted}>{owned ? `${owned.units} units • ${money(owned.incomePerSec)}/s` : `${money(b.cost)} to open`}</Text>
      <View style={[styles.row,{marginTop:12}]}>{owned ? <><Pressable onPress={()=>game.buyUnit(b.id)} disabled={game.balance<owned.unitCost} style={[styles.action,game.balance<owned.unitCost&&styles.disabled]}><Text style={styles.actionText}>+1 {money(owned.unitCost)}</Text></Pressable><Pressable onPress={()=>game.upgradeBusiness(b.id)} disabled={game.balance<owned.upgradeCost} style={[styles.actionAlt,game.balance<owned.upgradeCost&&styles.disabled]}><Text style={styles.actionText}>Upgrade {money(owned.upgradeCost)}</Text></Pressable></> : <Pressable onPress={()=>game.buyBusiness(b.id)} disabled={!b.unlocked||game.balance<b.cost} style={[styles.action,(!b.unlocked||game.balance<b.cost)&&styles.disabled]}><Text style={styles.actionText}>{b.unlocked?'Open':'Locked'}</Text></Pressable>}</View></Card>
    })}
  </ScrollView>
}

function Invest({game}) {
  const [sub,setSub]=useState('Stocks');
  return <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Invest</Text><View style={styles.pills}>{['Stocks','Real Estate','Crypto'].map(x=><Pill key={x} label={x} active={sub===x} onPress={()=>setSub(x)}/>)}</View>
    {sub==='Stocks' && game.stocks.map(s=><Card key={s.id}><View style={styles.row}><View><Text style={styles.cardTitle}>{s.symbol} · {s.name}</Text><Text style={styles.muted}>{money(s.price)} • You own {s.shares}</Text></View><Pressable onPress={()=>game.buyStock(s.id)} disabled={game.balance<s.price} style={[styles.action,game.balance<s.price&&styles.disabled]}><Text style={styles.actionText}>Buy 1</Text></Pressable></View></Card>)}
    {sub==='Real Estate' && <Card><Text style={styles.cardTitle}>Property Market</Text><Text style={styles.muted}>Coming in the next build. The shop already has the unlock path ready.</Text></Card>}
    {sub==='Crypto' && <Card><Text style={styles.cardTitle}>Crypto Market</Text><Text style={styles.muted}>Coming next build with faster price swings than stocks.</Text></Card>}
  </ScrollView>
}

function Jobs({game}) {
  return <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Career</Text><Text style={styles.subtitle}>Jobs give steady income while businesses scale.</Text>
    {game.jobs.map(j=><Card key={j.id}><View style={styles.row}><View><Text style={styles.cardTitle}>{j.name}</Text><Text style={styles.muted}>{money(j.incomePerSec)}/s • {j.hours} hrs/week</Text></View><Pressable onPress={()=>game.toggleJob(j.id)} style={[styles.actionAlt,j.active&&styles.action]}><Text style={styles.actionText}>{j.active?'Active':'Start'}</Text></Pressable></View></Card>)}
  </ScrollView>
}

function Profile({game,netWorth}) {
  const [sub,setSub]=useState('Profile');
  const achievements = useMemo(()=>[
    ['First $100',game.totalEarned>=100],['First business',game.businesses.length>0],['$10K net worth',netWorth>=10000],['Investor',game.stocks.some(s=>s.shares>0)]
  ],[game.totalEarned,game.businesses,netWorth,game.stocks]);
  return <ScrollView contentContainerStyle={styles.scroll}><Text style={styles.title}>Profile</Text><View style={styles.pills}>{['Profile','Assets','Achievements','Stats'].map(x=><Pill key={x} label={x} active={sub===x} onPress={()=>setSub(x)}/>)}</View>
    {sub==='Profile' && <><Card><Text style={styles.eyebrow}>CURRENT BALANCE</Text><Text style={styles.bigNumber}>{money(game.balance)}</Text><Text style={styles.muted}>Net worth {money(netWorth)}</Text></Card><Card><Text style={styles.cardTitle}>Empire health</Text><Text style={styles.muted}>{game.businesses.length} businesses • {game.jobs.filter(j=>j.active).length} active jobs • {game.stocks.reduce((a,s)=>a+s.shares,0)} shares</Text></Card></>}
    {sub==='Assets' && <Card><Text style={styles.cardTitle}>Everything you own</Text><Text style={styles.muted}>Cash {money(game.balance)}\nBusinesses {game.businesses.length}\nStocks {money(game.portfolioValue)}\nShop items {game.shopItems.filter(x=>x.owned).length}</Text></Card>}
    {sub==='Achievements' && achievements.map(([name,done])=><Card key={name}><Text style={styles.cardTitle}>{done?'✓':'○'} {name}</Text></Card>)}
    {sub==='Stats' && <Card><Text style={styles.cardTitle}>Lifetime stats</Text><Text style={styles.muted}>Total earned {money(game.totalEarned)}\nTotal taps {game.totalClicks.toLocaleString()}\nPassive income {money(game.passivePerSec)}/s</Text></Card>}
  </ScrollView>
}

const styles=StyleSheet.create({
  safe:{flex:1,backgroundColor:'#0a0d12'}, body:{flex:1}, scroll:{padding:18,paddingBottom:30,gap:12}, topbar:{paddingHorizontal:18,paddingTop:12,paddingBottom:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center',borderBottomWidth:1,borderColor:'#1a2230'}, eyebrow:{fontSize:11,color:'#7d8da7',fontWeight:'800',letterSpacing:1.2}, balance:{fontSize:26,color:'white',fontWeight:'900'}, incomeBadge:{backgroundColor:'#122d25',paddingHorizontal:12,paddingVertical:8,borderRadius:999}, incomeText:{color:'#75e2ad',fontWeight:'800'}, title:{fontSize:30,color:'white',fontWeight:'900',marginTop:4}, subtitle:{fontSize:14,color:'#8492a8',lineHeight:20,marginBottom:8}, card:{backgroundColor:'#111722',borderWidth:1,borderColor:'#1c2635',borderRadius:20,padding:16}, cardTitle:{color:'white',fontSize:17,fontWeight:'800'}, muted:{color:'#8d9bb0',marginTop:5,lineHeight:20}, row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:10}, tapButton:{height:230,borderRadius:32,backgroundColor:'#5f78ff',alignItems:'center',justifyContent:'center',marginVertical:6}, tapSmall:{color:'#dce2ff',fontSize:13,fontWeight:'800',letterSpacing:2}, tapBig:{color:'white',fontSize:48,fontWeight:'900',marginTop:8}, action:{backgroundColor:'#5f78ff',paddingHorizontal:14,paddingVertical:11,borderRadius:12}, actionAlt:{backgroundColor:'#202a3b',paddingHorizontal:14,paddingVertical:11,borderRadius:12}, actionText:{color:'white',fontWeight:'800',fontSize:12}, disabled:{opacity:.35}, section:{fontSize:20,color:'white',fontWeight:'900',marginTop:8}, pills:{flexDirection:'row',gap:8,flexWrap:'wrap',marginBottom:4}, pill:{paddingHorizontal:13,paddingVertical:9,borderRadius:999,backgroundColor:'#141b27'}, pillActive:{backgroundColor:'#e8ecff'}, pillText:{color:'#92a0b4',fontWeight:'800',fontSize:12}, pillTextActive:{color:'#0d1320'}, nav:{height:74,flexDirection:'row',borderTopWidth:1,borderColor:'#1b2432',backgroundColor:'#0d1118',paddingHorizontal:8,paddingBottom:8}, navItem:{flex:1,alignItems:'center',justifyContent:'center',borderRadius:16,margin:6}, navItemActive:{backgroundColor:'#171f2d'}, navText:{color:'#65738a',fontSize:11,fontWeight:'800'}, navTextActive:{color:'white'}, bigNumber:{color:'white',fontSize:36,fontWeight:'900',marginTop:8}
});
