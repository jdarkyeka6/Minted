import React, { useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useGame } from '../src/GameContext';

const ACCENT = '#7CFFB2';
const NAV = [
  ['Empire', '◈'],
  ['Markets', '↗'],
  ['Business', '▦'],
  ['Assets', '◆'],
  ['Earn', '✦'],
];

const money = (value, precise = false) => {
  const n = Number(value || 0);
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  const fmt = (divisor, suffix, decimals = 2) => `${sign}$${(abs / divisor).toFixed(decimals)}${suffix}`;
  if (abs >= 1e15) return fmt(1e15, 'Q');
  if (abs >= 1e12) return fmt(1e12, 'T');
  if (abs >= 1e9) return fmt(1e9, 'B');
  if (abs >= 1e6) return fmt(1e6, 'M');
  if (abs >= 1e3) return fmt(1e3, 'K', precise ? 2 : 1);
  return `${sign}$${precise ? abs.toFixed(2) : Math.floor(abs).toLocaleString()}`;
};

const pct = (value) => `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Section({ title, caption, right }) {
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

function Button({ label, onPress, disabled = false, secondary = false, compact = false }) {
  return (
    <Pressable
      disabled={disabled}
      onPress={() => {
        Haptics.selectionAsync();
        onPress?.();
      }}
      style={({ pressed }) => [
        styles.button,
        secondary && styles.buttonSecondary,
        compact && styles.buttonCompact,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <View style={styles.segmented}>
      {options.map((option) => (
        <Pressable
          key={option}
          onPress={() => {
            Haptics.selectionAsync();
            onChange(option);
          }}
          style={[styles.segment, value === option && styles.segmentActive]}
        >
          <Text style={[styles.segmentText, value === option && styles.segmentTextActive]}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Metric({ label, value, accent = false }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text numberOfLines={1} style={[styles.metricValue, accent && styles.accentText]}>{value}</Text>
    </View>
  );
}

function Progress({ value }) {
  const clamped = Math.max(0, Math.min(1, value || 0));
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${clamped * 100}%` }]} />
    </View>
  );
}

function Empty({ text }) {
  return <Text style={styles.empty}>{text}</Text>;
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
          <View style={styles.logo}><Text style={styles.logoText}>M</Text></View>
          <Text style={styles.loadingName}>MINTED</Text>
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
          <Text style={styles.cashText}>{money(game.balance)} cash</Text>
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
          <Pressable
            key={name}
            onPress={() => {
              Haptics.selectionAsync();
              setTab(name);
            }}
            style={styles.navItem}
          >
            <View style={[styles.navIconWrap, tab === name && styles.navIconWrapActive]}>
              <Text style={[styles.navIcon, tab === name && styles.navIconActive]}>{icon}</Text>
            </View>
            <Text style={[styles.navText, tab === name && styles.navTextActive]}>{name}</Text>
          </Pressable>
        ))}
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={offlineVisible && game.offlineEarnings > 0}
        onRequestClose={closeOffline}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Text style={styles.modalIconText}>↗</Text></View>
            <Text style={styles.modalKicker}>WHILE YOU WERE AWAY</Text>
            <Text style={styles.modalMoney}>+{money(game.offlineEarnings)}</Text>
            <Text style={styles.modalCopy}>
              Your businesses, property, career and dividends kept earning. Offline income is capped at 8 hours.
            </Text>
            <Button label="Collect" onPress={closeOffline} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Empire({ game, setTab }) {
  const unclaimed = game.achievements.filter((a) => a.unlocked && !a.claimed);
  const portfolioTotal = Math.max(1, game.balance + game.businessValue + game.propertyValue + game.marketValue + game.assetValue);

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroKicker}>YOUR EMPIRE</Text>
            <Text style={styles.heroMoney}>{money(game.netWorth)}</Text>
            <Text style={styles.heroSub}>net worth</Text>
          </View>
          <View style={styles.rankBadge}>
            <Text style={styles.rankIcon}>{game.rank.icon}</Text>
            <Text style={styles.rankName}>{game.rank.name}</Text>
          </View>
        </View>

        <View style={styles.heroMetrics}>
          <Metric label="CASH" value={money(game.balance)} />
          <Metric label="INCOME / SEC" value={`+${money(game.passivePerSec, true)}`} accent />
        </View>
      </View>

      {game.nextRank && (
        <Card>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>NEXT RANK</Text>
              <Text style={styles.cardTitle}>{game.nextRank.name}</Text>
              <Text style={styles.cardBody}>{money(game.nextRank.min)} net worth</Text>
            </View>
            <Text style={styles.bigPercent}>{Math.floor(game.rankProgress * 100)}%</Text>
          </View>
          <Progress value={game.rankProgress} />
        </Card>
      )}

      <Card style={game.dailyAvailable ? styles.dailyReady : null}>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>DAILY CASH</Text>
            <Text style={styles.cardTitle}>
              {game.dailyAvailable ? `Claim ${money(game.dailyReward)}` : `Day ${game.dailyStreak} complete`}
            </Text>
            <Text style={styles.cardBody}>
              {game.dailyAvailable ? 'Come back each day to grow the streak.' : 'Next reward unlocks tomorrow.'}
            </Text>
          </View>
          <Button compact label={game.dailyAvailable ? 'Claim' : 'Claimed'} onPress={game.claimDaily} disabled={!game.dailyAvailable} />
        </View>
      </Card>

      <Section title="Portfolio" caption="Every piece of the machine in one place." />
      <Card>
        <PortfolioRow label="Cash" icon="$" value={game.balance} total={portfolioTotal} />
        <PortfolioRow label="Businesses" icon="▦" value={game.businessValue} total={portfolioTotal} />
        <PortfolioRow label="Property" icon="⌂" value={game.propertyValue} total={portfolioTotal} />
        <PortfolioRow label="Markets" icon="↗" value={game.marketValue} total={portfolioTotal} />
        <PortfolioRow label="Lifestyle" icon="◆" value={game.assetValue} total={portfolioTotal} last />
      </Card>

      <Section title="Money machine" caption="Your live passive income." />
      <View style={styles.twoCol}>
        <SmallStat label="Business" icon="▦" value={`+${money(game.businessIncomePerSec, true)}/s`} />
        <SmallStat label="Rent" icon="⌂" value={`+${money(game.propertyIncomePerSec, true)}/s`} />
        <SmallStat label="Career" icon="◉" value={`+${money(game.jobIncomePerSec, true)}/s`} />
        <SmallStat label="Dividends" icon="↗" value={`+${money(game.dividendIncomePerSec, true)}/s`} />
      </View>

      {game.taxDue > 0 && (
        <Card style={styles.taxCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardEyebrow}>TAX OFFICE</Text>
              <Text style={styles.cardTitle}>{money(game.taxDue)} due</Text>
              <Text style={styles.cardBody}>Taxes accumulate slowly as the empire earns.</Text>
            </View>
            <Button compact label="Pay" onPress={game.payTaxes} disabled={game.balance <= 0} />
          </View>
        </Card>
      )}

      <Section
        title="Achievements"
        caption={unclaimed.length ? `${unclaimed.length} reward${unclaimed.length === 1 ? '' : 's'} ready to claim.` : 'Milestones turn progress into cash.'}
      />
      {game.achievements.map((achievement) => (
        <Card key={achievement.id} style={achievement.unlocked && !achievement.claimed ? styles.achievementReady : null}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>{achievement.claimed ? '✓ ' : achievement.unlocked ? '◆ ' : '○ '}{achievement.title}</Text>
              <Text style={styles.cardBody}>{achievement.detail} · {money(achievement.reward)} reward</Text>
            </View>
            <Button
              compact
              secondary={achievement.claimed}
              label={achievement.claimed ? 'Done' : achievement.unlocked ? 'Claim' : 'Locked'}
              onPress={() => game.claimAchievement(achievement.id)}
              disabled={!achievement.unlocked || achievement.claimed}
            />
          </View>
        </Card>
      ))}

      <Section title="Recent activity" caption="The last moves in your empire." />
      <Card>
        {game.activity.length ? game.activity.slice(0, 7).map((item, index) => (
          <View key={item.id} style={[styles.activityRow, index === Math.min(6, game.activity.length - 1) && styles.activityLast]}>
            <View style={styles.activityDot} />
            <Text style={styles.activityText}>{item.text}</Text>
          </View>
        )) : <Empty text="Buy, build or invest and your activity will appear here." />}
      </Card>

      <Section title="Jump back in" />
      <View style={styles.quickGrid}>
        <Quick icon="↗" title="Markets" body={money(game.marketValue)} onPress={() => setTab('Markets')} />
        <Quick icon="▦" title="Business" body={`${game.businesses.length} companies`} onPress={() => setTab('Business')} />
        <Quick icon="◆" title="Assets" body={`${game.assets.length} flex items`} onPress={() => setTab('Assets')} />
        <Quick icon="✦" title="Earn" body={`${money(game.clickValue)} / tap`} onPress={() => setTab('Earn')} />
      </View>
    </ScrollView>
  );
}

function PortfolioRow({ label, icon, value, total, last = false }) {
  const share = Math.max(0, Math.min(1, value / total));
  return (
    <View style={[styles.portfolioRow, last && styles.noBorder]}>
      <View style={styles.squareIcon}><Text style={styles.squareIconText}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.portfolioName}>{label}</Text>
          <Text style={styles.portfolioValue}>{money(value)}</Text>
        </View>
        <Progress value={share} />
      </View>
    </View>
  );
}

function SmallStat({ label, icon, value }) {
  return (
    <View style={styles.smallStat}>
      <Text style={styles.smallStatIcon}>{icon}</Text>
      <Text style={styles.smallStatLabel}>{label}</Text>
      <Text style={styles.smallStatValue}>{value}</Text>
    </View>
  );
}

function Quick({ icon, title, body, onPress }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [styles.quick, pressed && styles.pressed]}
    >
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickBody}>{body}</Text>
    </Pressable>
  );
}

function Markets({ game }) {
  const [segment, setSegment] = useState('Stocks');
  const [size, setSize] = useState('1');
  const market = segment === 'Stocks' ? game.stocks : game.crypto;
  const holdings = segment === 'Stocks' ? game.stockValue : game.cryptoValue;

  const quantityFor = (item, mode, buying) => {
    if (mode === '1') return 1;
    if (mode === '10') return 10;
    if (buying) return Math.max(1, Math.floor(game.balance / Math.max(0.01, item.price)));
    return Math.max(1, segment === 'Stocks' ? item.shares : item.units);
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageKicker}>MINTED MARKETS</Text>
      <Text style={styles.pageTitle}>Markets</Text>
      <Text style={styles.pageIntro}>Prices tick live, events can kick them harder, and stock positions pay dividends.</Text>

      <Card style={styles.newsCard}>
        <Text style={styles.cardEyebrow}>MARKET WIRE</Text>
        <Text style={styles.newsText}>{game.marketHeadline}</Text>
      </Card>

      <View style={styles.marketSummaryRow}>
        <SummaryBox label="PORTFOLIO" value={money(game.marketValue)} />
        <SummaryBox label="DIVIDENDS" value={`+${money(game.dividendIncomePerSec, true)}/s`} accent />
      </View>

      <Segmented options={['Stocks', 'Crypto']} value={segment} onChange={setSegment} />
      <View style={styles.tradeSizeRow}>
        <Text style={styles.tradeSizeLabel}>TRADE SIZE</Text>
        <Segmented options={['1', '10', 'Max']} value={size} onChange={setSize} />
      </View>

      <Section title={segment} caption={`${money(holdings)} invested`} />

      {market.map((item) => {
        const units = segment === 'Stocks' ? item.shares : item.units;
        const holdingValue = units * item.price;
        const gain = item.avgCost > 0 ? ((item.price - item.avgCost) / item.avgCost) * 100 : 0;
        const buyQty = quantityFor(item, size, true);
        const sellQty = quantityFor(item, size, false);
        const buyCost = item.price * buyQty;
        const positive = item.changePct >= 0;

        return (
          <Card key={item.id}>
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
                <Text style={[styles.change, positive ? styles.positive : styles.negative]}>{pct(item.changePct)}</Text>
              </View>
            </View>

            <MiniChart positive={positive} seed={item.symbol.length + Math.round(item.price)} />

            <View style={styles.holdingStrip}>
              <Metric label="YOU OWN" value={`${units} ${segment === 'Stocks' ? 'shares' : 'coins'}`} />
              <Metric label="VALUE" value={money(holdingValue)} />
              <Metric label="P/L" value={units ? pct(gain) : '—'} accent={units > 0 && gain >= 0} />
            </View>

            <View style={styles.actionRow}>
              <Button
                label={`Buy ${buyQty === 1 ? '' : buyQty} ${money(buyCost, true)}`.replace('  ', ' ')}
                onPress={() => segment === 'Stocks' ? game.buyStock(item.id, buyQty) : game.buyCrypto(item.id, buyQty)}
                disabled={game.balance < buyCost}
              />
              <Button
                secondary
                label={`Sell ${Math.min(sellQty, units) || 1}`}
                onPress={() => segment === 'Stocks' ? game.sellStock(item.id, sellQty) : game.sellCrypto(item.id, sellQty)}
                disabled={units <= 0}
              />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function MiniChart({ positive, seed }) {
  const bars = useMemo(() => {
    const output = [];
    let value = 42 + (seed % 13);
    for (let i = 0; i < 16; i += 1) {
      value = Math.max(14, Math.min(92, value + ((seed * (i + 3)) % 21) - 10 + (positive ? 2 : -1)));
      output.push(value);
    }
    return output;
  }, [positive, seed]);

  return (
    <View style={styles.chart}>
      {bars.map((height, index) => <View key={index} style={[styles.chartBar, { height: `${height}%` }]} />)}
    </View>
  );
}

function SummaryBox({ label, value, accent = false }) {
  return (
    <View style={styles.summaryBox}>
      <Text style={styles.cardEyebrow}>{label}</Text>
      <Text style={[styles.summaryValue, accent && styles.accentText]}>{value}</Text>
    </View>
  );
}

function Businesses({ game }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.pageKicker}>BUILD SOMETHING BIG</Text>
      <Text style={styles.pageTitle}>Business</Text>
      <Text style={styles.pageIntro}>Launch companies, expand locations, upgrade operations and hire management teams.</Text>

      <View style={styles.marketSummaryRow}>
        <SummaryBox label="BUSINESS VALUE" value={money(game.businessValue)} />
        <SummaryBox label="PROFIT / SEC" value={`+${money(game.businessIncomePerSec, true)}`} accent />
      </View>

      <Section title="Companies" caption={`${game.businesses.length} operating`} />

      {game.businessCatalog.map((base) => {
        const owned = game.businesses.find((item) => item.id === base.id);
        const details = owned ? game.getBusinessDetails(base.id) : null;

        return (
          <Card key={base.id} style={!base.unlocked ? styles.lockedCard : null}>
            <View style={styles.companyTop}>
              <View style={styles.companyIcon}><Text style={styles.companyEmoji}>{base.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <View style={styles.companyNameRow}>
                  <Text style={styles.companyName}>{base.name}</Text>
                  <View style={styles.chip}><Text style={styles.chipText}>{base.industry}</Text></View>
                </View>
                <Text style={styles.companyMeta}>
                  {owned
                    ? `Level ${owned.level} · ${owned.units} ${owned.units === 1 ? 'location' : 'locations'} · Manager ${owned.managerLevel || 0}`
                    : base.unlocked
                      ? `${money(base.cost)} to launch`
                      : `Unlock near ${money(base.cost * 0.35)} net worth`}
                </Text>
              </View>
            </View>

            {owned && details ? (
              <>
                <View style={styles.businessGrid}>
                  <Metric label="REVENUE / SEC" value={money(details.revenuePerSec, true)} />
                  <Metric label="EXPENSES / SEC" value={money(details.expensesPerSec, true)} />
                  <Metric label="PROFIT / SEC" value={`+${money(details.profitPerSec, true)}`} accent />
                  <Metric label="EMPLOYEES" value={details.employees.toLocaleString()} />
                  <Metric label="REPUTATION" value={`${Math.round(details.reputation)}%`} />
                  <Metric label="VALUE" value={money(owned.value)} />
                </View>

                <View style={styles.actionStack}>
                  <Button label={`Expand · ${money(owned.unitCost)}`} onPress={() => game.expandBusiness(base.id)} disabled={game.balance < owned.unitCost} />
                  <View style={styles.actionRow}>
                    <Button secondary label={`Upgrade · ${money(owned.upgradeCost)}`} onPress={() => game.upgradeBusiness(base.id)} disabled={game.balance < owned.upgradeCost} />
                    <Button secondary label={`Manager · ${money(owned.managerCost)}`} onPress={() => game.hireManager(base.id)} disabled={game.balance < owned.managerCost} />
                  </View>
                </View>
              </>
            ) : (
              <Button
                label={base.unlocked ? `Launch for ${money(base.cost)}` : 'Locked'}
                onPress={() => game.buyBusiness(base.id)}
                disabled={!base.unlocked || game.balance < base.cost}
              />
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
      <Text style={styles.pageIntro}>Property pays rent. Lifestyle assets add prestige and turn the net-worth screen into a flex.</Text>

      <View style={styles.marketSummaryRow}>
        <SummaryBox label="PROPERTY" value={money(game.propertyValue)} />
        <SummaryBox label="PRESTIGE" value={game.prestige.toLocaleString()} accent />
      </View>

      <Segmented options={['Property', 'Lifestyle']} value={segment} onChange={setSegment} />

      {segment === 'Property' ? (
        <>
          <Section title="Property market" caption={`+${money(game.propertyIncomePerSec, true)}/s total rent`} />
          {game.propertyCatalog.map((item) => {
            const owned = game.properties.find((property) => property.id === item.id);
            return (
              <Card key={item.id} style={!item.unlocked ? styles.lockedCard : null}>
                <View style={styles.assetTop}>
                  <View style={styles.assetIcon}><Text style={styles.assetEmoji}>{item.icon}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.companyName}>{item.name}</Text>
                    <Text style={styles.companyMeta}>{item.location} · +{money(item.rentPerSec, true)}/s rent</Text>
                  </View>
                  {!!owned && <View style={styles.countBadge}><Text style={styles.countBadgeText}>×{owned.count}</Text></View>}
                </View>
                <View style={styles.assetFooter}>
                  <View>
                    <Text style={styles.cardEyebrow}>PRICE</Text>
                    <Text style={styles.assetPrice}>{money(item.cost)}</Text>
                  </View>
                  <Button compact label={item.unlocked ? 'Buy' : 'Locked'} onPress={() => game.buyProperty(item.id)} disabled={!item.unlocked || game.balance < item.cost} />
                </View>
              </Card>
            );
          })}
        </>
      ) : (
        <>
          <Section title="Lifestyle collection" caption={`${money(game.assetValue)} collection value`} />
          {game.assetCatalog.map((item) => (
            <Card key={item.id} style={!item.unlocked ? styles.lockedCard : null}>
              <View style={styles.assetTop}>
                <View style={styles.assetIcon}><Text style={styles.assetEmoji}>{item.icon}</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{item.name}</Text>
                  <Text style={styles.companyMeta}>{item.prestige.toLocaleString()} prestige · {money(item.cost)}</Text>
                </View>
                {item.owned
                  ? <View style={styles.ownedBadge}><Text style={styles.ownedBadgeText}>OWNED</Text></View>
                  : <Button compact label={item.unlocked ? 'Buy' : 'Locked'} onPress={() => game.buyAsset(item.id)} disabled={!item.unlocked || game.balance < item.cost} />}
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
      <Text style={styles.pageIntro}>Tap when you are broke, keep a career for steady cash, then let your assets take over.</Text>

      <Pressable
        onPress={() => {
          game.tap();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        style={({ pressed }) => [styles.tapMachine, pressed && styles.tapPressed]}
      >
        <Text style={styles.tapKicker}>TAP TO EARN</Text>
        <Text style={styles.tapMoney}>+{money(game.clickValue)}</Text>
        <Text style={styles.tapHint}>{game.totalClicks.toLocaleString()} lifetime taps</Text>
      </Pressable>

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardEyebrow}>TAP POWER</Text>
            <Text style={styles.cardTitle}>
              {game.maxClick ? 'Maximum upgrade reached' : `${money(game.clickValue)} → ${money(game.nextClickValue)} per tap`}
            </Text>
            <Text style={styles.cardBody}>
              {game.maxClick ? 'Your finger can retire now.' : `${money(game.clickUpgradeCost)} to upgrade`}
            </Text>
          </View>
          <Button compact label={game.maxClick ? 'MAX' : 'Upgrade'} onPress={game.buyClickUpgrade} disabled={!game.canBuyClick} />
        </View>
      </Card>

      <Section title="Career" caption={activeJob ? `${activeJob.name} pays ${money(activeJob.incomePerSec, true)}/s.` : 'Pick a job.'} />
      {game.jobs.map((job) => {
        const active = job.id === game.activeJobId;
        const unlocked = game.netWorth >= job.unlockNetWorth;
        return (
          <Card key={job.id} style={[active ? styles.jobActive : null, !unlocked ? styles.lockedCard : null]}>
            <View style={styles.jobRow}>
              <View style={styles.jobIcon}><Text style={styles.jobEmoji}>{job.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName}>{job.name}</Text>
                <Text style={styles.companyMeta}>
                  {unlocked ? `${money(job.incomePerSec, true)}/s steady income` : `Unlock at ${money(job.unlockNetWorth)} net worth`}
                </Text>
              </View>
              <Button compact secondary={!active} label={active ? 'Active' : 'Take job'} onPress={() => game.takeJob(job.id)} disabled={!unlocked || active} />
            </View>
          </Card>
        );
      })}

      <Section title="Lifetime stats" />
      <Card>
        <View style={styles.businessGrid}>
          <Metric label="TOTAL EARNED" value={money(game.totalEarned)} />
          <Metric label="TOTAL TAPS" value={game.totalClicks.toLocaleString()} />
          <Metric label="NET WORTH" value={money(game.netWorth)} accent />
          <Metric label="PASSIVE / SEC" value={`+${money(game.passivePerSec, true)}`} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070A0F' },
  body: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 34, gap: 12 },
  muted: { color: '#7F8A9D', fontSize: 13 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  logo: { width: 64, height: 64, borderRadius: 20, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: '#07110B', fontSize: 32, fontWeight: '900' },
  loadingName: { color: '#F7F9FC', fontSize: 20, fontWeight: '900', letterSpacing: 5 },

  topbar: {
    minHeight: 72,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#151B24',
    backgroundColor: '#090D13',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  kicker: { color: '#687386', fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  topBalance: { color: '#F7F9FC', fontSize: 26, fontWeight: '900', marginTop: 2 },
  topRight: { alignItems: 'flex-end', gap: 5 },
  incomePill: { backgroundColor: '#11271C', borderWidth: 1, borderColor: '#23563A', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  incomePillText: { color: ACCENT, fontSize: 12, fontWeight: '900' },
  cashText: { color: '#778499', fontSize: 11, fontWeight: '700' },

  nav: {
    minHeight: 76,
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#151B24',
    backgroundColor: '#090D13',
    paddingHorizontal: 4,
    paddingTop: 5,
    paddingBottom: 8,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navIconWrap: { width: 36, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: '#15241C' },
  navIcon: { color: '#647084', fontSize: 18, fontWeight: '900' },
  navIconActive: { color: ACCENT },
  navText: { color: '#647084', fontSize: 10, fontWeight: '800' },
  navTextActive: { color: '#EDF2F7' },

  card: { backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1B2330', borderRadius: 20, padding: 16, gap: 12 },
  cardEyebrow: { color: '#707D91', fontSize: 10, fontWeight: '900', letterSpacing: 1.25 },
  cardTitle: { color: '#F3F6FA', fontSize: 17, fontWeight: '900', marginTop: 3 },
  cardBody: { color: '#8390A3', fontSize: 12, lineHeight: 17, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  sectionTitle: { color: '#F4F7FA', fontSize: 20, fontWeight: '900' },
  sectionCaption: { color: '#748196', fontSize: 12, marginTop: 3, lineHeight: 16 },

  button: { minHeight: 44, flex: 1, borderRadius: 13, backgroundColor: ACCENT, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 11 },
  buttonSecondary: { backgroundColor: '#1A2230', borderWidth: 1, borderColor: '#2A3546' },
  buttonCompact: { flex: 0, minHeight: 38, paddingHorizontal: 13, paddingVertical: 9 },
  buttonText: { color: '#07110B', fontSize: 12, fontWeight: '900' },
  buttonTextSecondary: { color: '#E6ECF4' },
  disabled: { opacity: 0.34 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.992 }] },

  hero: { backgroundColor: '#0D2017', borderWidth: 1, borderColor: '#1C4A31', borderRadius: 28, padding: 20, gap: 16 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  heroKicker: { color: '#8AB79C', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  heroMoney: { color: '#F6FFF9', fontSize: 42, fontWeight: '900', marginTop: 3 },
  heroSub: { color: '#7C9E8B', fontSize: 13, fontWeight: '700' },
  rankBadge: { backgroundColor: '#12291D', borderRadius: 16, borderWidth: 1, borderColor: '#285239', paddingHorizontal: 11, paddingVertical: 9, alignItems: 'center' },
  rankIcon: { color: ACCENT, fontSize: 18, fontWeight: '900' },
  rankName: { color: '#DDFBE8', fontSize: 10, fontWeight: '900', marginTop: 2 },
  heroMetrics: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#728096', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  metricValue: { color: '#EDF2F7', fontSize: 14, fontWeight: '900', marginTop: 4 },
  accentText: { color: ACCENT },

  progressTrack: { height: 7, borderRadius: 99, backgroundColor: '#202938', overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 99, backgroundColor: ACCENT },
  bigPercent: { color: ACCENT, fontSize: 24, fontWeight: '900' },
  dailyReady: { borderColor: '#2A6845', backgroundColor: '#0E1D16' },
  taxCard: { borderColor: '#4D3326', backgroundColor: '#18110E' },
  achievementReady: { borderColor: '#315C43', backgroundColor: '#0E1A14' },

  portfolioRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#1B2330', paddingBottom: 12 },
  noBorder: { borderBottomWidth: 0, paddingBottom: 0 },
  squareIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#19212D', alignItems: 'center', justifyContent: 'center' },
  squareIconText: { color: '#C9D1DC', fontWeight: '900' },
  portfolioName: { color: '#DDE4ED', fontSize: 13, fontWeight: '800' },
  portfolioValue: { color: '#F5F7FA', fontSize: 13, fontWeight: '900' },

  twoCol: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  smallStat: { width: '48%', backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1B2330', borderRadius: 18, padding: 14 },
  smallStatIcon: { color: ACCENT, fontSize: 18, fontWeight: '900' },
  smallStatLabel: { color: '#728096', fontSize: 10, fontWeight: '800', marginTop: 10 },
  smallStatValue: { color: '#F4F7FA', fontSize: 16, fontWeight: '900', marginTop: 3 },

  activityRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#1B2330' },
  activityLast: { borderBottomWidth: 0, paddingBottom: 0 },
  activityDot: { width: 7, height: 7, borderRadius: 99, backgroundColor: ACCENT, marginTop: 5 },
  activityText: { color: '#AEB8C5', flex: 1, fontSize: 12, lineHeight: 17 },
  empty: { color: '#748196', fontSize: 12, lineHeight: 18 },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quick: { width: '48%', backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1B2330', borderRadius: 18, padding: 14 },
  quickIcon: { color: ACCENT, fontSize: 20, fontWeight: '900' },
  quickTitle: { color: '#F1F4F8', fontSize: 14, fontWeight: '900', marginTop: 12 },
  quickBody: { color: '#768397', fontSize: 11, marginTop: 3 },

  pageKicker: { color: ACCENT, fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  pageTitle: { color: '#F6F8FB', fontSize: 34, fontWeight: '900', marginTop: -5 },
  pageIntro: { color: '#8491A4', fontSize: 13, lineHeight: 19, marginTop: -5 },
  newsCard: { backgroundColor: '#0E1B15', borderColor: '#244C34' },
  newsText: { color: '#E3F7EA', fontSize: 15, fontWeight: '800', lineHeight: 20 },
  marketSummaryRow: { flexDirection: 'row', gap: 10 },
  summaryBox: { flex: 1, backgroundColor: '#10151D', borderWidth: 1, borderColor: '#1B2330', borderRadius: 18, padding: 14 },
  summaryValue: { color: '#F3F6FA', fontSize: 18, fontWeight: '900', marginTop: 5 },

  segmented: { flexDirection: 'row', backgroundColor: '#111823', borderRadius: 14, padding: 4, gap: 4 },
  segment: { flex: 1, minHeight: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10 },
  segmentActive: { backgroundColor: '#273244' },
  segmentText: { color: '#758297', fontSize: 11, fontWeight: '900' },
  segmentTextActive: { color: '#F4F7FA' },
  tradeSizeRow: { gap: 7 },
  tradeSizeLabel: { color: '#69768A', fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },

  marketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  marketIdentity: { flexDirection: 'row', alignItems: 'center', gap: 11, flex: 1 },
  marketIcon: { width: 44, height: 44, borderRadius: 15, backgroundColor: '#1A2330', alignItems: 'center', justifyContent: 'center' },
  marketIconText: { color: '#E6EBF2', fontSize: 19, fontWeight: '900' },
  marketSymbol: { color: '#F5F7FA', fontSize: 17, fontWeight: '900' },
  marketName: { color: '#758297', fontSize: 11, marginTop: 2 },
  marketPriceWrap: { alignItems: 'flex-end' },
  marketPrice: { color: '#F5F7FA', fontSize: 17, fontWeight: '900' },
  change: { fontSize: 11, fontWeight: '900', marginTop: 3 },
  positive: { color: ACCENT },
  negative: { color: '#FF7188' },
  chart: { height: 76, flexDirection: 'row', alignItems: 'flex-end', gap: 3, paddingVertical: 5 },
  chartBar: { flex: 1, minHeight: 5, borderRadius: 3, backgroundColor: '#405064' },
  holdingStrip: { flexDirection: 'row', gap: 10, backgroundColor: '#0C1118', borderRadius: 14, padding: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionStack: { gap: 8 },

  lockedCard: { opacity: 0.62 },
  companyTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  companyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#1A2230', alignItems: 'center', justifyContent: 'center' },
  companyEmoji: { fontSize: 24 },
  companyNameRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  companyName: { color: '#F2F5F8', fontSize: 16, fontWeight: '900' },
  companyMeta: { color: '#778499', fontSize: 11, marginTop: 4, lineHeight: 16 },
  chip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 99, backgroundColor: '#1B2734' },
  chipText: { color: '#91A0B5', fontSize: 9, fontWeight: '900' },
  businessGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },

  assetTop: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  assetIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#1A2230', alignItems: 'center', justifyContent: 'center' },
  assetEmoji: { fontSize: 25 },
  countBadge: { backgroundColor: '#1A2933', borderRadius: 99, paddingHorizontal: 9, paddingVertical: 6 },
  countBadgeText: { color: '#CDE5D6', fontSize: 11, fontWeight: '900' },
  assetFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 },
  assetPrice: { color: '#F4F7FA', fontSize: 16, fontWeight: '900', marginTop: 4 },
  ownedBadge: { backgroundColor: '#153020', borderWidth: 1, borderColor: '#286143', borderRadius: 99, paddingHorizontal: 10, paddingVertical: 6 },
  ownedBadgeText: { color: ACCENT, fontSize: 9, fontWeight: '900' },

  tapMachine: { height: 230, borderRadius: 30, backgroundColor: '#183928', borderWidth: 1, borderColor: '#34724D', alignItems: 'center', justifyContent: 'center' },
  tapPressed: { transform: [{ scale: 0.985 }], opacity: 0.9 },
  tapKicker: { color: '#A7DDBB', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  tapMoney: { color: '#F5FFF8', fontSize: 50, fontWeight: '900', marginTop: 8 },
  tapHint: { color: '#83A991', fontSize: 11, marginTop: 8 },
  jobRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  jobIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#1A2230', alignItems: 'center', justifyContent: 'center' },
  jobEmoji: { fontSize: 22 },
  jobActive: { borderColor: '#2E6947', backgroundColor: '#0F1B15' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', alignItems: 'center', justifyContent: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#10161E', borderRadius: 26, borderWidth: 1, borderColor: '#283343', padding: 22, alignItems: 'center', gap: 10 },
  modalIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#163524', alignItems: 'center', justifyContent: 'center' },
  modalIconText: { color: ACCENT, fontSize: 26, fontWeight: '900' },
  modalKicker: { color: '#7E8B9F', fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 4 },
  modalMoney: { color: '#F5FFF8', fontSize: 38, fontWeight: '900' },
  modalCopy: { color: '#8995A7', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 5 },
});
