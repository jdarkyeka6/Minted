import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '../src/GameContext';

const C = {
  bg: '#F7F8FA',
  card: '#EEF2F5',
  cardStrong: '#E7ECF0',
  text: '#171A1D',
  muted: '#7A828A',
  faint: '#AEB6BE',
  line: '#E1E5E9',
  mint: '#24B58A',
  mintSoft: '#DFF6EE',
  blue: '#3B82F6',
  blueSoft: '#E7F0FF',
  red: '#E95656',
  redSoft: '#FCE8E8',
  gold: '#D9A928',
  white: '#FFFFFF',
};

const NAV = [
  ['Investing', '↗'],
  ['Business', '▥'],
  ['Earnings', '$'],
  ['Items', '◇'],
  ['Profile', '●'],
];

const COLLECTIONS = [
  { id: 'style', title: 'Style', icon: '⌚', assetIds: ['sneakers', 'watch', 'jewels', 'rareCoin'] },
  { id: 'cars', title: 'Garage', icon: '◉', assetIds: ['classicCar', 'sportsCar', 'supercar', 'prototypeCar'] },
  { id: 'yachts', title: 'Harbor', icon: '≈', assetIds: ['speedboat', 'yacht', 'megayacht'] },
  { id: 'aircraft', title: 'Hangar', icon: '✈', assetIds: ['propPlane', 'jet', 'airliner'] },
  { id: 'collectibles', title: 'Collectibles', icon: '★', assetIds: ['painting', 'signature', 'meteorite', 'crown'] },
  { id: 'islands', title: 'Islands', icon: '⌁', assetIds: ['tinyIsland', 'island', 'islandEstate'] },
];

const RICH_LIST = [
  { name: 'Avery Vale', industry: 'Technology', fortune: 42000000000000 },
  { name: 'Mika Stone', industry: 'Energy', fortune: 17800000000000 },
  { name: 'Theo Mercer', industry: 'Finance', fortune: 6400000000000 },
  { name: 'Nora Chen', industry: 'Retail', fortune: 2100000000000 },
  { name: 'Rafi Cole', industry: 'Aviation', fortune: 780000000000 },
  { name: 'Elena North', industry: 'Property', fortune: 260000000000 },
  { name: 'Miles Arden', industry: 'Technology', fortune: 88000000000 },
  { name: 'Sofia Venn', industry: 'Hospitality', fortune: 24000000000 },
];

const compactMoney = (value, decimals = 1) => {
  const n = Number(value || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const f = (divisor, suffix) => sign + '$' + (abs / divisor).toFixed(decimals) + suffix;
  if (abs >= 1e15) return f(1e15, 'Q');
  if (abs >= 1e12) return f(1e12, 'T');
  if (abs >= 1e9) return f(1e9, 'B');
  if (abs >= 1e6) return f(1e6, 'M');
  if (abs >= 1e3) return f(1e3, 'K');
  return sign + '$' + abs.toFixed(abs < 100 ? 2 : 0);
};

const fullMoney = (value) => {
  const n = Number(value || 0);
  return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const pct = (value) => {
  const n = Number(value || 0);
  return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
};

function tapHaptic() {
  Haptics.selectionAsync().catch(() => {});
}

function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={() => { tapHaptic(); onPress(); }} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

function Button({ label, onPress, disabled, secondary, small, danger }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => { tapHaptic(); onPress && onPress(); }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        danger && styles.buttonDanger,
        small && styles.buttonSmall,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[
        styles.buttonText,
        secondary && styles.buttonTextSecondary,
        danger && styles.buttonTextDanger,
        disabled && styles.buttonTextDisabled,
      ]}>{label}</Text>
    </Pressable>
  );
}

function Header({ title, subtitle, right }) {
  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.headerSubtitle}>{subtitle}</Text>}
      </View>
      {right}
    </View>
  );
}

function SectionTitle({ title, subtitle, action, onAction }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      </View>
      {!!action && (
        <Pressable onPress={() => { tapHaptic(); onAction && onAction(); }}>
          <Text style={styles.sectionAction}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

function Tabs({ values, value, onChange }) {
  return (
    <View style={styles.tabs}>
      {values.map((item) => (
        <Pressable key={item} onPress={() => { tapHaptic(); onChange(item); }} style={styles.tab}>
          <Text style={[styles.tabText, value === item && styles.tabTextActive]}>{item}</Text>
          <View style={[styles.tabLine, value === item && styles.tabLineActive]} />
        </Pressable>
      ))}
    </View>
  );
}

function IconBubble({ children, tone = 'mint', size = 52 }) {
  const backgroundColor = tone === 'blue' ? C.blueSoft : tone === 'gold' ? '#FFF5D8' : tone === 'red' ? C.redSoft : C.mintSoft;
  const color = tone === 'blue' ? C.blue : tone === 'gold' ? C.gold : tone === 'red' ? C.red : C.mint;
  return (
    <View style={[styles.iconBubble, { width: size, height: size, borderRadius: size / 2, backgroundColor }]}>
      <Text style={[styles.iconBubbleText, { color, fontSize: Math.max(18, size * 0.38) }]}>{children}</Text>
    </View>
  );
}

function Loading() {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.loading}>
        <View style={styles.loadingMark}><Text style={styles.loadingMarkText}>M</Text></View>
        <Text style={styles.loadingTitle}>MINTED</Text>
        <Text style={styles.loadingText}>Building your empire…</Text>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const game = useGame();
  const [tab, setTab] = useState('Earnings');
  const [offlineOpen, setOfflineOpen] = useState(true);

  if (!game.loaded) return <Loading />;

  const closeOffline = () => {
    setOfflineOpen(false);
    game.clearOfflineEarnings();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.screen}>
        {tab === 'Investing' && <Investing game={game} />}
        {tab === 'Business' && <Business game={game} />}
        {tab === 'Earnings' && <Earnings game={game} />}
        {tab === 'Items' && <Items game={game} />}
        {tab === 'Profile' && <Profile game={game} />}
      </View>

      <View style={styles.nav}>
        {NAV.map(([name, icon]) => {
          const active = tab === name;
          return (
            <Pressable key={name} onPress={() => { tapHaptic(); setTab(name); }} style={styles.navItem}>
              <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
              </View>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal transparent visible={offlineOpen && game.offlineEarnings > 0} animationType="fade" onRequestClose={closeOffline}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <IconBubble size={58}>↗</IconBubble>
            <Text style={styles.modalEyebrow}>WELCOME BACK</Text>
            <Text style={styles.modalTitle}>Your empire kept moving.</Text>
            <Text style={styles.modalMoney}>+{compactMoney(game.offlineEarnings, 2)}</Text>
            <Text style={styles.modalCopy}>Passive income earned while you were away is ready to collect.</Text>
            <Button label="Collect earnings" onPress={closeOffline} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Earnings({ game }) {
  const [flash, setFlash] = useState(false);

  const earn = () => {
    game.tap();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setFlash(true);
    setTimeout(() => setFlash(false), 90);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Header title="Earnings" subtitle="Tap now. Build passive income next." />

      <View style={styles.balanceHero}>
        <Text style={styles.heroLabel}>Balance</Text>
        <Text adjustsFontSizeToFit numberOfLines={1} style={styles.heroBalance}>{fullMoney(game.balance)}</Text>
        <View style={styles.heroDivider} />
        <View style={styles.heroBottom}>
          <View>
            <Text style={styles.heroMiniLabel}>Passive income</Text>
            <Text style={styles.heroMiniValue}>+{compactMoney(game.passivePerSec, 2)} / sec</Text>
          </View>
          <View style={styles.netWorthPill}>
            <Text style={styles.netWorthPillLabel}>NET WORTH</Text>
            <Text style={styles.netWorthPillValue}>{compactMoney(game.netWorth, 2)}</Text>
          </View>
        </View>
      </View>

      <Card style={styles.tapValueCard}>
        <View>
          <Text style={styles.tapValue}>{compactMoney(game.clickValue, 2)}</Text>
          <Text style={styles.muted}>per tap</Text>
        </View>
        {!game.maxClick && (
          <Button
            small
            secondary
            label={'Upgrade · ' + compactMoney(game.clickUpgradeCost, 1)}
            onPress={game.buyClickUpgrade}
            disabled={!game.canBuyClick}
          />
        )}
      </Card>

      <Pressable onPress={earn} style={({ pressed }) => [styles.tapZone, pressed && styles.tapZonePressed]}>
        <View style={[styles.tapCircle, flash && styles.tapCircleFlash]}>
          <Text style={styles.tapIcon}>$</Text>
        </View>
        <Text style={styles.tapTitle}>Tap anywhere here to earn</Text>
        <Text style={styles.tapSubtitle}>Every tap adds {compactMoney(game.clickValue, 2)} to your balance.</Text>
      </Pressable>

      <SectionTitle title="Career income" subtitle="A small base while your empire grows." />
      {game.jobs.map((job) => {
        const active = game.activeJobId === job.id;
        const unlocked = game.netWorth >= job.unlockNetWorth;
        return (
          <Card key={job.id} style={active && styles.activeCard}>
            <View style={styles.row}>
              <IconBubble tone={active ? 'mint' : 'blue'}>{job.icon}</IconBubble>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{job.name}</Text>
                <Text style={styles.cardSub}>+{compactMoney(job.incomePerSec, 2)} / sec</Text>
              </View>
              <Button
                small
                secondary={!active}
                label={active ? 'Active' : unlocked ? 'Choose' : compactMoney(job.unlockNetWorth)}
                onPress={() => game.takeJob(job.id)}
                disabled={!unlocked || active}
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Investing({ game }) {
  const [segment, setSegment] = useState('Shares');
  const [selectedMarket, setSelectedMarket] = useState(null);

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Header title="Investing" subtitle="Grow money outside your businesses." />
        <Tabs values={['Shares', 'Real Estate', 'Crypto']} value={segment} onChange={setSegment} />

        {segment === 'Shares' && (
          <MarketSection
            title="Stock portfolio"
            value={game.stockValue}
            items={game.stocks}
            quantityKey="shares"
            onOpen={(item) => setSelectedMarket({ type: 'stock', item })}
          />
        )}

        {segment === 'Crypto' && (
          <MarketSection
            title="Crypto portfolio"
            value={game.cryptoValue}
            items={game.crypto}
            quantityKey="units"
            onOpen={(item) => setSelectedMarket({ type: 'crypto', item })}
          />
        )}

        {segment === 'Real Estate' && <RealEstate game={game} />}
      </ScrollView>

      <MarketModal
        selection={selectedMarket}
        game={game}
        onClose={() => setSelectedMarket(null)}
      />
    </>
  );
}

function MarketSection({ title, value, items, quantityKey, onOpen }) {
  const [filter, setFilter] = useState('All');
  const sorted = useMemo(() => {
    const copy = [...items];
    if (filter === 'Gainers') return copy.filter((item) => item.changePct >= 0).sort((a, b) => b.changePct - a.changePct);
    if (filter === 'Losers') return copy.filter((item) => item.changePct < 0).sort((a, b) => a.changePct - b.changePct);
    if (filter === 'Owned') return copy.filter((item) => (item[quantityKey] || 0) > 0).sort((a, b) => (b[quantityKey] || 0) * b.price - (a[quantityKey] || 0) * a.price);
    return copy;
  }, [items, filter, quantityKey]);

  const gainers = [...items].sort((a, b) => b.changePct - a.changePct);

  return (
    <>
      <Card style={styles.portfolioHero}>
        <Text style={styles.heroLabel}>{title}</Text>
        <Text style={styles.portfolioHeroValue}>{compactMoney(value, 2)}</Text>
        <Text style={styles.portfolioHeroSub}>Live simulated market value</Text>
      </Card>

      <View style={styles.marketFilters}>
        {['All', 'Gainers', 'Losers', 'Owned'].map((item) => (
          <Pressable
            key={item}
            onPress={() => { tapHaptic(); setFilter(item); }}
            style={[styles.marketFilterPill, filter === item && styles.marketFilterPillActive]}
          >
            <Text style={[styles.marketFilterText, filter === item && styles.marketFilterTextActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      <SectionTitle title="Market" subtitle={filter === 'All' ? 'Tap an asset to trade.' : filter + ' · ' + sorted.length + ' assets'} />
      {sorted.length ? sorted.map((item) => {
        const positive = item.changePct >= 0;
        const qty = item[quantityKey] || 0;
        return (
          <Card key={item.id} onPress={() => onOpen(item)}>
            <View style={styles.marketRow}>
              <IconBubble tone={positive ? 'mint' : 'red'}>{item.icon}</IconBubble>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>{qty > 0 ? qty + ' owned' : item.symbol}</Text>
              </View>
              <View style={styles.alignRight}>
                <Text style={styles.marketPrice}>{compactMoney(item.price, 2)}</Text>
                <Text style={[styles.marketChange, positive ? styles.positive : styles.negative]}>
                  {positive ? '▲ ' : '▼ '}{Math.abs(item.changePct).toFixed(2)}%
                </Text>
              </View>
            </View>
          </Card>
        );
      }) : (
        <Card><Text style={styles.emptyFilterText}>Nothing in this filter yet.</Text></Card>
      )}

      <SectionTitle title="Watchlist" subtitle="Fastest movers right now." />
      <View style={styles.twoCol}>
        {gainers.slice(0, 2).map((item) => (
          <Card key={item.id} style={styles.halfCard} onPress={() => onOpen(item)}>
            <Text style={styles.miniEyebrow}>{item.symbol}</Text>
            <Text style={styles.halfValue}>{compactMoney(item.price, 2)}</Text>
            <Text style={[styles.marketChange, item.changePct >= 0 ? styles.positive : styles.negative]}>{pct(item.changePct)}</Text>
          </Card>
        ))}
      </View>
    </>
  );
}

function MarketModal({ selection, game, onClose }) {
  const [amount, setAmount] = useState(1);
  if (!selection) return null;

  const item = selection.type === 'stock'
    ? game.stocks.find((x) => x.id === selection.item.id)
    : game.crypto.find((x) => x.id === selection.item.id);

  if (!item) return null;

  const qtyKey = selection.type === 'stock' ? 'shares' : 'units';
  const owned = item[qtyKey] || 0;
  const total = item.price * amount;
  const positive = item.changePct >= 0;

  const buy = () => {
    if (selection.type === 'stock') game.buyStock(item.id, amount);
    else game.buyCrypto(item.id, amount);
  };
  const sell = () => {
    if (selection.type === 'stock') game.sellStock(item.id, amount);
    else game.sellCrypto(item.id, amount);
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdropBottom}>
        <View style={styles.tradeSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.row}>
            <IconBubble size={64} tone={positive ? 'mint' : 'red'}>{item.icon}</IconBubble>
            <View style={styles.flex}>
              <Text style={styles.tradeName}>{item.name}</Text>
              <Text style={styles.tradeSymbol}>{item.symbol}</Text>
            </View>
            <Pressable onPress={onClose}><Text style={styles.closeButton}>×</Text></Pressable>
          </View>

          <Text style={styles.tradePrice}>{compactMoney(item.price, 2)}</Text>
          <Text style={[styles.marketChange, positive ? styles.positive : styles.negative]}>{pct(item.changePct)}</Text>

          <View style={styles.fakeChart}>
            {[34, 48, 42, 57, 51, 68, 62, 74, 65, 82, 76, positive ? 88 : 58].map((h, i) => (
              <View key={i} style={[styles.fakeChartBar, { height: h + '%' }]} />
            ))}
          </View>

          <View style={styles.tradeStats}>
            <Stat label="YOU OWN" value={owned.toLocaleString()} />
            <Stat label="POSITION" value={compactMoney(owned * item.price, 2)} />
            <Stat label="BALANCE" value={compactMoney(game.balance, 2)} />
          </View>

          <Text style={styles.sheetLabel}>Trade quantity</Text>
          <View style={styles.quickAmounts}>
            {[1, 10, 100].map((n) => (
              <Pressable key={n} onPress={() => { tapHaptic(); setAmount(n); }} style={[styles.amountPill, amount === n && styles.amountPillActive]}>
                <Text style={[styles.amountPillText, amount === n && styles.amountPillTextActive]}>{n}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => {
                tapHaptic();
                setAmount(Math.max(1, Math.floor(game.balance / Math.max(0.01, item.price))));
              }}
              style={styles.amountPill}
            >
              <Text style={styles.amountPillText}>MAX</Text>
            </Pressable>
          </View>

          <Text style={styles.tradeSummary}>{amount.toLocaleString()} × {compactMoney(item.price, 2)} = {compactMoney(total, 2)}</Text>

          <View style={styles.actionRow}>
            <Button label="Buy" onPress={buy} disabled={game.balance < total} />
            <Button label="Sell" secondary onPress={sell} disabled={owned < amount} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function RealEstate({ game }) {
  const rent = game.propertyIncomePerSec;
  return (
    <>
      <Card style={styles.portfolioHero}>
        <Text style={styles.heroLabel}>Rental income per second</Text>
        <Text style={styles.portfolioHeroValue}>+{compactMoney(rent, 2)}</Text>
        <Text style={styles.portfolioHeroSub}>{compactMoney(game.propertyValue, 2)} property value</Text>
      </Card>

      <SectionTitle title="My property" subtitle={game.properties.length ? 'Your owned real estate.' : 'No property yet.'} />
      {game.properties.map((property) => (
        <Card key={property.id}>
          <View style={styles.row}>
            <IconBubble tone="gold">{property.icon}</IconBubble>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{property.name}</Text>
              <Text style={styles.cardSub}>{property.location} · {property.count} owned</Text>
            </View>
            <View style={styles.alignRight}>
              <Text style={styles.cardValue}>{compactMoney(property.value, 2)}</Text>
              <Text style={styles.positive}>+{compactMoney(property.rentPerSec * property.count, 2)}/s</Text>
            </View>
          </View>
        </Card>
      ))}

      <SectionTitle title="Real estate market" subtitle="Buy properties and collect rent." />
      {game.propertyCatalog.map((property) => (
        <Card key={property.id} style={!property.unlocked && styles.lockedCard}>
          <View style={styles.row}>
            <IconBubble tone="blue">{property.icon}</IconBubble>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{property.name}</Text>
              <Text style={styles.cardSub}>{property.location} · +{compactMoney(property.rentPerSec, 2)}/s</Text>
            </View>
            <Button
              small
              label={property.unlocked ? compactMoney(property.cost, 1) : 'Locked'}
              onPress={() => game.buyProperty(property.id)}
              disabled={!property.unlocked || game.balance < property.cost}
            />
          </View>
        </Card>
      ))}
    </>
  );
}

function Business({ game }) {
  const [startOpen, setStartOpen] = useState(false);
  const [dealsOpen, setDealsOpen] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState(null);

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Header
          title="Business"
          subtitle="Build companies that earn while you are away."
          right={<View style={styles.slotPill}><Text style={styles.slotPillText}>{game.businesses.length} owned</Text></View>}
        />

        <Card style={styles.businessSummary}>
          <Text style={styles.heroLabel}>Total income per second</Text>
          <Text style={styles.businessIncome}>+{compactMoney(game.businessIncomePerSec, 2)}</Text>
          <View style={styles.summaryLine} />
          <View style={styles.rowBetween}>
            <Text style={styles.cardSub}>Business value</Text>
            <Text style={styles.cardValue}>{compactMoney(game.businessValue, 2)}</Text>
          </View>
        </Card>

        <View style={styles.actionRow}>
          <Button label="Start a business" onPress={() => setStartOpen(true)} />
          <Button label="M&A" secondary onPress={() => setDealsOpen(true)} />
        </View>

        <SectionTitle title="My companies" subtitle={game.businesses.length ? 'Open a company to manage it.' : 'Start your first company.'} />
        {game.businesses.map((business) => {
          const details = game.getBusinessDetails(business.id);
          return (
            <Card key={business.id}>
              <View style={styles.businessCardTop}>
                <IconBubble tone="blue">{business.icon}</IconBubble>
                <View style={styles.flex}>
                  <Text style={styles.cardTitle}>{business.name}</Text>
                  <Text style={styles.cardSub}>{business.industry}</Text>
                </View>
                <Pressable onPress={() => { tapHaptic(); setSelectedBusinessId(business.id); }} style={styles.chevronButton}>
                  <Text style={styles.chevron}>›</Text>
                </Pressable>
              </View>

              <View style={styles.miniStatsRow}>
                <Text style={styles.miniStat}>▥ {business.units} location{business.units === 1 ? '' : 's'}</Text>
                <Text style={styles.miniStat}>↑ Lv {business.level}</Text>
                <Text style={styles.miniStat}>★ {Math.round(details?.reputation || 0)}</Text>
              </View>

              <Text style={styles.businessCardIncome}>{compactMoney(business.incomePerSec, 2)} <Text style={styles.businessCardSuffix}>per sec</Text></Text>
            </Card>
          );
        })}
      </ScrollView>

      <StartBusinessModal open={startOpen} game={game} onClose={() => setStartOpen(false)} />
      <MergersModal open={dealsOpen} game={game} onClose={() => setDealsOpen(false)} />
      <BusinessDetailModal
        businessId={selectedBusinessId}
        game={game}
        onClose={() => setSelectedBusinessId(null)}
      />
    </>
  );
}

function MergersModal({ open, game, onClose }) {
  const [mode, setMode] = useState('Acquire');
  if (!open) return null;

  const targets = game.acquisitionTargets.filter((target) => !target.acquired);
  const completedDeals = game.acquisitionHistory.length;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.modalPage}>
          <View style={styles.modalPageTop}>
            <Pressable onPress={onClose}><Text style={styles.backText}>‹</Text></Pressable>
            <View style={styles.flex}>
              <Text style={styles.modalPageTitle}>Mergers & acquisitions</Text>
              <Text style={styles.modalPageSub}>{completedDeals} acquisition{completedDeals === 1 ? '' : 's'} · {game.mergerCount} merger{game.mergerCount === 1 ? '' : 's'}</Text>
            </View>
          </View>

          <Card style={styles.dealHero}>
            <Text style={styles.dealHeroKicker}>DEAL DESK</Text>
            <Text style={styles.dealHeroMoney}>{compactMoney(game.balance, 2)}</Text>
            <Text style={styles.dealHeroSub}>cash available for acquisitions</Text>
            <View style={styles.dealHeroStats}>
              <View>
                <Text style={styles.dealHeroStatLabel}>TARGETS</Text>
                <Text style={styles.dealHeroStatValue}>{targets.length}</Text>
              </View>
              <View>
                <Text style={styles.dealHeroStatLabel}>MERGE READY</Text>
                <Text style={styles.dealHeroStatValue}>{game.mergerGroups.length}</Text>
              </View>
              <View>
                <Text style={styles.dealHeroStatLabel}>DEALS DONE</Text>
                <Text style={styles.dealHeroStatValue}>{completedDeals + game.mergerCount}</Text>
              </View>
            </View>
          </Card>

          <View style={styles.dealTabs}>
            {['Acquire', 'Merge'].map((item) => (
              <Pressable
                key={item}
                onPress={() => { tapHaptic(); setMode(item); }}
                style={[styles.dealTab, mode === item && styles.dealTabActive]}
              >
                <Text style={[styles.dealTabText, mode === item && styles.dealTabTextActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {mode === 'Acquire' ? (
            <>
              <SectionTitle title="Acquisition targets" subtitle="Buy established companies instead of starting from zero." />
              {targets.map((target) => {
                const canAfford = game.balance >= target.value;
                const unlockWorth = target.value * 0.12;
                return (
                  <Card key={target.id} style={!target.unlocked && styles.lockedCard}>
                    <View style={styles.dealTargetTop}>
                      <IconBubble tone={target.unlocked ? 'blue' : 'gold'} size={58}>{target.icon}</IconBubble>
                      <View style={styles.flex}>
                        <Text style={styles.cardTitle}>{target.name}</Text>
                        <Text style={styles.cardSub}>{target.industry} · {target.region}</Text>
                      </View>
                      <View style={styles.alignRight}>
                        <Text style={styles.dealTargetValue}>{compactMoney(target.value, 1)}</Text>
                        <Text style={styles.cardSub}>valuation</Text>
                      </View>
                    </View>

                    <View style={styles.dealMetricRow}>
                      <View style={styles.dealMetric}>
                        <Text style={styles.dealMetricLabel}>PROFIT</Text>
                        <Text style={styles.dealMetricValue}>+{compactMoney(target.projectedIncome, 2)}/s</Text>
                      </View>
                      <View style={styles.dealMetric}>
                        <Text style={styles.dealMetricLabel}>GROWTH</Text>
                        <Text style={styles.dealMetricValue}>+{target.growth}%</Text>
                      </View>
                      <View style={styles.dealMetric}>
                        <Text style={styles.dealMetricLabel}>SYNERGY</Text>
                        <Text style={[styles.dealMetricValue, target.synergyPct > 0 && styles.positive]}>
                          +{Math.round(target.synergyPct * 100)}%
                        </Text>
                      </View>
                    </View>

                    <View style={styles.dealDetailLine}>
                      <Text style={styles.dealDetailText}>{target.units} locations</Text>
                      <Text style={styles.dealDetailText}>{target.employees.toLocaleString()} employees</Text>
                      <Text style={styles.dealDetailText}>★ {target.reputation}</Text>
                    </View>

                    <Button
                      label={
                        !target.unlocked
                          ? 'Unlock at ' + compactMoney(unlockWorth, 1) + ' net worth'
                          : canAfford
                            ? 'Acquire for ' + compactMoney(target.value, 1)
                            : 'Need ' + compactMoney(target.value - game.balance, 1) + ' more'
                      }
                      onPress={() => game.acquireTarget(target.id)}
                      disabled={!target.unlocked || !canAfford}
                    />
                  </Card>
                );
              })}

              {!targets.length && (
                <Card style={styles.dealEmptyCard}>
                  <Text style={styles.dealEmptyIcon}>✓</Text>
                  <Text style={styles.dealEmptyTitle}>Market cleared.</Text>
                  <Text style={styles.dealEmptyCopy}>You acquired every company currently on the board.</Text>
                </Card>
              )}

              {game.acquisitionHistory.length > 0 && (
                <>
                  <SectionTitle title="Deal history" subtitle="Your latest takeovers." />
                  <Card style={styles.dealHistoryCard}>
                    {game.acquisitionHistory.slice(0, 5).map((deal, index) => (
                      <View key={deal.id} style={[styles.dealHistoryRow, index === Math.min(4, game.acquisitionHistory.length - 1) && styles.noBorder]}>
                        <View style={styles.flex}>
                          <Text style={styles.dealHistoryName}>{deal.name}</Text>
                          <Text style={styles.cardSub}>+{Math.round((deal.synergyPct || 0) * 100)}% synergy</Text>
                        </View>
                        <Text style={styles.dealHistoryPrice}>{compactMoney(deal.price, 1)}</Text>
                      </View>
                    ))}
                  </Card>
                </>
              )}
            </>
          ) : (
            <>
              <SectionTitle title="Consolidate companies" subtitle="Merge two companies in the same industry and gain a permanent 12% income synergy." />
              {game.mergerGroups.map((group) => {
                const first = group.companies[0];
                const second = group.companies[1];
                const currentIncome = first.incomePerSec + second.incomePerSec;
                const mergedIncome = currentIncome * 1.12;
                return (
                  <Card key={group.typeId}>
                    <View style={styles.dealTargetTop}>
                      <IconBubble tone="mint" size={58}>{group.icon}</IconBubble>
                      <View style={styles.flex}>
                        <Text style={styles.cardTitle}>{group.industry} merger</Text>
                        <Text style={styles.cardSub}>{first.name} + {second.name}</Text>
                      </View>
                      <Text style={styles.mergeCountBadge}>{group.companies.length}</Text>
                    </View>

                    <View style={styles.mergerFlow}>
                      <View style={styles.mergerCompany}>
                        <Text style={styles.mergerCompanyName}>{first.name}</Text>
                        <Text style={styles.cardSub}>{compactMoney(first.incomePerSec, 2)}/s</Text>
                      </View>
                      <Text style={styles.mergerPlus}>＋</Text>
                      <View style={styles.mergerCompany}>
                        <Text style={styles.mergerCompanyName}>{second.name}</Text>
                        <Text style={styles.cardSub}>{compactMoney(second.incomePerSec, 2)}/s</Text>
                      </View>
                    </View>

                    <View style={styles.mergerResult}>
                      <Text style={styles.mergerResultLabel}>POST-MERGER PROFIT</Text>
                      <Text style={styles.mergerResultValue}>+{compactMoney(mergedIncome, 2)}/s</Text>
                      <Text style={styles.positive}>+{compactMoney(mergedIncome - currentIncome, 2)}/s synergy</Text>
                    </View>

                    <Button label="Merge companies" onPress={() => game.mergeBusinesses(group.typeId)} />
                  </Card>
                );
              })}

              {!game.mergerGroups.length && (
                <Card style={styles.dealEmptyCard}>
                  <Text style={styles.dealEmptyIcon}>⇄</Text>
                  <Text style={styles.dealEmptyTitle}>Nothing to merge yet.</Text>
                  <Text style={styles.dealEmptyCopy}>Own at least two companies of the same type and they will appear here.</Text>
                </Card>
              )}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function BusinessDetailModal({ businessId, game, onClose }) {
  if (!businessId) return null;
  const business = game.businesses.find((item) => item.id === businessId);
  if (!business) return null;
  const details = game.getBusinessDetails(business.id);

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.modalPage}>
          <View style={styles.modalPageTop}>
            <Pressable onPress={onClose}><Text style={styles.backText}>‹</Text></Pressable>
            <View style={styles.flex}>
              <Text style={styles.modalPageTitle}>{business.name}</Text>
              <Text style={styles.modalPageSub}>{business.industry}</Text>
            </View>
          </View>

          <View style={styles.companyHero}>
            <IconBubble tone="blue" size={78}>{business.icon}</IconBubble>
            <Text style={styles.companyHeroIncome}>+{compactMoney(business.incomePerSec, 2)}/s</Text>
            <Text style={styles.companyHeroLabel}>current company profit</Text>
          </View>

          <View style={styles.companyStatGrid}>
            <Stat label="REVENUE / SEC" value={compactMoney(details?.revenuePerSec || 0, 2)} />
            <Stat label="EXPENSES / SEC" value={compactMoney(details?.expensesPerSec || 0, 2)} />
            <Stat label="EMPLOYEES" value={(details?.employees || 0).toLocaleString()} />
            <Stat label="REPUTATION" value={Math.round(details?.reputation || 0) + '/100'} />
            <Stat label="LOCATIONS" value={business.units.toLocaleString()} />
            <Stat label="LEVEL" value={business.level.toLocaleString()} />
          </View>

          <SectionTitle title="Grow the company" subtitle="Each path improves a different part of the machine." />

          <Card>
            <View style={styles.row}>
              <IconBubble tone="mint">＋</IconBubble>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Expand locations</Text>
                <Text style={styles.cardSub}>Add another location and increase output.</Text>
              </View>
              <Button
                small
                label={compactMoney(business.unitCost, 1)}
                onPress={() => game.expandBusiness(business.id)}
                disabled={game.balance < business.unitCost}
              />
            </View>
          </Card>

          <Card>
            <View style={styles.row}>
              <IconBubble tone="blue">↑</IconBubble>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Operations upgrade</Text>
                <Text style={styles.cardSub}>Level {business.level} · improves income by 35%.</Text>
              </View>
              <Button
                small
                label={compactMoney(business.upgradeCost, 1)}
                onPress={() => game.upgradeBusiness(business.id)}
                disabled={game.balance < business.upgradeCost}
              />
            </View>
          </Card>

          <Card>
            <View style={styles.row}>
              <IconBubble tone="gold">★</IconBubble>
              <View style={styles.flex}>
                <Text style={styles.cardTitle}>Management team</Text>
                <Text style={styles.cardSub}>Level {business.managerLevel || 0} · improves income and reputation.</Text>
              </View>
              <Button
                small
                label={compactMoney(business.managerCost, 1)}
                onPress={() => game.hireManager(business.id)}
                disabled={game.balance < business.managerCost}
              />
            </View>
          </Card>

          <SectionTitle title="Company value" />
          <Card style={styles.companyValueCard}>
            <Text style={styles.companyValueNumber}>{compactMoney(business.value, 2)}</Text>
            <Text style={styles.cardSub}>Capital invested into this company.</Text>
          </Card>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function StartBusinessModal({ open, game, onClose }) {
  const [selectedId, setSelectedId] = useState(null);
  const [companyName, setCompanyName] = useState('');

  const selected = game.businessCatalog.find((business) => business.id === selectedId) || null;

  const resetAndClose = () => {
    setSelectedId(null);
    setCompanyName('');
    onClose();
  };

  const choose = (business) => {
    tapHaptic();
    setSelectedId(business.id);
    setCompanyName('');
  };

  const launch = () => {
    if (!selected) return;
    const name = companyName.trim();
    if (name.length < 2 || game.balance < selected.cost) return;
    const created = game.buyBusiness(selected.id, name);
    if (created !== false) resetAndClose();
  };

  return (
    <Modal visible={open} animationType="slide" onRequestClose={resetAndClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.modalPage} keyboardShouldPersistTaps="handled">
          <View style={styles.modalPageTop}>
            <Pressable onPress={() => selected ? setSelectedId(null) : resetAndClose()}>
              <Text style={styles.backText}>‹</Text>
            </Pressable>
            <View style={styles.flex}>
              <Text style={styles.modalPageTitle}>{selected ? 'Name your company' : 'Choose a business'}</Text>
              {selected && <Text style={styles.modalPageSub}>{selected.name} · {selected.industry}</Text>}
            </View>
          </View>

          {!selected ? (
            <>
              <Text style={styles.pageLead}>Pick a category. You can own more than one company in the same industry.</Text>
              <View style={styles.businessGrid}>
                {game.businessCatalog.map((business) => (
                  <Pressable
                    key={business.id}
                    disabled={!business.unlocked}
                    onPress={() => choose(business)}
                    style={({ pressed }) => [
                      styles.businessGridCard,
                      !business.unlocked && styles.lockedCard,
                      pressed && styles.pressed,
                    ]}
                  >
                    <IconBubble tone="blue" size={58}>{business.icon}</IconBubble>
                    <View style={styles.gridBottom}>
                      <Text style={styles.gridTitle}>{business.name}</Text>
                      <Text style={styles.gridSub}>
                        {business.unlocked ? 'From ' + compactMoney(business.cost, 1) : 'Locked'}
                      </Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </>
          ) : (
            <>
              <Card style={styles.businessLaunchCard}>
                <View style={styles.row}>
                  <IconBubble tone="blue" size={62}>{selected.icon}</IconBubble>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{selected.name}</Text>
                    <Text style={styles.cardSub}>{selected.industry}</Text>
                  </View>
                  <Text style={styles.launchCost}>{compactMoney(selected.cost, 1)}</Text>
                </View>
              </Card>

              <Text style={styles.inputLabel}>Company name</Text>
              <TextInput
                value={companyName}
                onChangeText={(value) => setCompanyName(value.slice(0, 28))}
                placeholder="Enter a name"
                placeholderTextColor={C.faint}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
                maxLength={28}
                style={styles.companyInput}
              />

              <View style={styles.companyMetaRow}>
                <View style={styles.companyMetaCard}>
                  <Text style={styles.companyMetaLabel}>STARTING INCOME</Text>
                  <Text style={styles.companyMetaValue}>+{compactMoney(selected.baseIncome, 2)}/s</Text>
                </View>
                <View style={styles.companyMetaCard}>
                  <Text style={styles.companyMetaLabel}>OPENING COST</Text>
                  <Text style={styles.companyMetaValue}>{compactMoney(selected.cost, 1)}</Text>
                </View>
              </View>

              <Text style={styles.nameHint}>
                {companyName.trim().length >= 2
                  ? companyName.trim() + ' will appear in My companies.'
                  : 'Give the company a name to launch it.'}
              </Text>

              <Button
                label={game.balance >= selected.cost ? 'Start company' : 'Need ' + compactMoney(selected.cost - game.balance, 1) + ' more'}
                onPress={launch}
                disabled={companyName.trim().length < 2 || game.balance < selected.cost}
              />
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Items({ game }) {
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [residenceOpen, setResidenceOpen] = useState(false);

  const collectionRows = useMemo(() => COLLECTIONS.map((collection) => {
    const items = game.assetCatalog.filter((asset) => collection.assetIds.includes(asset.id));
    const owned = items.filter((asset) => asset.owned).length;
    return { ...collection, items, owned };
  }), [game.assetCatalog]);

  const nextResidence = game.residenceCatalog.find((item) => item.next);

  return (
    <>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Header title="Items" subtitle="Spend the fortune on things worth owning." />

        <Card style={styles.residenceHomeCard} onPress={() => setResidenceOpen(true)}>
          <View style={styles.residenceHomeTop}>
            <View>
              <Text style={styles.residenceKicker}>MY RESIDENCE</Text>
              <Text style={styles.residenceHomeTitle}>{game.residence ? game.residence.name : 'Build your home base'}</Text>
              <Text style={styles.residenceHomeSub}>
                {game.residence
                  ? compactMoney(game.residenceValue, 2) + ' total value'
                  : nextResidence
                    ? 'Start from ' + compactMoney(nextResidence.cost, 1)
                    : 'Residence progression'}
              </Text>
            </View>
            <Text style={styles.residenceHomeIcon}>{game.residence ? game.residence.icon : '⌂'}</Text>
          </View>

          {game.residence ? (
            <View style={styles.residenceHomeStats}>
              <View>
                <Text style={styles.residenceStatLabel}>SECURITY</Text>
                <Text style={styles.residenceStatValue}>Lv {game.residenceSecurity}</Text>
              </View>
              <View>
                <Text style={styles.residenceStatLabel}>STAFF</Text>
                <Text style={styles.residenceStatValue}>Lv {game.residenceStaff}</Text>
              </View>
              <View>
                <Text style={styles.residenceStatLabel}>IMPROVEMENTS</Text>
                <Text style={styles.residenceStatValue}>{game.residenceImprovements.filter((x) => x.owned).length}</Text>
              </View>
            </View>
          ) : (
            <Text style={styles.residenceOpenText}>Open residence →</Text>
          )}
        </Card>

        <View style={styles.showcaseRow}>
          {collectionRows.slice(1, 4).map((group) => (
            <Card key={group.id} style={styles.showcaseCard} onPress={() => setSelectedCollection(group)}>
              <IconBubble size={50} tone="gold">{group.icon}</IconBubble>
              <Text style={styles.showcaseTitle}>{group.title}</Text>
            </Card>
          ))}
        </View>

        <SectionTitle title="Collections" subtitle="Complete sets, flex later." />
        <View style={styles.collectionGrid}>
          {collectionRows.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => { tapHaptic(); setSelectedCollection(group); }}
              style={({ pressed }) => [styles.collectionCard, pressed && styles.pressed]}
            >
              <IconBubble size={68} tone={group.owned === group.items.length && group.items.length ? 'mint' : 'blue'}>{group.icon}</IconBubble>
              <Text style={styles.collectionTitle}>{group.title}</Text>
              <Text style={styles.collectionCount}>{group.owned} of {group.items.length}</Text>
            </Pressable>
          ))}
        </View>

        <SectionTitle title="Prestige" subtitle="Your collection score." />
        <Card>
          <View style={styles.rowBetween}>
            <View>
              <Text style={styles.cardTitle}>Collection prestige</Text>
              <Text style={styles.cardSub}>Built from every lifestyle asset you own.</Text>
            </View>
            <Text style={styles.prestigeValue}>{game.prestige.toLocaleString()}</Text>
          </View>
        </Card>
      </ScrollView>

      <CollectionModal group={selectedCollection} game={game} onClose={() => setSelectedCollection(null)} />
      <ResidenceModal open={residenceOpen} game={game} onClose={() => setResidenceOpen(false)} />
    </>
  );
}

function ResidenceModal({ open, game, onClose }) {
  if (!open) return null;
  const nextResidence = game.residenceCatalog.find((item) => item.next);
  const ownedImprovements = game.residenceImprovements.filter((item) => item.owned).length;

  return (
    <Modal visible={open} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.modalPage}>
          <View style={styles.modalPageTop}>
            <Pressable onPress={onClose}><Text style={styles.backText}>‹</Text></Pressable>
            <View style={styles.flex}>
              <Text style={styles.modalPageTitle}>{game.residence ? 'My residence' : 'Residence'}</Text>
              <Text style={styles.modalPageSub}>Balance: {compactMoney(game.balance, 2)}</Text>
            </View>
          </View>

          {game.residence ? (
            <>
              <View style={styles.residenceHero}>
                <Text style={styles.residenceHeroIcon}>{game.residence.icon}</Text>
                <Text style={styles.residenceHeroName}>{game.residence.name}</Text>
                <Text style={styles.residenceHeroValue}>{compactMoney(game.residenceValue, 2)}</Text>
                <Text style={styles.residenceHeroLabel}>total residence value</Text>
              </View>

              <View style={styles.residenceManageGrid}>
                <Card style={styles.residenceManageCard}>
                  <IconBubble tone="blue" size={56}>⌾</IconBubble>
                  <Text style={styles.residenceManageTitle}>Security</Text>
                  <Text style={styles.residenceManageLevel}>Level {game.residenceSecurity}</Text>
                  <Button
                    small
                    label={'Upgrade · ' + compactMoney(game.residenceSecurityCost, 1)}
                    onPress={game.upgradeResidenceSecurity}
                    disabled={game.balance < game.residenceSecurityCost}
                  />
                </Card>
                <Card style={styles.residenceManageCard}>
                  <IconBubble tone="mint" size={56}>♟</IconBubble>
                  <Text style={styles.residenceManageTitle}>Staff</Text>
                  <Text style={styles.residenceManageLevel}>Level {game.residenceStaff}</Text>
                  <Button
                    small
                    label={'Upgrade · ' + compactMoney(game.residenceStaffCost, 1)}
                    onPress={game.upgradeResidenceStaff}
                    disabled={game.balance < game.residenceStaffCost}
                  />
                </Card>
              </View>

              <SectionTitle title="Residence improvements" subtitle={ownedImprovements + ' purchased'} />
              {game.residenceImprovements.map((item) => (
                <Card key={item.id} style={!item.unlocked && styles.lockedCard}>
                  <View style={styles.row}>
                    <IconBubble tone={item.owned ? 'mint' : 'gold'}>{item.icon}</IconBubble>
                    <View style={styles.flex}>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardSub}>
                        {item.owned ? 'Purchased' : item.unlocked ? compactMoney(item.cost, 1) : 'Unlock with a better residence'}
                      </Text>
                    </View>
                    <Button
                      small
                      secondary={item.owned}
                      label={item.owned ? 'Owned' : item.unlocked ? 'Buy' : 'Locked'}
                      onPress={() => game.buyResidenceImprovement(item.id)}
                      disabled={item.owned || !item.unlocked || game.balance < item.cost}
                    />
                  </View>
                </Card>
              ))}
            </>
          ) : (
            <View style={styles.emptyResidence}>
              <Text style={styles.emptyResidenceIcon}>⌂</Text>
              <Text style={styles.emptyResidenceTitle}>Your empire needs a home.</Text>
              <Text style={styles.emptyResidenceCopy}>Residences unlock security, staff and permanent upgrades.</Text>
            </View>
          )}

          {nextResidence && (
            <>
              <SectionTitle title={game.residence ? 'Next residence' : 'Choose your first residence'} subtitle="Each tier unlocks stronger upgrades." />
              <Card style={styles.nextResidenceCard}>
                <View style={styles.row}>
                  <IconBubble tone="blue" size={64}>{nextResidence.icon}</IconBubble>
                  <View style={styles.flex}>
                    <Text style={styles.cardTitle}>{nextResidence.name}</Text>
                    <Text style={styles.cardSub}>{compactMoney(nextResidence.cost, 1)}</Text>
                  </View>
                  <Button
                    small
                    label={game.residence ? 'Upgrade' : 'Buy'}
                    onPress={() => game.buyResidenceTier(game.residenceTier + 1)}
                    disabled={game.balance < nextResidence.cost}
                  />
                </View>
              </Card>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function CollectionModal({ group, game, onClose }) {
  if (!group) return null;
  const items = game.assetCatalog.filter((asset) => group.assetIds.includes(asset.id));
  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" />
        <ScrollView contentContainerStyle={styles.modalPage}>
          <View style={styles.modalPageTop}>
            <Pressable onPress={onClose}><Text style={styles.backText}>‹</Text></Pressable>
            <View style={styles.flex}>
              <Text style={styles.modalPageTitle}>{group.title}</Text>
              <Text style={styles.modalPageSub}>Balance: {compactMoney(game.balance, 2)}</Text>
            </View>
          </View>

          {items.map((asset) => (
            <Card key={asset.id} style={styles.assetShowCard}>
              <View style={styles.assetShowIcon}>
                <Text style={styles.assetShowEmoji}>{asset.icon}</Text>
              </View>
              <View style={styles.assetShowBottom}>
                <View style={styles.flex}>
                  <Text style={styles.assetShowName}>{asset.name}</Text>
                  <Text style={styles.assetShowPrice}>{asset.owned ? 'Owned' : compactMoney(asset.cost, 2)}</Text>
                </View>
                <Button
                  small
                  label={asset.owned ? 'Owned' : asset.unlocked ? 'Buy' : 'Locked'}
                  onPress={() => game.buyAsset(asset.id)}
                  disabled={asset.owned || !asset.unlocked || game.balance < asset.cost}
                />
              </View>
            </Card>
          ))}

          {!items.length && <Text style={styles.emptyText}>More items coming to this collection.</Text>}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function Profile({ game }) {
  const portfolio = [
    ['Cash', game.balance, C.blue],
    ['Businesses', game.businessValue, '#F06B6B'],
    ['Stocks', game.stockValue, '#E7B64B'],
    ['Real estate', game.propertyValue, '#B684C7'],
    ['Crypto', game.cryptoValue, '#71CDB6'],
    ['Collections', game.assetValue, '#6C7FD8'],
    ['Residence', game.residenceValue, '#236B9A'],
  ];
  const total = Math.max(1, portfolio.reduce((s, x) => s + Math.max(0, x[1]), 0));
  const richList = [...RICH_LIST, { name: 'You', industry: game.rank.name, fortune: game.netWorth, you: true }]
    .sort((a, b) => b.fortune - a.fortune);
  const yourRichRank = richList.findIndex((item) => item.you) + 1;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Header title="Profile" subtitle={game.rank.name + ' · Minted player'} />

      <View style={styles.profileFortuneRow}>
        <View>
          <Text style={styles.profileFortune}>{compactMoney(game.netWorth, 2)}</Text>
          <Text style={styles.profileFortuneLabel}>Fortune</Text>
        </View>
        <View style={styles.rankCircle}><Text style={styles.rankCircleText}>{game.rank.icon}</Text></View>
      </View>

      <View style={styles.portfolioBar}>
        {portfolio.map(([name, value, color]) => (
          <View key={name} style={{ flex: Math.max(0.01, value / total), backgroundColor: color }} />
        ))}
      </View>

      <View style={styles.profileGrid}>
        {portfolio.map(([name, value, color]) => (
          <View key={name} style={styles.profileMetric}>
            <View style={[styles.profileMetricStripe, { backgroundColor: color }]} />
            <View style={styles.flex}>
              <Text style={styles.profileMetricLabel}>{name}</Text>
              <Text style={styles.profileMetricValue}>{compactMoney(value, 2)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.profileProgressRow}>
        <Card style={styles.profileProgressCard}>
          <Text style={styles.miniEyebrow}>RANK</Text>
          <Text style={styles.progressCardTitle}>{game.rank.name}</Text>
          {game.nextRank ? (
            <>
              <View style={styles.slimTrack}><View style={[styles.slimFill, { width: (game.rankProgress * 100) + '%' }]} /></View>
              <Text style={styles.progressCardSub}>{Math.floor(game.rankProgress * 100)}% to {game.nextRank.name}</Text>
            </>
          ) : (
            <Text style={styles.progressCardSub}>Maximum rank reached</Text>
          )}
        </Card>

        <Card style={[styles.profileProgressCard, game.dailyAvailable && styles.dailyProfileReady]}>
          <Text style={styles.miniEyebrow}>DAILY CASH</Text>
          <Text style={styles.progressCardTitle}>Day {Math.max(1, game.dailyStreak + (game.dailyAvailable ? 1 : 0))}</Text>
          <Text style={styles.progressCardSub}>{game.dailyAvailable ? compactMoney(game.dailyReward, 1) + ' ready' : 'Come back tomorrow'}</Text>
          <Button
            small
            label={game.dailyAvailable ? 'Claim' : 'Claimed'}
            onPress={game.claimDaily}
            disabled={!game.dailyAvailable}
          />
        </Card>
      </View>

      <SectionTitle title="Rich list" subtitle={'You are #' + yourRichRank + ' in this simulated world.'} />
      <Card style={styles.richListCard}>
        {richList.slice(0, 6).map((person, index) => (
          <View key={person.name} style={[styles.richListRow, index === Math.min(5, richList.length - 1) && styles.noBorder, person.you && styles.richListYou]}>
            <Text style={styles.richListRank}>{index + 1}</Text>
            <View style={[styles.richAvatar, person.you && styles.richAvatarYou]}>
              <Text style={[styles.richAvatarText, person.you && styles.richAvatarTextYou]}>{person.you ? 'Y' : person.name[0]}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.richName, person.you && styles.richNameYou]}>{person.name}</Text>
              <Text style={styles.richIndustry}>{person.industry}</Text>
            </View>
            <Text style={styles.richFortune}>{compactMoney(person.fortune, 1)}</Text>
          </View>
        ))}
      </Card>

      {game.taxDue > 0 && (
        <Card style={styles.taxCard}>
          <View style={styles.row}>
            <IconBubble tone="blue">⌂</IconBubble>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>Taxes</Text>
              <Text style={styles.cardSub}>{compactMoney(game.taxDue, 2)} currently due</Text>
            </View>
            <Button small label="Pay" onPress={game.payTaxes} disabled={game.balance <= 0} />
          </View>
        </Card>
      )}

      <SectionTitle title="Statistics" subtitle="The empire in numbers." />
      <Card style={styles.statsCard}>
        <ProfileStat label="Businesses" value={game.businesses.length.toLocaleString()} />
        <ProfileStat label="Real estate" value={game.properties.reduce((s, p) => s + (p.count || 0), 0).toLocaleString()} />
        <ProfileStat label="Collectibles" value={game.assets.length.toLocaleString()} />
        <ProfileStat label="Acquisitions" value={game.acquisitionHistory.length.toLocaleString()} />
        <ProfileStat label="Mergers" value={game.mergerCount.toLocaleString()} />
        <ProfileStat label="Residence" value={game.residence ? game.residence.name : 'None'} />
        <ProfileStat label="Lifetime earned" value={compactMoney(game.totalEarned, 2)} />
        <ProfileStat label="Total taps" value={game.totalClicks.toLocaleString()} />
        <ProfileStat label="Passive income" value={compactMoney(game.passivePerSec, 2) + '/s'} last />
      </Card>

      <SectionTitle title="Achievements" subtitle="Small goals that keep the machine moving." />
      {game.achievements.map((achievement) => (
        <Card key={achievement.id} style={achievement.unlocked && !achievement.claimed && styles.activeCard}>
          <View style={styles.row}>
            <IconBubble tone={achievement.claimed ? 'mint' : achievement.unlocked ? 'gold' : 'blue'}>
              {achievement.claimed ? '✓' : achievement.unlocked ? '★' : '○'}
            </IconBubble>
            <View style={styles.flex}>
              <Text style={styles.cardTitle}>{achievement.title}</Text>
              <Text style={styles.cardSub}>{achievement.detail}</Text>
            </View>
            <Button
              small
              secondary={achievement.claimed}
              label={achievement.claimed ? 'Done' : achievement.unlocked ? compactMoney(achievement.reward, 1) : 'Locked'}
              onPress={() => game.claimAchievement(achievement.id)}
              disabled={!achievement.unlocked || achievement.claimed}
            />
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

function Stat({ label, value }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ProfileStat({ label, value, last }) {
  return (
    <View style={[styles.profileStat, last && styles.noBorder]}>
      <Text style={styles.profileStatLabel}>{label}</Text>
      <Text style={styles.profileStatValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  screen: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 34 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingMark: { width: 70, height: 70, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: C.mint },
  loadingMarkText: { fontSize: 38, fontWeight: '900', color: C.white },
  loadingTitle: { fontSize: 21, fontWeight: '900', letterSpacing: 3, color: C.text },
  loadingText: { fontSize: 15, color: C.muted },

  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  headerTitle: { fontSize: 38, lineHeight: 43, fontWeight: '900', color: C.text, letterSpacing: -1.2 },
  headerSubtitle: { marginTop: 5, fontSize: 15, lineHeight: 21, color: C.muted },
  sectionHeader: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 28, marginBottom: 12 },
  sectionTitle: { fontSize: 25, fontWeight: '850', color: C.text, letterSpacing: -0.5 },
  sectionSubtitle: { marginTop: 4, fontSize: 14, color: C.muted },
  sectionAction: { color: C.blue, fontSize: 15, fontWeight: '700', paddingBottom: 3 },

  card: { backgroundColor: C.card, borderRadius: 24, padding: 18, marginBottom: 12 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  activeCard: { borderWidth: 1.5, borderColor: C.mint, backgroundColor: C.mintSoft },
  lockedCard: { opacity: 0.48 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  flex: { flex: 1 },
  alignRight: { alignItems: 'flex-end' },
  muted: { fontSize: 14, color: C.muted },
  positive: { color: C.mint, fontWeight: '800' },
  negative: { color: C.red, fontWeight: '800' },
  cardTitle: { fontSize: 18, fontWeight: '800', color: C.text },
  cardSub: { marginTop: 3, fontSize: 14, color: C.muted },
  cardValue: { fontSize: 16, fontWeight: '850', color: C.text },
  chevron: { fontSize: 40, lineHeight: 42, color: C.faint, fontWeight: '300' },

  button: { minHeight: 48, flex: 1, borderRadius: 16, paddingHorizontal: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: C.mint },
  buttonSecondary: { backgroundColor: C.white },
  buttonDanger: { backgroundColor: C.redSoft },
  buttonSmall: { flex: 0, minHeight: 40, paddingHorizontal: 15, borderRadius: 13 },
  buttonDisabled: { backgroundColor: '#E2E6E9' },
  buttonText: { fontSize: 15, fontWeight: '850', color: C.white },
  buttonTextSecondary: { color: C.text },
  buttonTextDanger: { color: C.red },
  buttonTextDisabled: { color: C.faint },
  actionRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },

  iconBubble: { alignItems: 'center', justifyContent: 'center' },
  iconBubbleText: { fontWeight: '850' },

  nav: { minHeight: 76, paddingTop: 7, paddingHorizontal: 6, backgroundColor: C.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: C.line, flexDirection: 'row' },
  navItem: { flex: 1, alignItems: 'center' },
  navIconWrap: { width: 38, height: 32, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: C.mintSoft },
  navIcon: { fontSize: 21, color: C.faint, fontWeight: '700' },
  navIconActive: { color: C.mint },
  navLabel: { fontSize: 11, color: C.faint, marginTop: 4, fontWeight: '650' },
  navLabelActive: { color: C.mint, fontWeight: '800' },

  balanceHero: { borderRadius: 30, backgroundColor: '#153B39', padding: 24, marginBottom: 12 },
  heroLabel: { color: C.muted, fontSize: 15, fontWeight: '650' },
  heroBalance: { color: C.white, fontSize: 38, lineHeight: 47, fontWeight: '850', letterSpacing: -1.3, marginTop: 7 },
  heroDivider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.18)', marginVertical: 18 },
  heroBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroMiniLabel: { color: '#9EB6B2', fontSize: 12, fontWeight: '700' },
  heroMiniValue: { marginTop: 4, color: C.white, fontSize: 17, fontWeight: '800' },
  netWorthPill: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 14, paddingVertical: 9, borderRadius: 14, alignItems: 'flex-end' },
  netWorthPillLabel: { color: '#93AFAA', fontSize: 9, letterSpacing: 1.1, fontWeight: '800' },
  netWorthPillValue: { color: C.white, fontSize: 15, marginTop: 2, fontWeight: '850' },

  tapValueCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.mintSoft },
  tapValue: { fontSize: 26, fontWeight: '900', color: C.text },
  tapZone: { minHeight: 290, alignItems: 'center', justifyContent: 'center', marginTop: 4, borderRadius: 30 },
  tapZonePressed: { backgroundColor: '#F0F4F3' },
  tapCircle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: C.mint, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  tapCircleFlash: { transform: [{ scale: 0.94 }], backgroundColor: '#20A07B' },
  tapIcon: { color: C.white, fontWeight: '900', fontSize: 50 },
  tapTitle: { marginTop: 24, fontSize: 20, fontWeight: '800', color: C.text },
  tapSubtitle: { marginTop: 6, fontSize: 14, color: C.muted, textAlign: 'center' },

  tabs: { flexDirection: 'row', marginHorizontal: -18, paddingHorizontal: 18, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  tab: { flex: 1, alignItems: 'center', paddingTop: 4 },
  tabText: { fontSize: 16, color: C.muted, fontWeight: '650' },
  tabTextActive: { color: C.mint, fontWeight: '850' },
  tabLine: { height: 3, alignSelf: 'stretch', marginTop: 12, borderRadius: 3, backgroundColor: 'transparent' },
  tabLineActive: { backgroundColor: C.mint },

  portfolioHero: { backgroundColor: C.blueSoft, paddingVertical: 22 },
  portfolioHeroValue: { fontSize: 34, fontWeight: '900', color: C.text, letterSpacing: -1, marginTop: 8 },
  portfolioHeroSub: { fontSize: 14, color: C.muted, marginTop: 5 },
  marketFilters: { flexDirection: 'row', gap: 7, marginBottom: 4 },
  marketFilterPill: { flex: 1, minHeight: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  marketFilterPillActive: { backgroundColor: C.mint },
  marketFilterText: { fontSize: 12, color: C.muted, fontWeight: '800' },
  marketFilterTextActive: { color: C.white },
  emptyFilterText: { color: C.muted, textAlign: 'center', fontSize: 14 },

  marketRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  marketPrice: { fontSize: 17, fontWeight: '850', color: C.text },
  marketChange: { fontSize: 13, marginTop: 3 },
  twoCol: { flexDirection: 'row', gap: 10 },
  halfCard: { flex: 1 },
  miniEyebrow: { fontSize: 12, color: C.muted, fontWeight: '800', letterSpacing: 1.1 },
  halfValue: { fontSize: 20, color: C.text, fontWeight: '850', marginTop: 7 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(12,15,18,0.35)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 430, borderRadius: 30, padding: 24, backgroundColor: C.white },
  modalEyebrow: { marginTop: 18, color: C.mint, fontWeight: '900', fontSize: 11, letterSpacing: 1.5 },
  modalTitle: { marginTop: 6, fontSize: 27, lineHeight: 32, color: C.text, fontWeight: '900' },
  modalMoney: { marginTop: 15, fontSize: 35, fontWeight: '900', color: C.text },
  modalCopy: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 8, marginBottom: 20 },

  modalBackdropBottom: { flex: 1, backgroundColor: 'rgba(12,15,18,0.35)', justifyContent: 'flex-end' },
  tradeSheet: { backgroundColor: C.bg, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, paddingBottom: 34, maxHeight: '88%' },
  sheetHandle: { width: 46, height: 5, borderRadius: 3, backgroundColor: '#CCD2D8', alignSelf: 'center', marginBottom: 20 },
  closeButton: { fontSize: 36, color: C.muted, fontWeight: '300', paddingHorizontal: 5 },
  tradeName: { fontSize: 23, fontWeight: '900', color: C.text },
  tradeSymbol: { fontSize: 14, color: C.muted, marginTop: 2 },
  tradePrice: { marginTop: 22, fontSize: 38, fontWeight: '900', color: C.text, letterSpacing: -1.2 },
  fakeChart: { height: 125, flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginVertical: 22, paddingHorizontal: 4 },
  fakeChartBar: { flex: 1, borderRadius: 4, backgroundColor: '#9EDBC8' },
  tradeStats: { flexDirection: 'row', gap: 8, marginBottom: 22 },
  stat: { flex: 1, backgroundColor: C.card, borderRadius: 16, padding: 12 },
  statLabel: { fontSize: 10, color: C.muted, fontWeight: '800', letterSpacing: 0.8 },
  statValue: { marginTop: 5, fontSize: 14, fontWeight: '850', color: C.text },
  sheetLabel: { fontSize: 13, color: C.muted, fontWeight: '750' },
  quickAmounts: { flexDirection: 'row', gap: 8, marginTop: 9, marginBottom: 14 },
  amountPill: { flex: 1, minHeight: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  amountPillActive: { backgroundColor: C.mint },
  amountPillText: { color: C.text, fontWeight: '800' },
  amountPillTextActive: { color: C.white },
  tradeSummary: { marginBottom: 14, fontSize: 14, color: C.muted },

  businessSummary: { backgroundColor: C.cardStrong, paddingVertical: 22 },
  businessIncome: { marginTop: 8, fontSize: 34, color: C.text, fontWeight: '900', letterSpacing: -1 },
  summaryLine: { height: StyleSheet.hairlineWidth, backgroundColor: '#D4DADF', marginVertical: 16 },
  slotPill: { backgroundColor: C.blueSoft, borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  slotPillText: { color: C.blue, fontSize: 12, fontWeight: '800' },
  chevronButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  companyHero: { minHeight: 210, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft, marginBottom: 14 },
  companyHeroIncome: { fontSize: 33, fontWeight: '900', color: C.text, marginTop: 16 },
  companyHeroLabel: { fontSize: 13, color: C.muted, marginTop: 3 },
  companyStatGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  companyValueCard: { backgroundColor: C.mintSoft },
  companyValueNumber: { fontSize: 31, fontWeight: '900', color: C.text },

  dealHero: { backgroundColor: '#122C3A', padding: 22 },
  dealHeroKicker: { color: '#86A7B8', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  dealHeroMoney: { color: C.white, fontSize: 35, fontWeight: '900', marginTop: 8, letterSpacing: -1 },
  dealHeroSub: { color: '#9DB6C3', fontSize: 13, marginTop: 3 },
  dealHeroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.18)' },
  dealHeroStatLabel: { color: '#7F9AAA', fontSize: 9, fontWeight: '850', letterSpacing: 0.8 },
  dealHeroStatValue: { color: C.white, fontSize: 17, fontWeight: '900', marginTop: 4 },
  dealTabs: { flexDirection: 'row', gap: 8, marginTop: 4, marginBottom: 4 },
  dealTab: { flex: 1, minHeight: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: C.card },
  dealTabActive: { backgroundColor: C.text },
  dealTabText: { color: C.muted, fontSize: 14, fontWeight: '800' },
  dealTabTextActive: { color: C.white },
  dealTargetTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dealTargetValue: { color: C.text, fontSize: 17, fontWeight: '900' },
  dealMetricRow: { flexDirection: 'row', gap: 8, marginTop: 16, marginBottom: 13 },
  dealMetric: { flex: 1, backgroundColor: C.cardStrong, borderRadius: 14, padding: 10 },
  dealMetricLabel: { color: C.faint, fontSize: 8, fontWeight: '850', letterSpacing: 0.8 },
  dealMetricValue: { color: C.text, fontSize: 13, fontWeight: '900', marginTop: 4 },
  dealDetailLine: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  dealDetailText: { color: C.muted, fontSize: 11, fontWeight: '700' },
  dealEmptyCard: { alignItems: 'center', paddingVertical: 42 },
  dealEmptyIcon: { fontSize: 48, color: C.mint, fontWeight: '900' },
  dealEmptyTitle: { color: C.text, fontSize: 21, fontWeight: '900', marginTop: 10 },
  dealEmptyCopy: { color: C.muted, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 7, maxWidth: 270 },
  dealHistoryCard: { paddingVertical: 5 },
  dealHistoryRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  dealHistoryName: { color: C.text, fontSize: 15, fontWeight: '850' },
  dealHistoryPrice: { color: C.text, fontSize: 15, fontWeight: '900' },
  mergeCountBadge: { minWidth: 34, height: 34, borderRadius: 17, textAlign: 'center', textAlignVertical: 'center', lineHeight: 34, backgroundColor: C.mintSoft, color: C.mint, fontWeight: '900' },
  mergerFlow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  mergerCompany: { flex: 1, borderRadius: 15, backgroundColor: C.cardStrong, padding: 12 },
  mergerCompanyName: { color: C.text, fontSize: 13, fontWeight: '850' },
  mergerPlus: { color: C.muted, fontSize: 20, fontWeight: '800' },
  mergerResult: { borderRadius: 16, backgroundColor: C.mintSoft, padding: 14, marginTop: 12, marginBottom: 14 },
  mergerResultLabel: { color: C.muted, fontSize: 9, fontWeight: '850', letterSpacing: 0.8 },
  mergerResultValue: { color: C.text, fontSize: 21, fontWeight: '900', marginTop: 5 },

  businessCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniStatsRow: { flexDirection: 'row', gap: 14, marginTop: 15 },
  miniStat: { color: C.faint, fontSize: 12, fontWeight: '700' },
  businessCardIncome: { fontSize: 24, color: C.text, fontWeight: '900', marginTop: 16 },
  businessCardSuffix: { color: C.muted, fontSize: 13, fontWeight: '500' },
  businessActions: { flexDirection: 'row', gap: 8, marginTop: 15 },

  modalPage: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 40 },
  modalPageTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  backText: { fontSize: 50, lineHeight: 50, color: C.text, fontWeight: '300' },
  modalPageTitle: { fontSize: 31, fontWeight: '900', color: C.text, letterSpacing: -0.8 },
  modalPageSub: { fontSize: 14, color: C.muted, marginTop: 2 },
  pageLead: { marginBottom: 20, fontSize: 15, color: C.muted, lineHeight: 21 },
  businessGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  businessGridCard: { width: '48%', aspectRatio: 0.95, borderRadius: 24, padding: 16, backgroundColor: C.card, justifyContent: 'space-between' },
  gridBottom: { marginTop: 18 },
  gridTitle: { fontSize: 18, fontWeight: '850', color: C.text },
  gridSub: { marginTop: 5, fontSize: 14, color: C.muted },

  businessLaunchCard: { backgroundColor: C.blueSoft, marginBottom: 22 },
  launchCost: { fontSize: 19, color: C.text, fontWeight: '900' },
  inputLabel: { color: C.muted, fontSize: 13, fontWeight: '800', marginBottom: 8, letterSpacing: 0.3 },
  companyInput: { minHeight: 62, borderRadius: 18, paddingHorizontal: 18, backgroundColor: C.white, borderWidth: 1.5, borderColor: C.line, fontSize: 20, color: C.text, fontWeight: '750', marginBottom: 14 },
  companyMetaRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  companyMetaCard: { flex: 1, borderRadius: 18, backgroundColor: C.card, padding: 15 },
  companyMetaLabel: { color: C.muted, fontSize: 10, fontWeight: '850', letterSpacing: 0.8 },
  companyMetaValue: { color: C.text, fontSize: 16, fontWeight: '900', marginTop: 5 },
  nameHint: { color: C.muted, fontSize: 14, lineHeight: 20, marginBottom: 18 },

  residenceHomeCard: { backgroundColor: '#123E3C', padding: 22, overflow: 'hidden' },
  residenceHomeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  residenceKicker: { color: '#8EB6AF', fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  residenceHomeTitle: { color: C.white, fontSize: 25, fontWeight: '900', marginTop: 6, maxWidth: 250 },
  residenceHomeSub: { color: '#A8C7C1', fontSize: 14, marginTop: 5 },
  residenceHomeIcon: { color: C.white, fontSize: 48, fontWeight: '800' },
  residenceHomeStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)' },
  residenceStatLabel: { color: '#87AAA4', fontSize: 9, fontWeight: '850', letterSpacing: 0.8 },
  residenceStatValue: { color: C.white, fontSize: 16, fontWeight: '900', marginTop: 4 },
  residenceOpenText: { marginTop: 20, color: '#BFE5DC', fontSize: 14, fontWeight: '800' },
  residenceHero: { minHeight: 240, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: '#123E3C', padding: 24, marginBottom: 16 },
  residenceHeroIcon: { fontSize: 78 },
  residenceHeroName: { color: C.white, fontSize: 26, fontWeight: '900', marginTop: 10 },
  residenceHeroValue: { color: C.white, fontSize: 34, fontWeight: '900', marginTop: 14 },
  residenceHeroLabel: { color: '#9CC3BC', fontSize: 13, marginTop: 2 },
  residenceManageGrid: { flexDirection: 'row', gap: 10 },
  residenceManageCard: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  residenceManageTitle: { color: C.text, fontSize: 18, fontWeight: '850', marginTop: 10 },
  residenceManageLevel: { color: C.muted, fontSize: 14, marginTop: 3, marginBottom: 13 },
  emptyResidence: { alignItems: 'center', paddingVertical: 55, paddingHorizontal: 24 },
  emptyResidenceIcon: { fontSize: 78, color: C.mint },
  emptyResidenceTitle: { fontSize: 25, fontWeight: '900', color: C.text, marginTop: 16, textAlign: 'center' },
  emptyResidenceCopy: { color: C.muted, fontSize: 15, lineHeight: 21, marginTop: 8, textAlign: 'center' },
  nextResidenceCard: { backgroundColor: C.blueSoft },

  showcaseRow: { flexDirection: 'row', gap: 9, marginBottom: 8 },
  showcaseCard: { flex: 1, marginBottom: 0, alignItems: 'center', paddingHorizontal: 8 },
  showcaseTitle: { fontSize: 14, fontWeight: '800', color: C.text, marginTop: 10 },
  collectionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  collectionCard: { width: '48%', minHeight: 190, borderRadius: 24, backgroundColor: C.card, padding: 16, justifyContent: 'flex-end' },
  collectionTitle: { marginTop: 16, fontSize: 18, color: C.text, fontWeight: '850' },
  collectionCount: { marginTop: 4, fontSize: 14, color: C.muted },
  prestigeValue: { fontSize: 30, color: C.mint, fontWeight: '900' },
  assetShowCard: { padding: 0, overflow: 'hidden', backgroundColor: C.cardStrong },
  assetShowIcon: { height: 180, alignItems: 'center', justifyContent: 'center', backgroundColor: C.blueSoft },
  assetShowEmoji: { fontSize: 86 },
  assetShowBottom: { padding: 18, flexDirection: 'row', alignItems: 'center', gap: 12 },
  assetShowName: { fontSize: 20, fontWeight: '900', color: C.text },
  assetShowPrice: { marginTop: 4, color: C.muted, fontSize: 14 },
  emptyText: { color: C.muted, textAlign: 'center', marginTop: 50 },

  profileFortuneRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  profileFortune: { fontSize: 40, fontWeight: '900', color: C.text, letterSpacing: -1.2 },
  profileFortuneLabel: { marginTop: 2, fontSize: 16, color: C.muted },
  rankCircle: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.mintSoft, alignItems: 'center', justifyContent: 'center' },
  rankCircleText: { color: C.mint, fontSize: 24, fontWeight: '900' },
  portfolioBar: { height: 22, borderRadius: 8, overflow: 'hidden', flexDirection: 'row', marginBottom: 18 },
  profileGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  profileMetric: { width: '48%', minHeight: 76, borderRadius: 18, backgroundColor: C.card, overflow: 'hidden', flexDirection: 'row' },
  profileMetricStripe: { width: 11 },
  profileMetricLabel: { color: C.muted, fontSize: 13, marginTop: 13, marginLeft: 12 },
  profileMetricValue: { color: C.text, fontSize: 17, fontWeight: '850', marginTop: 4, marginLeft: 12 },
  profileProgressRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  profileProgressCard: { flex: 1, marginBottom: 0, minHeight: 155 },
  dailyProfileReady: { backgroundColor: C.mintSoft },
  progressCardTitle: { fontSize: 21, color: C.text, fontWeight: '900', marginTop: 7 },
  progressCardSub: { fontSize: 12, color: C.muted, marginTop: 8, marginBottom: 10 },
  slimTrack: { height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: '#DCE3E5', marginTop: 13 },
  slimFill: { height: '100%', borderRadius: 5, backgroundColor: C.mint },

  richListCard: { paddingVertical: 6 },
  richListRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE1E5', paddingHorizontal: 4 },
  richListYou: { backgroundColor: C.mintSoft, marginHorizontal: -10, paddingHorizontal: 14, borderRadius: 14, borderBottomWidth: 0 },
  richListRank: { width: 20, fontSize: 14, color: C.muted, fontWeight: '800' },
  richAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.blueSoft, alignItems: 'center', justifyContent: 'center' },
  richAvatarYou: { backgroundColor: C.mint },
  richAvatarText: { color: C.blue, fontWeight: '900' },
  richAvatarTextYou: { color: C.white },
  richName: { fontSize: 15, color: C.text, fontWeight: '800' },
  richNameYou: { color: '#0E6A51' },
  richIndustry: { fontSize: 12, color: C.muted, marginTop: 2 },
  richFortune: { fontSize: 14, color: C.text, fontWeight: '900' },

  taxCard: { marginTop: 26, backgroundColor: C.blueSoft },
  statsCard: { paddingVertical: 6 },
  profileStat: { minHeight: 49, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#DCE1E5' },
  noBorder: { borderBottomWidth: 0 },
  profileStatLabel: { color: C.muted, fontSize: 15 },
  profileStatValue: { color: C.text, fontSize: 15, fontWeight: '850' },
});

