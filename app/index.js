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

const NAV = [
  ['Empire', '◈'],
  ['Markets', '↗'],
  ['Ventures', '▦'],
  ['Assets', '◆'],
  ['Earn', '✦'],
];

const money = (value, precise = false) => {
  const n = Number(value || 0);
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  const fmt = (d, s, digits = 2) => `${sign}$${(abs / d).toFixed(digits)}${s}`;
  if (abs >= 1e15) return fmt(1e15, 'Q');
  if (abs >= 1e12) return fmt(1e12, 'T');
  if (abs >= 1e9) return fmt(1e9, 'B');
  if (abs >= 1e6) return fmt(1e6, 'M');
  if (abs >= 1e3) return fmt(1e3, 'K', precise ? 2 : 1);
  return `${sign}$${precise ? abs.toFixed(2) : Math.floor(abs).toLocaleString()}`;
};

const pct = (value) => `${value >= 0 ? '+' : ''}${Number(value || 0).toFixed(2)}%`;

function Card({ children, style, onPress }) {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, style, pressed && styles.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

function Button({ label, onPress, secondary = false, disabled = false, compact = false }) {
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

function Header({ eyebrow, title, body, right }) {
  return (
    <View style={styles.headerWrap}>
      <View style={{ flex: 1 }}>
        {!!eyebrow && <Text style={styles.eyebrow}>{eyebrow}</Text>}
        <Text style={styles.pageTitle}>{title}</Text>
        {!!body && <Text style={styles.pageBody}>{body}</Text>}
      </View>
      {right}
    </View>
  );
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

function Metric({ label, value, accent = false }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, accent && styles.green]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function Tag({ children, tone = 'normal' }) {
  return (
    <View style={[styles.tag, tone === 'green' && styles.tagGreen, tone === 'red' && styles.tagRed]}>
      <Text style={[styles.tagText, tone === 'green' && styles.tagGreenText, tone === 'red' && styles.tagRedText]}>{children}</Text>
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

function Sparkline({ history = [], positive = true }) {
  const values = history.length ? history : [1, 1, 1, 1];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = Math.max(0.001, max - min);
  return (
    <View style={styles.sparkline}>
      {values.map((value, index) => {
        const h = 6 + ((value - min) / span) * 28;
        return <View key={`${index}-${value}`} style={[styles.sparkBar, { height: h }, positive ? styles.sparkUp : styles.sparkDown]} />;
      })}
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
          <View style={styles.brandOrb}><Text style={styles.brandOrbText}>M</Text></View>
          <Text style={styles.loadingTitle}>MINTED</Text>
          <Text style={styles.muted}>Building your empire…</Text>
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
        <View style={styles.topBrand}>
          <View style={styles.logoMini}><Text style={styles.logoMiniText}>M</Text></View>
          <View>
            <Text style={styles.topKicker}>MINTED</Text>
            <Text style={styles.topLevel}>LEVEL {game.level} · REP {game.reputation}</Text>
          </View>
        </View>
        <View style={styles.topMoney}>
          <Text style={styles.topBalance}>{money(game.netWorth)}</Text>
          <Text style={styles.topIncome}>+{money(game.passivePerSec, true)}/s</Text>
        </View>
      </View>

      <View style={styles.body}>
        {tab === 'Empire' && <Empire game={game} setTab={setTab} />}
        {tab === 'Markets' && <Markets game={game} />}
        {tab === 'Ventures' && <Ventures game={game} />}
        {tab === 'Assets' && <Assets game={game} />}
        {tab === 'Earn' && <Earn game={game} />}
      </View>

      <View style={styles.nav}>
        {NAV.map(([name, icon]) => {
          const active = tab === name;
          return (
            <Pressable key={name} onPress={() => { Haptics.selectionAsync(); setTab(name); }} style={styles.navItem}>
              <View style={[styles.navIconWrap, active && styles.navIconWrapActive]}>
                <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
              </View>
              <Text style={[styles.navText, active && styles.navTextActive]}>{name}</Text>
            </Pressable>
          );
        })}
      </View>

      <Modal transparent animationType="fade" visible={offlineVisible && game.offlineEarnings > 0} onRequestClose={closeOffline}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalGlyph}><Text style={styles.modalGlyphText}>↗</Text></View>
            <Text style={styles.eyebrow}>WHILE YOU WERE AWAY</Text>
            <Text style={styles.modalMoney}>+{money(game.offlineEarnings)}</Text>
            <Text style={styles.modalBody}>Your empire kept working for you. Minted banks up to eight hours of offline income.</Text>
            <Button label="Collect everything" onPress={closeOffline} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function Empire({ game, setTab }) {
  const nextGoal = useMemo(() => {
    const milestones = [1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000];
    return milestones.find((goal) => game.netWorth < goal) || Math.pow(10, Math.ceil(Math.log10(game.netWorth + 1)));
  }, [game.netWorth]);
  const progress = Math.min(1, game.netWorth / nextGoal);
  const eventTone = game.event?.type === 'bull' ? 'green' : game.event?.type === 'bear' ? 'red' : 'normal';

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>YOUR EMPIRE</Text>
        <Text style={styles.heroMoney}>{money(game.netWorth)}</Text>
        <Text style={styles.heroLabel}>net worth</Text>
        <View style={styles.heroMetrics}>
          <Metric label="CASH" value={money(game.balance)} />
          <Metric label="PASSIVE" value={`+${money(game.passivePerSec, true)}/s`} accent />
          <Metric label="PRESTIGE" value={String(game.prestige)} />
        </View>
      </View>

      <Card style={styles.newsCard}>
        <View style={styles.rowBetween}>
          <View style={styles.newsIcon}><Text style={styles.newsIconText}>{game.event?.icon || '◈'}</Text></View>
          <View style={{ flex: 1 }}>
            <View style={styles.rowStart}>
              <Text style={styles.cardTitle}>{game.event?.title || 'Market pulse'}</Text>
              <Tag tone={eventTone}>{game.event?.sector || 'ALL'}</Tag>
            </View>
            <Text style={styles.cardBody}>{game.event?.body || 'Markets are moving.'}</Text>
          </View>
        </View>
      </Card>

      <Card>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.eyebrow}>NEXT MILESTONE</Text>
            <Text style={styles.cardTitle}>{money(nextGoal)} empire</Text>
          </View>
          <Text style={styles.progressPct}>{Math.floor(progress * 100)}%</Text>
        </View>
        <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
      </Card>

      <Section title="Missions" caption="Tiny objectives, very real money." />
      {game.missionProgress.filter((mission) => !mission.claimed).slice(0, 3).map((mission) => {
        const missionPct = Math.min(1, mission.progress / mission.target);
        return (
          <Card key={mission.id} style={styles.missionCard}>
            <View style={styles.rowBetween}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{mission.title}</Text>
                <Text style={styles.cardBody}>{mission.body}</Text>
              </View>
              <Text style={styles.reward}>+{money(mission.reward)}</Text>
            </View>
            <View style={styles.missionFooter}>
              <View style={[styles.progressTrack, { flex: 1, marginTop: 0 }]}><View style={[styles.progressFill, { width: `${missionPct * 100}%` }]} /></View>
              <Button compact label={mission.complete ? 'Claim' : `${Math.floor(missionPct * 100)}%`} disabled={!mission.complete} onPress={() => game.claimMission(mission.id)} />
            </View>
          </Card>
        );
      })}

      <Section title="Portfolio" caption="Where the empire actually lives." />
      <Card>
        <PortfolioRow label="Cash" icon="●" value={game.balance} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Businesses" icon="▦" value={game.businessValue} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Property" icon="⌂" value={game.propertyValue} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Markets" icon="↗" value={game.marketValue} total={game.netWorth + game.taxDue} />
        <PortfolioRow label="Lifestyle" icon="◆" value={game.assetValue} total={game.netWorth + game.taxDue} last />
      </Card>

      {game.taxDue > 0 && (
        <Card style={styles.taxCard}>
          <View style={styles.rowBetween}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>TAX OFFICE</Text>
              <Text style={styles.cardTitle}>{money(game.taxDue)} due</Text>
              <Text style={styles.cardBody}>The boring boss battle. Clear it before the number gets ugly.</Text>
            </View>
            <Button compact label="Pay" onPress={game.payTaxes} disabled={game.balance <= 0} />
          </View>
        </Card>
      )}

      <Section title="Move fast" />
      <View style={styles.quickGrid}>
        <Quick icon="↗" title="Trade" body={money(game.marketValue)} onPress={() => setTab('Markets')} />
        <Quick icon="▦" title="Build" body={`${game.businesses.length} companies`} onPress={() => setTab('Ventures')} />
        <Quick icon="◆" title="Own" body={`${game.assets.length} flexes`} onPress={() => setTab('Assets')} />
        <Quick icon="✦" title="Grind" body={`${money(game.clickValue)} base tap`} onPress={() => setTab('Earn')} />
      </View>
    </ScrollView>
  );
}

function PortfolioRow({ label, icon, value, total, last }) {
  const share = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  return (
    <View style={[styles.portfolioRow, last && styles.noBorder]}>
      <View style={styles.portfolioIcon}><Text style={styles.portfolioIconText}>{icon}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.portfolioName}>{label}</Text>
          <Text style={styles.portfolioValue}>{money(value)}</Text>
        </View>
        <View style={styles.miniTrack}><View style={[styles.miniFill, { width: `${share * 100}%` }]} /></View>
      </View>
    </View>
  );
}

function Quick({ icon, title, body, onPress }) {
  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.quick, pressed && styles.pressed]}>
      <Text style={styles.quickIcon}>{icon}</Text>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickBody}>{body}</Text>
    </Pressable>
  );
}

function Markets({ game }) {
  const [segment, setSegment] = useState('Stocks');
  const [quantity, setQuantity] = useState(1);
  const items = segment === 'Stocks' ? game.stocks : game.crypto;
  const holdings = segment === 'Stocks' ? game.stockValue : game.cryptoValue;
  const unitKey = segment === 'Stocks' ? 'shares' : 'units';
  const buy = segment === 'Stocks' ? game.buyStock : game.buyCrypto;
  const sell = segment === 'Stocks' ? game.sellStock : game.sellCrypto;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Header eyebrow="LIVE TERMINAL" title="Markets" body="News now pushes sectors around, price history is visible, and you can size trades instead of buying one sad share at a time." />

      <Card style={styles.summaryCard}>
        <Text style={styles.eyebrow}>INVESTED</Text>
        <Text style={styles.summaryMoney}>{money(game.marketValue)}</Text>
        <View style={styles.summaryMetrics}>
          <Metric label="STOCKS" value={money(game.stockValue)} />
          <Metric label="CRYPTO" value={money(game.cryptoValue)} />
          <Metric label="DIVIDENDS" value={`+${money(game.dividendIncomePerSec, true)}/s`} accent />
        </View>
      </Card>

      <Segmented options={['Stocks', 'Crypto']} value={segment} onChange={setSegment} />
      <View style={styles.tradeToolbar}>
        <Text style={styles.toolbarText}>{money(holdings)} in {segment.toLowerCase()}</Text>
        <View style={styles.qtyRow}>
          {[1, 5, 10].map((qty) => (
            <Pressable key={qty} onPress={() => setQuantity(qty)} style={[styles.qty, quantity === qty && styles.qtyActive]}>
              <Text style={[styles.qtyText, quantity === qty && styles.qtyTextActive]}>×{qty}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {items.map((item) => {
        const owned = item[unitKey] || 0;
        const value = owned * item.price;
        const gain = item.avgCost > 0 ? ((item.price - item.avgCost) / item.avgCost) * 100 : 0;
        const positive = item.changePct >= 0;
        return (
          <Card key={item.id} style={styles.marketCard}>
            <View style={styles.marketTop}>
              <View style={styles.marketIdentity}>
                <View style={styles.marketIcon}><Text style={styles.marketIconText}>{item.icon}</Text></View>
                <View>
                  <Text style={styles.marketSymbol}>{item.symbol}</Text>
                  <Text style={styles.marketName}>{item.name}</Text>
                </View>
              </View>
              <View style={styles.marketPriceWrap}>
                <Text style={styles.marketPrice}>{money(item.price, true)}</Text>
                <Text style={[styles.marketChange, positive ? styles.green : styles.red]}>{pct(item.changePct)}</Text>
              </View>
            </View>

            <Sparkline history={item.history} positive={positive} />

            <View style={styles.holdingStrip}>
              <View><Text style={styles.tinyLabel}>YOU OWN</Text><Text style={styles.holdingValue}>{owned} · {money(value)}</Text></View>
              <View style={styles.alignRight}><Text style={styles.tinyLabel}>ALL-TIME</Text><Text style={[styles.holdingValue, gain >= 0 ? styles.green : styles.red]}>{owned > 0 ? pct(gain) : '—'}</Text></View>
            </View>
            <View style={styles.buttonRow}>
              <Button secondary label={`Sell ×${quantity}`} disabled={owned <= 0} onPress={() => sell(item.id, quantity)} />
              <Button label={`Buy ×${quantity}`} disabled={game.balance < item.price * quantity} onPress={() => buy(item.id, quantity)} />
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

function Ventures({ game }) {
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Header eyebrow="BUILD MODE" title="Ventures" body="Acquire companies, expand locations, then upgrade the machine. More units create scale. Levels create margin." />

      <Card style={styles.summaryCard}>
        <Text style={styles.eyebrow}>BUSINESS EMPIRE</Text>
        <Text style={styles.summaryMoney}>{money(game.businessValue)}</Text>
        <View style={styles.summaryMetrics}>
          <Metric label="OWNED" value={String(game.businesses.length)} />
          <Metric label="INCOME" value={`+${money(game.businessIncomePerSec, true)}/s`} accent />
          <Metric label="REP" value={String(game.reputation)} />
        </View>
      </Card>

      <Section title="Your companies" caption={game.businesses.length ? 'Scale what is working.' : 'Acquire your first business below.'} />
      {game.businesses.map((business) => (
        <Card key={business.id} style={styles.businessCard}>
          <View style={styles.rowBetween}>
            <View style={styles.businessIdentity}>
              <View style={styles.businessIcon}><Text style={styles.businessIconText}>{business.icon}</Text></View>
              <View>
                <Text style={styles.cardTitle}>{business.name}</Text>
                <Text style={styles.cardBody}>{business.industry} · {business.risk || 'Medium'} risk</Text>
              </View>
            </View>
            <Tag tone="green">+{money(business.incomePerSec, true)}/s</Tag>
          </View>
          <View style={styles.businessStats}>
            <Metric label="UNITS" value={String(business.units)} />
            <Metric label="LEVEL" value={String(business.level)} />
            <Metric label="VALUE" value={money(business.value)} />
          </View>
          <View style={styles.buttonRow}>
            <Button secondary label={`Expand ${money(business.unitCost)}`} disabled={game.balance < business.unitCost} onPress={() => game.expandBusiness(business.id)} />
            <Button label={`Upgrade ${money(business.upgradeCost)}`} disabled={game.balance < business.upgradeCost} onPress={() => game.upgradeBusiness(business.id)} />
          </View>
        </Card>
      ))}

      <Section title="Acquisitions" caption="New categories unlock as your net worth climbs." />
      {game.businessCatalog.filter((item) => !game.businesses.some((owned) => owned.id === item.id)).map((item) => (
        <Card key={item.id} style={!item.unlocked && styles.lockedCard}>
          <View style={styles.rowBetween}>
            <View style={styles.businessIdentity}>
              <View style={styles.businessIcon}><Text style={styles.businessIconText}>{item.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardBody}>{item.industry} · {item.risk} risk · +{money(item.baseIncome, true)}/s</Text>
              </View>
            </View>
            <Text style={styles.priceStrong}>{money(item.cost)}</Text>
          </View>
          <Button label={item.unlocked ? 'Acquire' : 'Locked'} disabled={!item.unlocked || game.balance < item.cost} onPress={() => game.buyBusiness(item.id)} />
        </Card>
      ))}
    </ScrollView>
  );
}

function Assets({ game }) {
  const [segment, setSegment] = useState('Property');
  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <Header eyebrow="OWN THINGS" title="Assets" body="Property pays you. Lifestyle assets do not. That is precisely why buying them is fun." />
      <Segmented options={['Property', 'Lifestyle']} value={segment} onChange={setSegment} />

      {segment === 'Property' ? (
        <>
          <Card style={styles.summaryCard}>
            <Text style={styles.eyebrow}>REAL ESTATE</Text>
            <Text style={styles.summaryMoney}>{money(game.propertyValue)}</Text>
            <View style={styles.summaryMetrics}>
              <Metric label="RENT" value={`+${money(game.propertyIncomePerSec, true)}/s`} accent />
              <Metric label="OWNED TYPES" value={String(game.properties.length)} />
            </View>
          </Card>
          <Section title="Property market" />
          {game.propertyCatalog.map((item) => {
            const owned = game.properties.find((property) => property.id === item.id);
            return (
              <Card key={item.id} style={!item.unlocked && styles.lockedCard}>
                <View style={styles.rowBetween}>
                  <View style={styles.businessIdentity}>
                    <View style={styles.businessIcon}><Text style={styles.businessIconText}>{item.icon}</Text></View>
                    <View>
                      <Text style={styles.cardTitle}>{item.name}</Text>
                      <Text style={styles.cardBody}>{item.location} · +{money(item.rentPerSec, true)}/s each</Text>
                    </View>
                  </View>
                  {!!owned && <Tag tone="green">×{owned.count}</Tag>}
                </View>
                <View style={styles.rowBetween}>
                  <Text style={styles.priceStrong}>{money(item.cost)}</Text>
                  <Button compact label={item.unlocked ? 'Buy' : 'Locked'} disabled={!item.unlocked || game.balance < item.cost} onPress={() => game.buyProperty(item.id)} />
                </View>
              </Card>
            );
          })}
        </>
      ) : (
        <>
          <Card style={styles.summaryCard}>
            <Text style={styles.eyebrow}>LIFESTYLE</Text>
            <Text style={styles.summaryMoney}>{money(game.assetValue)}</Text>
            <View style={styles.summaryMetrics}>
              <Metric label="PRESTIGE" value={String(game.prestige)} accent />
              <Metric label="COLLECTION" value={`${game.assets.length}/${game.assetCatalog.length}`} />
            </View>
          </Card>
          <Section title="The unnecessary section" caption="Financially questionable. Spiritually essential." />
          {game.assetCatalog.map((item) => (
            <Card key={item.id} style={!item.unlocked && styles.lockedCard}>
              <View style={styles.rowBetween}>
                <View style={styles.businessIdentity}>
                  <View style={styles.businessIcon}><Text style={styles.businessIconText}>{item.icon}</Text></View>
                  <View>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardBody}>+{item.prestige} prestige</Text>
                  </View>
                </View>
                {item.owned ? <Tag tone="green">OWNED</Tag> : <Text style={styles.priceStrong}>{money(item.cost)}</Text>}
              </View>
              {!item.owned && <Button label={item.unlocked ? 'Buy it' : 'Locked'} disabled={!item.unlocked || game.balance < item.cost} onPress={() => game.buyAsset(item.id)} />}
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
      <Header eyebrow="ACTIVE INCOME" title="Earn" body="Tap combos now ramp up your payout. Critical hits can pay 5×, and reputation quietly improves your crit chance." />

      <View style={styles.tapArena}>
        <Text style={styles.tapKicker}>COMBO ×{game.combo || 0}</Text>
        <Pressable
          onPress={() => {
            game.tap();
            Haptics.impactAsync(game.lastTapCritical ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light);
          }}
          style={({ pressed }) => [styles.tapOrb, pressed && styles.tapOrbPressed]}
        >
          <Text style={styles.tapOrbGlyph}>M</Text>
          <Text style={styles.tapOrbValue}>+{money(game.clickValue)}</Text>
          <Text style={styles.tapOrbLabel}>BASE TAP</Text>
        </Pressable>
        <Text style={[styles.tapReward, game.lastTapCritical && styles.gold]}>
          {game.lastTapReward > 0 ? `${game.lastTapCritical ? 'CRITICAL ' : ''}+${money(game.lastTapReward)}` : 'Tap to earn'}
        </Text>
      </View>

      <Card>
        <View style={styles.rowBetween}>
          <View style={{ flex: 1 }}>
            <Text style={styles.eyebrow}>TAP UPGRADE</Text>
            <Text style={styles.cardTitle}>{game.maxClick ? 'Maximum power' : `${money(game.clickValue)} → ${money(game.nextClickValue)}`}</Text>
            <Text style={styles.cardBody}>{game.totalClicks.toLocaleString()} lifetime taps</Text>
          </View>
          {!game.maxClick && <Button compact label={money(game.clickUpgradeCost)} disabled={!game.canBuyClick} onPress={game.buyClickUpgrade} />}
        </View>
      </Card>

      <Section title="Career" caption={`Current: ${activeJob?.name || 'None'} · +${money(game.jobIncomePerSec, true)}/s`} />
      {game.jobs.map((job) => {
        const unlocked = game.netWorth >= job.unlockNetWorth;
        const active = game.activeJobId === job.id;
        return (
          <Card key={job.id} style={[!unlocked && styles.lockedCard, active && styles.activeCard]}>
            <View style={styles.rowBetween}>
              <View style={styles.businessIdentity}>
                <View style={styles.businessIcon}><Text style={styles.businessIconText}>{job.icon}</Text></View>
                <View>
                  <Text style={styles.cardTitle}>{job.name}</Text>
                  <Text style={styles.cardBody}>+{money(job.incomePerSec, true)}/s · unlock {money(job.unlockNetWorth)}</Text>
                </View>
              </View>
              {active ? <Tag tone="green">ACTIVE</Tag> : <Button compact label={unlocked ? 'Take job' : 'Locked'} disabled={!unlocked} onPress={() => game.takeJob(job.id)} />}
            </View>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#070A0D' },
  body: { flex: 1 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 34 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  brandOrb: { width: 72, height: 72, borderRadius: 24, backgroundColor: '#B8FF59', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  brandOrbText: { color: '#071007', fontWeight: '900', fontSize: 34 },
  loadingTitle: { color: '#F7F9FA', fontSize: 24, fontWeight: '900', letterSpacing: 4 },
  muted: { color: '#7E8992', fontSize: 14 },

  topbar: { minHeight: 68, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#151B20', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#090D10' },
  topBrand: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoMini: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#B8FF59', alignItems: 'center', justifyContent: 'center' },
  logoMiniText: { color: '#071007', fontSize: 16, fontWeight: '900' },
  topKicker: { color: '#F5F7F8', fontSize: 12, fontWeight: '900', letterSpacing: 1.8 },
  topLevel: { color: '#6F7A83', fontSize: 9, fontWeight: '800', letterSpacing: 0.8, marginTop: 2 },
  topMoney: { alignItems: 'flex-end' },
  topBalance: { color: '#F8FAFB', fontSize: 18, fontWeight: '900' },
  topIncome: { color: '#B8FF59', fontSize: 11, fontWeight: '800', marginTop: 1 },

  nav: { height: 72, borderTopWidth: 1, borderTopColor: '#171D22', backgroundColor: '#090D10', flexDirection: 'row', paddingHorizontal: 4, paddingTop: 7, paddingBottom: 6 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIconWrap: { width: 32, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  navIconWrapActive: { backgroundColor: '#B8FF59' },
  navIcon: { color: '#6D7881', fontWeight: '900', fontSize: 16 },
  navIconActive: { color: '#071007' },
  navText: { color: '#68737C', fontSize: 9, fontWeight: '800', marginTop: 3 },
  navTextActive: { color: '#EAF9D7' },

  headerWrap: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 4, marginBottom: 18 },
  eyebrow: { color: '#77828B', fontWeight: '900', fontSize: 10, letterSpacing: 1.5, marginBottom: 5 },
  pageTitle: { color: '#F7F9FA', fontSize: 34, lineHeight: 38, fontWeight: '900', letterSpacing: -1.3 },
  pageBody: { color: '#85919A', fontSize: 13, lineHeight: 19, marginTop: 7, maxWidth: 560 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 23, marginBottom: 9 },
  sectionTitle: { color: '#F2F5F6', fontWeight: '900', fontSize: 17 },
  sectionCaption: { color: '#707C85', fontSize: 11, lineHeight: 15, marginTop: 3 },

  card: { backgroundColor: '#0E1418', borderWidth: 1, borderColor: '#1B242A', borderRadius: 18, padding: 15, marginBottom: 10 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  lockedCard: { opacity: 0.48 },
  activeCard: { borderColor: '#6D9D33', backgroundColor: '#101A12' },
  cardTitle: { color: '#F2F5F6', fontWeight: '900', fontSize: 14 },
  cardBody: { color: '#79858E', fontSize: 11, lineHeight: 16, marginTop: 3 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  rowStart: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  alignRight: { alignItems: 'flex-end' },

  hero: { backgroundColor: '#111A13', borderRadius: 24, borderWidth: 1, borderColor: '#243425', padding: 18, marginBottom: 10, overflow: 'hidden' },
  heroEyebrow: { color: '#92B56C', fontSize: 10, fontWeight: '900', letterSpacing: 1.8 },
  heroMoney: { color: '#F6FFE9', fontSize: 42, lineHeight: 48, fontWeight: '900', letterSpacing: -2.1, marginTop: 5 },
  heroLabel: { color: '#78905F', fontSize: 12, fontWeight: '700' },
  heroMetrics: { flexDirection: 'row', marginTop: 20, gap: 8 },
  metric: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#66727B', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  metricValue: { color: '#E7ECEF', fontSize: 13, fontWeight: '900', marginTop: 4 },
  green: { color: '#B8FF59' },
  red: { color: '#FF6B6B' },
  gold: { color: '#FFD66B' },

  newsCard: { backgroundColor: '#111318' },
  newsIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#181E23', alignItems: 'center', justifyContent: 'center' },
  newsIconText: { fontSize: 20 },
  tag: { backgroundColor: '#1A2025', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  tagText: { color: '#96A0A7', fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  tagGreen: { backgroundColor: '#1A2818' },
  tagGreenText: { color: '#B8FF59' },
  tagRed: { backgroundColor: '#2A1818' },
  tagRedText: { color: '#FF7777' },

  progressPct: { color: '#B8FF59', fontSize: 18, fontWeight: '900' },
  progressTrack: { height: 7, backgroundColor: '#1A2227', borderRadius: 999, overflow: 'hidden', marginTop: 12 },
  progressFill: { height: '100%', backgroundColor: '#B8FF59', borderRadius: 999 },
  missionCard: { paddingBottom: 13 },
  missionFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 12 },
  reward: { color: '#B8FF59', fontWeight: '900', fontSize: 12 },

  portfolioRow: { flexDirection: 'row', alignItems: 'center', gap: 11, borderBottomWidth: 1, borderBottomColor: '#192126', paddingVertical: 11 },
  noBorder: { borderBottomWidth: 0, paddingBottom: 0 },
  portfolioIcon: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#171E23', alignItems: 'center', justifyContent: 'center' },
  portfolioIconText: { color: '#A6B0B7', fontWeight: '900' },
  portfolioName: { color: '#DDE3E6', fontSize: 12, fontWeight: '800' },
  portfolioValue: { color: '#F7F9FA', fontSize: 12, fontWeight: '900' },
  miniTrack: { height: 4, backgroundColor: '#192126', borderRadius: 999, marginTop: 7, overflow: 'hidden' },
  miniFill: { height: '100%', backgroundColor: '#728A59', borderRadius: 999 },
  taxCard: { borderColor: '#4B2A2A', backgroundColor: '#171111' },

  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  quick: { width: '48.5%', minHeight: 105, backgroundColor: '#0E1418', borderWidth: 1, borderColor: '#1B242A', borderRadius: 18, padding: 14 },
  quickIcon: { color: '#B8FF59', fontSize: 18, fontWeight: '900' },
  quickTitle: { color: '#F2F5F6', fontSize: 14, fontWeight: '900', marginTop: 13 },
  quickBody: { color: '#758089', fontSize: 10, marginTop: 4 },

  summaryCard: { backgroundColor: '#11161A' },
  summaryMoney: { color: '#F7FAFB', fontSize: 34, fontWeight: '900', letterSpacing: -1.3 },
  summaryMetrics: { flexDirection: 'row', gap: 10, marginTop: 15 },
  segmented: { flexDirection: 'row', padding: 4, backgroundColor: '#0D1216', borderRadius: 14, borderWidth: 1, borderColor: '#1A2227', marginBottom: 12 },
  segment: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: '#1D272D' },
  segmentText: { color: '#6D7881', fontSize: 11, fontWeight: '900' },
  segmentTextActive: { color: '#E8EEF1' },

  tradeToolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  toolbarText: { color: '#7E8992', fontSize: 11, fontWeight: '700' },
  qtyRow: { flexDirection: 'row', gap: 5 },
  qty: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: '#11171B', borderWidth: 1, borderColor: '#1D252B' },
  qtyActive: { backgroundColor: '#B8FF59', borderColor: '#B8FF59' },
  qtyText: { color: '#77828A', fontSize: 9, fontWeight: '900' },
  qtyTextActive: { color: '#071007' },

  marketCard: { padding: 14 },
  marketTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marketIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  marketIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#172027', alignItems: 'center', justifyContent: 'center' },
  marketIconText: { color: '#C7D1D7', fontSize: 15, fontWeight: '900' },
  marketSymbol: { color: '#F4F7F8', fontWeight: '900', fontSize: 14 },
  marketName: { color: '#6F7A83', fontSize: 10, marginTop: 2 },
  marketPriceWrap: { alignItems: 'flex-end' },
  marketPrice: { color: '#F5F7F8', fontWeight: '900', fontSize: 14 },
  marketChange: { fontSize: 10, fontWeight: '900', marginTop: 3 },
  sparkline: { height: 42, flexDirection: 'row', alignItems: 'flex-end', gap: 3, marginVertical: 13, paddingHorizontal: 2 },
  sparkBar: { flex: 1, borderRadius: 3, minWidth: 2 },
  sparkUp: { backgroundColor: '#6F9A3E' },
  sparkDown: { backgroundColor: '#934A4A' },
  holdingStrip: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#1A2227', paddingTop: 10, marginTop: 1 },
  tinyLabel: { color: '#626E76', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  holdingValue: { color: '#D8DEE2', fontSize: 11, fontWeight: '900', marginTop: 3 },

  businessCard: { padding: 14 },
  businessIdentity: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  businessIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#171E23', alignItems: 'center', justifyContent: 'center' },
  businessIconText: { fontSize: 19 },
  businessStats: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1B2328', paddingVertical: 11, marginVertical: 12 },
  priceStrong: { color: '#F2F5F6', fontWeight: '900', fontSize: 13 },

  buttonRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  button: { flex: 1, minHeight: 42, borderRadius: 12, backgroundColor: '#B8FF59', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  buttonSecondary: { backgroundColor: '#172027', borderWidth: 1, borderColor: '#273139' },
  buttonCompact: { flex: 0, minHeight: 34, paddingHorizontal: 13, borderRadius: 10 },
  buttonText: { color: '#071007', fontWeight: '900', fontSize: 11 },
  buttonTextSecondary: { color: '#CFD8DD' },
  disabled: { opacity: 0.32 },

  tapArena: { alignItems: 'center', paddingVertical: 18, marginBottom: 8 },
  tapKicker: { color: '#70805F', fontWeight: '900', letterSpacing: 1.6, fontSize: 10, marginBottom: 12 },
  tapOrb: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#B8FF59', alignItems: 'center', justifyContent: 'center', borderWidth: 10, borderColor: '#1A2516' },
  tapOrbPressed: { transform: [{ scale: 0.96 }] },
  tapOrbGlyph: { color: '#091108', fontSize: 50, fontWeight: '900', lineHeight: 54 },
  tapOrbValue: { color: '#091108', fontSize: 22, fontWeight: '900', marginTop: 3 },
  tapOrbLabel: { color: '#37501E', fontSize: 8, fontWeight: '900', letterSpacing: 1.5, marginTop: 3 },
  tapReward: { color: '#9EAA95', fontWeight: '900', fontSize: 13, marginTop: 13, minHeight: 18 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.78)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#10161A', borderRadius: 24, borderWidth: 1, borderColor: '#253039', padding: 22 },
  modalGlyph: { width: 50, height: 50, borderRadius: 16, backgroundColor: '#B8FF59', alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  modalGlyphText: { color: '#071007', fontSize: 23, fontWeight: '900' },
  modalMoney: { color: '#F5FBEF', fontSize: 38, fontWeight: '900', letterSpacing: -1.5 },
  modalBody: { color: '#849099', fontSize: 13, lineHeight: 19, marginTop: 8, marginBottom: 18 },
});
