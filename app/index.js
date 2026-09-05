import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
  Modal,
  StatusBar,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '../src/GameContext';

const NAV = [
  ['Empire', '◈'],
  ['Markets', '↗'],
  ['Business', '▦'],
  ['Assets', '◆'],
  ['Earn', '✦'],
];

const money = (value, precise = false) => {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const format = (divisor, suffix, decimals = 2) => `${sign}$${(abs / divisor).toFixed(decimals)}${suffix}`;
  if (abs >= 1e15) return format(1e15, 'Q');
  if (abs >= 1e12) return format(1e12, 'T');
  if (abs >= 1e9) return format(1e9, 'B');
  if (abs >= 1e6) return format(1e6, 'M');
  if (abs >= 1e3) return format(1e3, 'K', precise ? 2 : 1);
  if (precise) return `${sign}$${abs.toFixed(2)}`;
  return `${sign}$${Math.floor(abs).toLocaleString()}`;
};

const pct = (value) => `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

function Card({ children, style, onPress }) {
  if (onPress) {
    return <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>{children}</Pressable>;
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

function SectionHeader({ title, caption, right }) {
  return (
    <View style={styles.sectionHead}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!caption && <Text style={styles.sectionCaption}>{caption}</Text>}
      </View>
      {right}
    </View>
  );
}

function ActionButton({ label, onPress, disabled, secondary = false, compact = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.action,
        secondary && styles.actionSecondary,
        compact && styles.actionCompact,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.actionText, secondary && styles.actionTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function Metric({ label, value, accent }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.accentText]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)} style={[styles.segment, value === option && styles.segmentActive]}>
          <Text style={[styles.segmentText, value === option && styles.segmentTextActive]}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState('Empire');
  const [offlineVisible, setOfflineVisible] = useState(true);

  if (!game.loaded) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.loading}>
          <Text style={styles.logoMark}>M</Text>
          <Text style={styles.loadingTitle}>MINTED</Text>
          <Text style={styles.muted}>Loading your empire…</Text>
        </View>
      </SafeAreaView>
    );
  }

  const closeOffline = () => {
    setOfflineVisible(false);
    game.clearOfflineEarnings();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={styles.topbar}>
        <View>
          <Text style={styles.kicker}>NET WORTH</Text>
          <Text style={styles.topBalance}>{money(game.netWorth)}</Text>
        </View>
        <View style={styles.topRight}>
          <View style={styles.incomePill}>
            <Text style={styles.incomePillText}>+{money(game.passivePerSec, true)}/s</Text>
          </View>
          <Text style={styles.cashLabel}>{money(game.balance)} cash</Text>
        </View>
      </View>

      <View style={styles.body}>
        {tab === 'Empire' && <Empire game={game} setTab={setTab} />}
        {tab === 'Markets' && <Markets game={game} />}
        {tab === 'Business' && <Businesses game={game} />}
        {tab === 'Assets' && <Assets game={game} />}
        {tab === 'Earn' && <Earn game={game} />}
      </View>

      <View style={styles.nav}>
        {NAV.map(([name, icon]) => (
          <Pressable key={name} onPress={() => { Haptics.selectionAsync(); setTab(name); }} style={styles.navItem}>
            <View style={[styles.navIconWrap, tab === name && styles.navIconWrapActive]}>
              <Text style={[styles.navIcon, tab === name && styles.navIconActive]}>{icon}</Text>
            </View>
            <Text style={[styles.navText, tab === name && styles.navTextActive]}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <Modal transparent animationType="fade" visible={offlineVisible && game.offlineEarnings > 0} onRequestClose={closeOffline}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Text style={styles.modalIconText}>↗</Text></View>
            <Text style={styles.modalKicker}>WHILE YOU WERE AWAY</Text>
            <Text style={styles.modalMoney}>+{money(game.offlineEarnings)}</Text>
            <Text style={styles.modalCopy}>Your businesses, property, career and dividends kept working. Minted banks up to 8 hours of offline income.</Text>
            <ActionButton label="Collect" onPress={closeOffline} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Empire({ game, setTab }) {
  const biggest = useMemo(() => {
    const slices = [
      ['Cash', game.balance],
      ['Businesses', game.businessValue],
      ['Property', game.propertyValue],
      ['Markets', game.marketValue],
      ['Lifestyle', game.assetValue],
    ];
    return slices.sort((a, b) => b[1] - a[1])[0];
  }, [game.balance, game.businessValue, game.propertyValue, game.marketValue, game.assetValue]);

  const nextGoal = game.netWorth < 1000 ? 1000 : game.netWorth < 10000 ? 10000 : game.netWorth < 100000 ? 100000 : game.netWorth < 1000000 ? 1000000 : game.netWorth < 10000000 ? 10000000 : Math.pow(10, Math.ceil(Math.log10(game.netWorth + 1)));
  const progress = Math.min(1, game.netWorth / nextGoal);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroKicker}>YOUR EMPIRE</Text>
        <Text style={styles.heroTitle}>{money(game.netWorth)}</Text>
        <Text style={styles.heroSub}>Net worth</Text>
        <View style={styles.heroMetrics}>
          <Metric label="CASH" value={money(game.balance)} />
          <Metric label="INCOME / SEC" value={`+${money(game.passivePerSec, true)}`} accent />
        </View>
      </View>

      <Card style={styles.goalCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardEyebrow}>NEXT MILESTONE</Text>
            <Text style={styles.cardTitle}>{money(nextGoal)} net worth</Text>
          </View>
          <Text style={styles.goalPct}>{Math.floor(progress * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
      </Card>

      <SectionHeader title="Portfolio" caption={`${biggest[0]} is currently your biggest slice.`} />
      <Card>
        <PortfolioRow label="Cash" icon="●" value={game.balance} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Businesses" icon="▦" value={game.businessValue} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Property" icon="⌂" value={game.propertyValue} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Markets" icon="↗" value={game.marketValue} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Lifestyle" icon="◆" value={game.assetValue} total={game.netWorth + game.taxDue} last />
      </Card>

      <SectionHeader title="Money machine" caption="Where your passive income is coming from right now." />
      <View style={styles.twoCol}>
        <SmallStat icon="▦" label="Business" value={`${money(game.businessIncomePerSec, true)}/s`} />
        <SmallStat icon="⌂" label="Rent" value={`${money(game.propertyIncomePerSec, true)}/s`} />
        <SmallStat icon="◉" label="Career" value={`${money(game.jobIncomePerSec, true)}/s`} />
        <SmallStat icon="↗" label="Dividends" value={`${money(game.dividendIncomePerSec, true)}/s`} />
      </View>

      {game.taxDue > 0 && (
        <Card style={styles.taxCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>TAX OFFICE</Text>
              <Text style={styles.cardTitle}>{money(game.taxDue)} due</Text>
              <Text style={styles.cardBody}>A small slice of earnings becomes tax due. Pay it when you have the cash.</Text>
            </View>
            <ActionButton compact label="Pay" onPress={game.payTaxes} disabled={game.balance <= 0} />
          </View>
        </Card>
      )}

      <SectionHeader title="Jump back in" />
      <View style={styles.quickGrid}>
        <QuickAction icon="↗" title="Markets" body={money(game.marketValue)} onPress={() => setTab('Markets')} />
        <QuickAction icon="▦" title="Business" body={`${game.businesses.length} owned`} onPress={() => setTab('Business')} />
        <QuickAction icon="◆" title="Assets" body={`${game.assets.length} flex items`} onPress={() => setTab('Assets')} />
        <QuickAction icon="✦" title="Earn" body={`${money(game.clickValue)} / tap`} onPress={() => setTab('Earn')} />
      </View>
    </ScrollView>
  );
}

function PortfolioRow({ label, icon, value, total, last }) {
  const share = total > 0 ? Math.min(1, Math.max(0, value / total)) : 0;
  return (
    <View style={[styles.portfolioRow, last && { borderBottomWidth: 0, paddingBottom: 0 }]}>
      <View style={styles.portfolioLeft}>
        <View style={styles.squareIcon}><Text style={styles.squareIconText}>{icon}</Text></View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.portfolioName}>{label}</Text>
            <Text style={styles.portfolioValue}>{money(value)}</Text>
          </View>
          <View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${share * 100}%` }]} /></View>
        </View>
      </View>
    </View>
  );
}

function SmallStat({ icon, label, value }) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallStatIcon}>{icon}</Text>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <Text style={styles.smallStatValue}>{value}</Text>
    </View>
  );
}

function QuickAction({ icon, title, body, onPress }) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickBody}>{body}</Text>
    </Pressable>
  );
}

function Markets({ game }) {
  const [segment, setSegment] = useState('Stocks');
  const market = segment === 'Stocks' ? game.stocks : game.crypto;
  const holdingsValue = segment === 'Stocks' ? game.stockValue : game.cryptoValue;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageKicker}>MINTED MARKETS</Text>
      <Text style={styles.pageTitle}>Markets</Text>
      <Text style={styles.pageIntro}>Prices move every few seconds. Build positions, watch gains swing, collect stock dividends and cash out whenever you want.</Text>

      <Card style={styles.marketSummary}>
        <Text style={styles.cardEyebrow}>MARKET HOLDINGS</Text>
        <Text style={styles.summaryMoney}>{money(game.marketValue)}</Text>
        <View style={styles.summaryRow}>
          <View><Text style={styles.summaryTiny}>STOCKS</Text><Text style={styles.summaryMini}>{money(game.stockValue)}</Text></View>
          <View><Text style={styles.summaryTiny}>CRYPTO</Text><Text style={styles.summaryMini}>{money(game.cryptoValue)}</Text></View>
          <View><Text style={styles.summaryTiny}>DIVIDENDS</Text><Text style={[styles.summaryMini, styles.accentText]}>+{money(game.dividendIncomePerSec, true)}/s</Text></View>
        </View>
      </Card>

      <Segmented options={['Stocks', 'Crypto']} value={segment} onChange={setSegment} />

      <SectionHeader title={segment} caption={`${money(holdingsValue)} currently invested`} />
      {market.map((item) => {
        const units = segment === 'Stocks' ? item.shares : item.units;
        const holding = units * item.price;
        const gain = item.avgCost > 0 ? ((item.price - item.avgCost) / item.avgCost) * 100 : 0;
        const canSell = units > 0;
        return (
          <Card key={item.id} style={styles.marketCard}>
            <View style={styles.marketTop}>
              <View style={styles.marketIdentity}>
                <View style={styles.marketIcon}><Text style={styles.marketIconText}>{item.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.marketSymbol}>{item.symbol}</Text>
                  <Text style={styles.marketName}>{item.name}</Text>
                </View>
              </View>
              <View style={styles.marketPriceWrap}>
                <Text style={styles.marketPrice}>{money(item.price, true)}</Text>
                <Text style={[styles.change, item.changePct >= 0 ? styles.positive : styles.negative]}>{pct(item.changePct)}</Text>
              </View>
            </View>

            <View style={styles.fakeChart}>
              {[28, 43, 35, 58, 47, 67, 52, 73, 64, 86, 76, item.changePct >= 0 ? 92 : 61].map((height, index) => (
                <View key={index} style={[styles.chartBar, { height: `${height}%` }]} />
              ))}
            </View>

            <View style={styles.holdingStrip}>
              <View><Text style={styles.holdingLabel}>YOU OWN</Text><Text style={styles.holdingValue}>{units} {segment === 'Stocks' ? 'shares' : 'coins'}</Text></View>
              <View><Text style={styles.holdingLabel}>VALUE</Text><Text style={styles.holdingValue}>{money(holding)}</Text></View>
              <View><Text style={styles.holdingLabel}>GAIN</Text><Text style={[styles.holdingValue, gain >= 0 ? styles.positive : styles.negative]}>{units ? pct(gain) : '—'}</Text></View>
            </View>

            <View style={styles.actionRow}>
              <ActionButton
                label={`Buy 1 · ${money(item.price, true)}`}
                onPress={() => segment === 'Stocks' ? game.buyStock(item.id) : game.buyCrypto(item.id)}
                disabled={game.balance < item.price}
              />
              <ActionButton
                secondary
                label="Sell 1"
                onPress={() => segment === 'Stocks' ? game.sellStock(item.id) : game.sellCrypto(item.id)}
                disabled={!canSell}
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Businesses({ game }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageKicker}>BUILD SOMETHING BIG</Text>
      <Text style={styles.pageTitle}>Business</Text>
      <Text style={styles.pageIntro}>Open companies, expand locations and upgrade operations until tapping for money feels prehistoric.</Text>

      <Card style={styles.businessSummary}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.cardEyebrow}>BUSINESS VALUE</Text>
            <Text style={styles.summaryMoney}>{money(game.businessValue)}</Text>
          </View>
          <View style={styles.summaryBadge}><Text style={styles.summaryBadgeText}>+{money(game.businessIncomePerSec, true)}/s</Text></View>
        </View>
      </Card>

      <SectionHeader title="Your companies" caption={game.businesses.length ? `${game.businesses.length} operating` : 'Your first empire starts small.'} />

      {game.businessCatalog.map((base) => {
        const owned = game.businesses.find((item) => item.id === base.id);
        return (
          <Card key={base.id} style={!base.unlocked && styles.lockedCard}>
            <View style={styles.companyTop}>
              <View style={styles.companyIcon}><Text style={styles.companyEmoji}>{base.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.companyNameRow}>
                  <Text style={styles.companyName}>{base.name}</Text>
                  <Text style={styles.industryChip}>{base.industry}</Text>
                </View>
                <Text style={styles.companyMeta}>{owned ? `Level ${owned.level} · ${owned.units} ${owned.units === 1 ? 'location' : 'locations'}` : base.unlocked ? `${money(base.cost)} to launch` : `Unlock near ${money(base.cost * 0.35)} net worth`}</Text>
              </View>
            </View>

            {owned ? (
              <>
                <View style={styles.businessNumbers}>
                  <Metric label="VALUE" value={money(owned.value)} />
                  <Metric label="PROFIT / SEC" value={`+${money(owned.incomePerSec, true)}`} accent />
                  <Metric label="MULTIPLIER" value={`${owned.multiplier.toFixed(2)}×`} />
                </View>
                <View style={styles.actionRow}>
                  <ActionButton label={`Expand · ${money(owned.unitCost)}`} onPress={() => game.expandBusiness(base.id)} disabled={game.balance < owned.unitCost} />
                  <ActionButton secondary label={`Upgrade · ${money(owned.upgradeCost)}`} onPress={() => game.upgradeBusiness(base.id)} disabled={game.balance < owned.upgradeCost} />
                </View>
              </>
            ) : (
              <ActionButton label={base.unlocked ? `Launch for ${money(base.cost)}` : 'Locked'} onPress={() => game.buyBusiness(base.id)} disabled={!base.unlocked || game.balance < base.cost} />
            )}
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Assets({ game }) {
  const [segment, setSegment] = useState('Property');
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageKicker}>OWN THE WORLD</Text>
      <Text style={styles.pageTitle}>Assets</Text>
      <Text style={styles.pageIntro}>Property makes money. Lifestyle assets make the net-worth screen look ridiculous. Both count toward your empire.</Text>

      <View style={styles.assetSummaryRow}>
        <View style={styles.assetSummaryCard}><Text style={styles.cardEyebrow}>PROPERTY</Text><Text style={styles.assetSummaryValue}>{money(game.propertyValue)}</Text><Text style={styles.assetSummarySub}>+{money(game.propertyIncomePerSec, true)}/s rent</Text></View>
        <View style={styles.assetSummaryCard}><Text style={styles.cardEyebrow}>PRESTIGE</Text><Text style={styles.assetSummaryValue}>{game.prestige.toLocaleString()}</Text><Text style={styles.assetSummarySub}>{money(game.assetValue)} collection</Text></View>
      </View>

      <Segmented options={['Property', 'Lifestyle']} value={segment} onChange={setSegment} />

      {segment === 'Property' ? (
        <>
          <SectionHeader title="Property market" caption="Each purchase adds permanent rental income." />
          {game.propertyCatalog.map((item) => {
            const owned = game.properties.find((property) => property.id === item.id);
            return (
              <Card key={item.id} style={!item.unlocked && styles.lockedCard}>
                <View style={styles.assetCardTop}>
                  <View style={styles.assetEmojiWrap}><Text style={styles.assetEmoji}>{item.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyName}>{item.name}</Text>
                    <Text style={styles.companyMeta}>{item.location} · +{money(item.rentPerSec, true)}/s rent</Text>
                  </View>
                  {owned && <View style={styles.countBubble}><Text style={styles.countBubbleText}>×{owned.count}</Text></View>}
                </View>
                <View style={styles.assetFooter}>
                  <View><Text style={styles.holdingLabel}>PRICE</Text><Text style={styles.holdingValue}>{money(item.cost)}</Text></View>
                  <ActionButton compact label={item.unlocked ? 'Buy' : 'Locked'} onPress={() => game.buyProperty(item.id)} disabled={!item.unlocked || game.balance < item.cost} />
                </View>
              </Card>
            );
          })}
        </>
      ) : (
        <>
          <SectionHeader title="Lifestyle collection" caption="One of each. Pure flex, pure net worth." />
          {game.assetCatalog.map((item) => (
            <Card key={item.id} style={[styles.lifestyleCard, !item.unlocked && styles.lockedCard]}>
              <View style={styles.assetCardTop}>
                <View style={styles.assetEmojiWrap}><Text style={styles.assetEmoji}>{item.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{item.name}</Text>
                  <Text style={styles.companyMeta}>{item.prestige.toLocaleString()} prestige · {money(item.cost)}</Text>
                </View>
                {item.owned ? <View style={styles.ownedBadge}><Text style={styles.ownedBadgeText}>OWNED</Text></View> : <ActionButton compact label={item.unlocked ? 'Buy' : 'Locked'} onPress={() => game.buyAsset(item.id)} disabled={!item.unlocked || game.balance < item.cost} />}
              </View>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

function Earn({ game }) {
  const activeJob = game.jobs.find((job) => job.id === game.activeJobId);
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageKicker}>FROM ZERO TO EMPIRE</Text>
      <Text style={styles.pageTitle}>Earn</Text>
      <Text style={styles.pageIntro}>Tap when you are broke, work a career for steady cash, then let your empire take over.</Text>

      <Pressable
        onPress={() => {
          game.tap();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={({ pressed }) => [styles.tapMachine, pressed && styles.tapMachinePressed]}
      >
        <View style={styles.tapGlow} />
        <Text style={styles.tapKicker}>TAP TO EARN</Text>
        <Text style={styles.tapMoney}>+{money(game.clickValue)}</Text>
        <Text style={styles.tapHint}>{game.totalClicks.toLocaleString()} lifetime taps</Text>
      </Pressable>

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>TAP POWER</Text>
            <Text style={styles.cardTitle}>{game.maxClick ? 'Maximum upgrade reached' : `${money(game.clickValue)} → ${money(game.nextClickValue)} per tap`}</Text>
            <Text style={styles.cardBody}>{game.maxClick ? 'The empire has graduated from finger economics.' : `Upgrade cost: ${money(game.clickUpgradeCost)}`}</Text>
          </View>
          <ActionButton compact label={game.maxClick ? 'MAX' : 'Upgrade'} onPress={game.buyClickUpgrade} disabled={!game.canBuyClick} />
        </View>
      </Card>

      <SectionHeader title="Career" caption={activeJob ? `${activeJob.name} is paying ${money(activeJob.incomePerSec, true)}/s.` : 'Pick a job for steady income.'} />
      {game.jobs.map((job) => {
        const active = job.id === game.activeJobId;
        const unlocked = game.netWorth >= job.unlockNetWorth;
        return (
          <Card key={job.id} style={[styles.jobCard, active && styles.jobCardActive, !unlocked && styles.lockedCard]}>
            <View style={styles.jobRow}>
              <View style={styles.jobIcon}><Text style={styles.jobEmoji}>{job.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{job.name}</Text>
                <Text style={styles.companyMeta}>{unlocked ? `${money(job.incomePerSec, true)}/s steady income` : `Unlock at ${money(job.unlockNetWorth)} net worth`}</Text>
              </View>
              <ActionButton compact secondary={!active} label={active ? 'Active' : 'Take job'} onPress={() => game.takeJob(job.id)} disabled={!unlocked || active} />
            </View>
          </Card>
        );
      })}

      <SectionHeader title="Lifetime" />
      <Card>
        <View style={styles.businessNumbers}>
          <Metric label="TOTAL EARNED" value={money(game.totalEarned)} />
          <Metric label="TOTAL TAPS" value={game.totalClicks.toLocaleString()} />
          <Metric label="NET WORTH" value={money(game.netWorth)} accent />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070A0F' },
  body: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  logoMark: { width: 62, height: 62, lineHeight: 62, textAlign: 'center', borderRadius: 20, overflow: 'hidden', backgroundColor: '#7CFFB2', color: '#07110B', fontSize: 30, fontWeight: '1000' },
  loadingTitle: { color: '#F7F9FC', fontSize: 18, fontWeight: '900', letterSpacing: 5 },
  topbar: { minHeight: 72, paddingHorizontal: 18, paddingTop: 7, paddingBottom: 11, borderBottomWidth: 1, borderColor: '#151B24', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#090D13' },
  kicker: { color: '#687386', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  topBalance: { color: '#F7F9FC', fontSize: 26, fontWeight: '900', marginTop: 2, letterSpacing: -0.7 },
  topRight: { alignItems: 'flex-end', gap: 5 },
  incomePill: { backgroundColor: '#11271C', borderWidth: 1, borderColor: '#1C4930', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  incomePillText: { color: '#7CFFB2', fontWeight: '900', fontSize: 12 },
  cashLabel: { color: '#697486', fontSize: 10, fontWeight: '700' },
  scroll: { padding: 18, paddingBottom: 40, gap: 12 },
  pageKicker: { color: '#7CFFB2', fontSize: 11, fontWeight: '900', letterSpacing: 2.1, marginTop: 3 },
  pageTitle: { color: '#F7F9FC', fontSize: 36, fontWeight: '1000', letterSpacing: -1.2 },
  pageIntro: { color: '#8390A3', fontSize: 14, lineHeight: 21, marginTop: -4, marginBottom: 7 },
  card: { backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1A2230', borderRadius: 22, padding: 16 },
  pressed: { opacity: 0.74, transform: [{ scale: 0.99 }] },
  muted: { color: '#7C8799', fontSize: 13 },
  sectionHead: { marginTop: 10, marginBottom: 2, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 },
  sectionTitle: { color: '#F5F7FB', fontWeight: '900', fontSize: 21, letterSpacing: -0.35 },
  sectionCaption: { color: '#6F7B8D', fontSize: 12, marginTop: 3, lineHeight: 17 },
  cardEyebrow: { color: '#6F7C90', fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  cardTitle: { color: '#F5F7FB', fontSize: 17, fontWeight: '900', marginTop: 4 },
  cardBody: { color: '#7F8B9D', fontSize: 12, lineHeight: 17, marginTop: 5 },
  action: { flex: 1, minHeight: 46, borderRadius: 14, backgroundColor: '#7CFFB2', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 13, borderWidth: 1, borderColor: '#7CFFB2' },
  actionSecondary: { backgroundColor: '#171E28', borderColor: '#252F3D' },
  actionCompact: { flex: 0, minHeight: 40, paddingHorizontal: 15 },
  actionText: { color: '#07110B', fontSize: 12, fontWeight: '1000' },
  actionTextSecondary: { color: '#E7EBF2' },
  disabled: { opacity: 0.3 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  accentText: { color: '#7CFFB2' },
  positive: { color: '#7CFFB2' },
  negative: { color: '#FF748F' },

  hero: { minHeight: 242, borderRadius: 28, padding: 22, backgroundColor: '#101B17', borderWidth: 1, borderColor: '#1D3A2B', overflow: 'hidden' },
  heroKicker: { color: '#7CFFB2', fontSize: 11, fontWeight: '900', letterSpacing: 2.2 },
  heroTitle: { color: '#F8FFF9', fontSize: 49, fontWeight: '1000', letterSpacing: -2.4, marginTop: 16 },
  heroSub: { color: '#86A08F', fontSize: 13, fontWeight: '700', marginTop: 2 },
  heroMetrics: { marginTop: 'auto', flexDirection: 'row', borderTopWidth: 1, borderColor: '#21392C', paddingTop: 17, gap: 24 },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#677486', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  metricValue: { color: '#F0F4F8', fontSize: 15, fontWeight: '900', marginTop: 5 },
  goalCard: { backgroundColor: '#0E131B' },
  goalPct: { color: '#7CFFB2', fontSize: 17, fontWeight: '1000' },
  progressTrack: { height: 7, borderRadius: 99, backgroundColor: '#202936', marginTop: 15, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: '#7CFFB2' },
  portfolioRow: { borderBottomWidth: 1, borderColor: '#1B2330', paddingBottom: 14, marginBottom: 14 },
  portfolioLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  squareIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: '#171E28', alignItems: 'center', justifyContent: 'center' },
  squareIconText: { color: '#A9B7C9', fontSize: 16, fontWeight: '900' },
  portfolioName: { color: '#DCE2EB', fontSize: 13, fontWeight: '800' },
  portfolioValue: { color: '#F5F7FB', fontSize: 13, fontWeight: '900' },
  miniTrack: { height: 4, backgroundColor: '#202936', borderRadius: 99, marginTop: 8, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#526174', borderRadius: 99 },
  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallStat: { width: '48.5%', backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1A2230', borderRadius: 18, padding: 14 },
  smallStatIcon: { color: '#7CFFB2', fontSize: 18, fontWeight: '900' },
  smallStatLabel: { color: '#6E7A8C', fontSize: 10, fontWeight: '900', marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
  smallStatValue: { color: '#F5F7FB', fontSize: 16, fontWeight: '900', marginTop: 4 },
  taxCard: { borderColor: '#4A2E31', backgroundColor: '#1A1215' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickAction: { width: '48.5%', minHeight: 116, borderRadius: 19, padding: 14, backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1A2230' },
  quickIcon: { color: '#7CFFB2', fontSize: 19, fontWeight: '900' },
  quickTitle: { color: '#EFF3F8', fontSize: 15, fontWeight: '900', marginTop: 14 },
  quickBody: { color: '#748094', fontSize: 11, marginTop: 3 },

  segmented: { flexDirection: 'row', padding: 4, borderRadius: 16, backgroundColor: '#0E131A', borderWidth: 1, borderColor: '#19212C' },
  segment: { flex: 1, minHeight: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: '#202A36' },
  segmentText: { color: '#697689', fontSize: 12, fontWeight: '900' },
  segmentTextActive: { color: '#F5F7FB' },
  marketSummary: { backgroundColor: '#111A19', borderColor: '#1E3930' },
  summaryMoney: { color: '#F5F7FB', fontSize: 34, fontWeight: '1000', letterSpacing: -1.1, marginTop: 5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderColor: '#21332D' },
  summaryTiny: { color: '#697789', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  summaryMini: { color: '#E8EDF4', fontSize: 12, fontWeight: '900', marginTop: 4 },
  marketCard: { padding: 15 },
  marketTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  marketIdentity: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 11 },
  marketIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#1A2330', alignItems: 'center', justifyContent: 'center' },
  marketIconText: { color: '#DCE4EE', fontWeight: '1000', fontSize: 17 },
  marketSymbol: { color: '#F5F7FB', fontWeight: '1000', fontSize: 16 },
  marketName: { color: '#718095', fontSize: 11, marginTop: 2 },
  marketPriceWrap: { alignItems: 'flex-end' },
  marketPrice: { color: '#F5F7FB', fontWeight: '1000', fontSize: 16 },
  change: { fontSize: 11, fontWeight: '900', marginTop: 3 },
  fakeChart: { height: 58, flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginTop: 17, paddingHorizontal: 2 },
  chartBar: { flex: 1, minHeight: 4, backgroundColor: '#273B35', borderRadius: 99 },
  holdingStrip: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1B2330', paddingVertical: 12, marginTop: 14 },
  holdingLabel: { color: '#637084', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  holdingValue: { color: '#E8EDF4', fontSize: 12, fontWeight: '900', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 9, marginTop: 13 },

  businessSummary: { backgroundColor: '#151918' },
  summaryBadge: { backgroundColor: '#11271C', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7 },
  summaryBadgeText: { color: '#7CFFB2', fontSize: 11, fontWeight: '900' },
  lockedCard: { opacity: 0.55 },
  companyTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  companyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#1A212B', alignItems: 'center', justifyContent: 'center' },
  companyEmoji: { fontSize: 24 },
  companyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  companyName: { color: '#F0F4F9', fontSize: 16, fontWeight: '900' },
  industryChip: { color: '#8491A4', backgroundColor: '#1A222D', borderRadius: 99, overflow: 'hidden', paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '800' },
  companyMeta: { color: '#748195', fontSize: 11, marginTop: 4 },
  businessNumbers: { flexDirection: 'row', gap: 12, borderTopWidth: 1, borderColor: '#1C2430', marginTop: 14, paddingTop: 13 },

  assetSummaryRow: { flexDirection: 'row', gap: 10 },
  assetSummaryCard: { flex: 1, borderRadius: 19, padding: 15, backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1A2230' },
  assetSummaryValue: { color: '#F2F5F9', fontSize: 19, fontWeight: '1000', marginTop: 7 },
  assetSummarySub: { color: '#748195', fontSize: 10, marginTop: 4 },
  assetCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetEmojiWrap: { width: 50, height: 50, borderRadius: 17, backgroundColor: '#1A212B', alignItems: 'center', justifyContent: 'center' },
  assetEmoji: { fontSize: 25 },
  assetFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderColor: '#1C2430' },
  countBubble: { minWidth: 34, height: 34, paddingHorizontal: 8, borderRadius: 12, backgroundColor: '#1A2D24', alignItems: 'center', justifyContent: 'center' },
  countBubbleText: { color: '#7CFFB2', fontWeight: '900', fontSize: 11 },
  lifestyleCard: { minHeight: 82, justifyContent: 'center' },
  ownedBadge: { backgroundColor: '#15281E', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  ownedBadgeText: { color: '#7CFFB2', fontSize: 9, fontWeight: '1000', letterSpacing: 0.8 },

  tapMachine: { height: 250, borderRadius: 30, backgroundColor: '#15251D', borderWidth: 1, borderColor: '#2A5840', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginVertical: 3 },
  tapMachinePressed: { transform: [{ scale: 0.985 }], backgroundColor: '#1A3024' },
  tapGlow: { position: 'absolute', width: 210, height: 210, borderRadius: 999, backgroundColor: '#1C3D2B', opacity: 0.65 },
  tapKicker: { color: '#8BB29B', fontSize: 11, fontWeight: '900', letterSpacing: 2.1 },
  tapMoney: { color: '#EFFFF4', fontSize: 57, fontWeight: '1000', letterSpacing: -2.4, marginTop: 9 },
  tapHint: { color: '#6E8878', fontSize: 11, fontWeight: '700', marginTop: 9 },
  jobCard: { padding: 14 },
  jobCardActive: { borderColor: '#2D6848', backgroundColor: '#121D17' },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  jobIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: '#1A212B', alignItems: 'center', justifyContent: 'center' },
  jobEmoji: { fontSize: 21 },

  nav: { minHeight: 76, flexDirection: 'row', paddingHorizontal: 8, paddingTop: 7, paddingBottom: 8, backgroundColor: '#090D13', borderTopWidth: 1, borderColor: '#161D27' },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  navIconWrap: { width: 34, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: '#17231D' },
  navIcon: { color: '#596679', fontSize: 17, fontWeight: '900' },
  navIconActive: { color: '#7CFFB2' },
  navText: { color: '#596679', fontSize: 9, fontWeight: '800' },
  navTextActive: { color: '#DCE8E0' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,.72)', alignItems: 'center', justifyContent: 'center', padding: 25 },
  modalCard: { width: '100%', maxWidth: 430, borderRadius: 28, backgroundColor: '#111821', borderWidth: 1, borderColor: '#263241', padding: 23 },
  modalIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: '#173022', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  modalIconText: { color: '#7CFFB2', fontSize: 25, fontWeight: '1000' },
  modalKicker: { color: '#7CFFB2', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  modalMoney: { color: '#F5F9F7', fontSize: 43, fontWeight: '1000', letterSpacing: -1.6, marginTop: 7 },
  modalCopy: { color: '#8490A2', fontSize: 13, lineHeight: 19, marginTop: 7, marginBottom: 20 },
});
