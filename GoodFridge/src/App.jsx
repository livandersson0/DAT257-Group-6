import { useState, useEffect } from 'react'
import './App.css'
import { searchProducts } from "./api/products";
import Logo from './assets/Logo.png'

// ── helpers ────────────────────────────────────────────────────────────────

function offsetDate(days) {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

function daysLeft(dateStr) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(dateStr)
  exp.setHours(0, 0, 0, 0)
  return Math.round((exp - today) / 86400000)
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
  })
}

function getBadge(days) {
  if (days < 0) return { cls: 'badge-expired', text: 'Utgången' }
  if (days === 0) return { cls: 'badge-urgent', text: 'Idag!' }
  if (days <= 2) return { cls: 'badge-urgent', text: `${days} dag${days === 1 ? '' : 'ar'}` }
  if (days <= 5) return { cls: 'badge-soon', text: `${days} dagar` }
  return { cls: 'badge-ok', text: `${days} dagar` }
}

function locationLabel(loc) {
  return { fridge: 'Kyl', freezer: 'Frys', pantry: 'Skafferi' }[loc] || loc
}

const SAMPLE_PRODUCTS = [
  { id: 1, name: 'Mjölk',        date: offsetDate(1),  location: 'fridge'  },
  { id: 2, name: 'Yoghurt',      date: offsetDate(3),  location: 'fridge'  },
  { id: 3, name: 'Morötter',     date: offsetDate(7),  location: 'fridge'  },
  { id: 4, name: 'Kycklingfilé', date: offsetDate(-1), location: 'freezer' },
  { id: 5, name: 'Pasta',        date: offsetDate(30), location: 'pantry'  },
  { id: 6, name: 'Ägg',          date: offsetDate(5),  location: 'fridge'  },
  { id: 7, name: 'Cheddar',      date: offsetDate(2),  location: 'fridge'  },
]

// ── sub-components ─────────────────────────────────────────────────────────

function ProductItem({ product, onDelete }) {
  const days = daysLeft(product.date)
  const badge = getBadge(days)
  return (
    <div className="product-item">
      <div className="product-img-wrap">
        {product.image
          ? <img src={product.image} alt={product.name} className="product-img" />
          : <div className="product-img-placeholder" />
        }
      </div>
      <div className="product-info">
        <div className="product-name">{product.name}</div>
        <div className="product-sub">
          {formatDate(product.date)} ·{' '}
          <span className="location-pill">{locationLabel(product.location)}</span>
        </div>
      </div>
      <span className={`badge ${badge.cls}`}>{badge.text}</span>
      {onDelete && (
        <button className="delete-btn" onClick={() => onDelete(product.id)} title="Ta bort">
          ✕
        </button>
      )}
    </div>
  )
}

// ── tabs ───────────────────────────────────────────────────────────────────

function OverviewTab({ products }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const DAYS = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().slice(0, 10)
    const expiring = products.filter(p => p.date === dateStr)
    return { d, dateStr, expiring, isToday: i === 0 }
  })

  const urgentList = products
    .filter(p => { const dl = daysLeft(p.date); return dl >= 0 && dl <= 5 })
    .sort((a, b) => daysLeft(a.date) - daysLeft(b.date))

  const statTotal  = products.length
  const statUrgent = products.filter(p => { const dl = daysLeft(p.date); return dl >= 0 && dl <= 2 }).length
  const statOk     = products.filter(p => daysLeft(p.date) > 2).length

  return (
    <div>
      <h2 className="section-title">Nästa 7 dagarna</h2>
      <div className="week-grid">
        {week.map(({ d, dateStr, expiring, isToday }) => (
          <div key={dateStr} className={`day-card${isToday ? ' today' : ''}`}>
            <div className="day-label">{DAYS[(d.getDay() + 6) % 7]}</div>
            <div className="day-date">{d.getDate()}</div>
            {expiring.length > 0 && (
              <>
                <div className="day-dot" />
                <div className="day-count">{expiring.length} vara{expiring.length > 1 ? 'r' : ''}</div>
              </>
            )}
          </div>
        ))}
      </div>

      <h2 className="section-title">Statistik</h2>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{statTotal}</div>
          <div className="stat-label">varor totalt</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--red-400)' }}>{statUrgent}</div>
          <div className="stat-label">går ut snart (≤2 dagar)</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: 'var(--green-400)' }}>{statOk}</div>
          <div className="stat-label">i bra skick</div>
        </div>
      </div>

      <h2 className="section-title">Utgår snart</h2>
      <div className="product-list">
        {urgentList.length === 0 ? (
          <div className="empty"><div className="empty-icon">🎉</div>Inga varor som snart går ut!</div>
        ) : (
          urgentList.map(p => <ProductItem key={p.id} product={p} />)
        )}
      </div>
    </div>
  )
}

function FridgeTab({ products, onDelete }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort]     = useState('expiry')

  const FILTERS = [
    { key: 'all',     label: 'Alla'        },
    { key: 'fridge',  label: '🧊 Kyl'      },
    { key: 'freezer', label: '❄️ Frys'     },
    { key: 'pantry',  label: '🗄️ Skafferi' },
  ]

  const visible = products
    .filter(p => filter === 'all' || p.location === filter)
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'expiry')   return daysLeft(a.date) - daysLeft(b.date)
      if (sort === 'name')     return a.name.localeCompare(b.name)
      if (sort === 'location') return a.location.localeCompare(b.location)
      return 0
    })

  return (
    <div>
      <div className="search-row">
        <input
          type="text"
          placeholder="Sök vara…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="search-input"
        />
        <select value={sort} onChange={e => setSort(e.target.value)} className="filter-btn">
          <option value="expiry">Utgångsdatum</option>
          <option value="name">Namn (A–Ö)</option>
          <option value="location">Plats</option>
        </select>
      </div>
      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
        <button className="filter-btn" onClick={() => { setSort('expiry'); setSearch(''); setFilter('all') }}>
          Återställ
        </button>
      </div>
      <div className="product-list">
        {visible.length === 0 ? (
          <div className="empty"><div className="empty-icon">📭</div>Inga varor hittades.</div>
        ) : (
          visible.map(p => <ProductItem key={p.id} product={p} onDelete={onDelete} />)
        )}
      </div>
    </div>
  )
}

function AddTab({ onAdd, recentProducts, onDelete, settings }) {
  const today = new Date().toISOString().slice(0, 10)
  const [name,      setName]      = useState('')
  const [date,      setDate]      = useState(today)
  const [location,  setLocation]  = useState(settings.defaultLocation)
  const [msg,       setMsg]       = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setLocation(settings.defaultLocation)
  }, [settings.defaultLocation])

  async function handleAdd() {
    if (!name.trim() || !date) {
      setMsg({ type: 'error', text: 'Fyll i namn och datum.' })
      return
    }

    setSearching(true)
    let foundImage = null

    try {
      const results = await searchProducts(name.trim())
      if (results && results[0]?.image) {
        foundImage = results[0].image
      }
    } catch (e) {
      console.error('Kunde inte hämta bild:', e)
    }

    setSearching(false)
    onAdd({ name: name.trim(), date, location, image: foundImage })
    setMsg({ type: 'ok', text: `✓ ${name.trim()} tillagd!` })
    setName('')
    setDate(today)
    setTimeout(() => setMsg(null), 2500)
  }

  return (
    <div>
      <h2 className="section-title">Lägg till vara</h2>
      <div className="add-form">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Produkt</label>
            <input
              type="text"
              placeholder="t.ex. Mjölk"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Utgångsdatum</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Plats</label>
            <select value={location} onChange={e => setLocation(e.target.value)}>
              <option value="fridge">🧊 Kyl</option>
              <option value="freezer">❄️ Frys</option>
              <option value="pantry">🗄️ Skafferi</option>
            </select>
          </div>
        </div>

        {searching && <p style={{ fontSize: 13, margin: '8px 0' }}>Söker bild…</p>}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="add-btn" onClick={handleAdd} disabled={searching}>
            {searching ? 'Söker…' : 'Lägg till vara'}
          </button>
          {msg && (
            <span style={{ fontSize: 13, color: msg.type === 'ok' ? 'var(--green-600)' : 'var(--red-600)' }}>
              {msg.text}
            </span>
          )}
        </div>
      </div>

      <h2 className="section-title" style={{ fontSize: 15 }}>Nyligen tillagda</h2>
      <div className="product-list">
        {recentProducts.length === 0
          ? <div className="empty">Inga varor ännu.</div>
          : recentProducts.slice(0, 5).map(p => (
              <ProductItem key={p.id} product={p} onDelete={onDelete} />
            ))
        }
      </div>
    </div>
  )
}

function NotificationBanner({ notifications, onDismiss, settings }) {
  useEffect(() => {
    if (notifications.length > 0 && settings?.soundEnabled) {
      const ctx = new AudioContext()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.4)
    }
  }, [notifications.length])

  if (notifications.length === 0) return null

  return (
    <div className="notif-banner">
      {notifications.map(p => (
        <div key={p.id} className="notif-item">
          <span>
            🔔 <strong>{p.name}</strong> går ut {formatDate(p.date)} ({daysLeft(p.date) === 0 ? 'idag' : `om ${daysLeft(p.date)} dag${daysLeft(p.date) === 1 ? '' : 'ar'}`})
          </span>
          <button onClick={() => onDismiss(p.id)}>✕</button>
        </div>
      ))}
    </div>
  )
}

function SettingsTab({ settings, onUpdate }) {
  return (
    <div>
      <h2 className="section-title">Notifikationer</h2>
      <div className="add-form">
        <label className="form-label">Notifiera mig när en vara går ut inom:</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
          {[1, 2, 3, 5, 7].map(d => (
            <button
              key={d}
              className={`filter-btn${settings.notifyDaysBefore === d ? ' active' : ''}`}
              onClick={() => onUpdate({ notifyDaysBefore: d })}
            >
              {d} dag{d === 1 ? '' : 'ar'}
            </button>
          ))}
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: 'var(--text-2)' }}>
          Du får notis om varor som går ut inom <strong>{settings.notifyDaysBefore} dagar</strong>.
        </p>
      </div>

      <h2 className="section-title">Ljud</h2>
      <div className="add-form">
        <div className="settings-row">
          <span className="form-label">Spela upp ljud vid notifikation</span>
          <button
            className={`toggle-btn${settings.soundEnabled ? ' on' : ''}`}
            onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
          >
            <div className="toggle-knob" />
          </button>
        </div>
      </div>

      <h2 className="section-title">Utseende</h2>
      <div className="add-form">
        <div className="settings-row">
          <span className="form-label">Mörkt läge</span>
          <button
            className={`toggle-btn${settings.darkMode ? ' on' : ''}`}
            onClick={() => onUpdate({ darkMode: !settings.darkMode })}
          >
            <div className="toggle-knob" />
          </button>
        </div>
      </div>

      <h2 className="section-title">Personalisering</h2>
      <div className="add-form">
        <div className="settings-row" style={{ marginBottom: 16 }}>
          <span className="form-label">Standardplats för nya varor</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['fridge','🧊 Kyl'], ['freezer','❄️ Frys'], ['pantry','🗄️ Skafferi']].map(([loc, label]) => (
              <button
                key={loc}
                className={`filter-btn${settings.defaultLocation === loc ? ' active' : ''}`}
                onClick={() => onUpdate({ defaultLocation: loc })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DeleteModal({ product, onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div style={{
        background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        padding: 28, maxWidth: 360, width: '90%', boxShadow: '0 8px 32px rgba(0,0,0,0.18)'
      }}>
        <h3 style={{ fontFamily: 'Fraunces, serif', marginBottom: 8 }}>Ta bort vara</h3>
        <p style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 20 }}>
          Vad hände med <strong>{product.name}</strong>?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button className="add-btn" style={{ background: 'var(--teal-400)' }} onClick={() => onConfirm('eaten')}>
            🍽️ Jag åt upp den
          </button>
          <button className="add-btn" style={{ background: 'var(--red-400)' }} onClick={() => onConfirm('wasted')}>
            🗑️ Jag slängde den
          </button>
          <button className="filter-btn" style={{ marginTop: 4 }} onClick={onCancel}>
            Avbryt
          </button>
        </div>
      </div>
    </div>
  )
}

// ── HistoryTab (ersätter WasteTab) ────────────────────────────────────────

function HistoryTab({ wasteLog }) {
  const [filter, setFilter] = useState('all')

  const FILTERS = [
    { key: 'all',    label: 'Alla'       },
    { key: 'eaten',  label: '🍽️ Uppätna'    },
    { key: 'wasted', label: '🗑️ Slängd' },
  ]

  const visible = wasteLog.filter(p => filter === 'all' || p.reason === filter)
  const totalEaten  = wasteLog.filter(p => p.reason === 'eaten').length
  const totalWasted = wasteLog.filter(p => p.reason === 'wasted').length

  return (
    <div>
      <h2 className="section-title">Historik</h2>

      {wasteLog.length > 0 && (
        <div className="stats-grid" style={{ marginBottom: 20 }}>
          <div className="stat-card">
            <div className="stat-num">{wasteLog.length}</div>
            <div className="stat-label">varor totalt</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--teal-400)' }}>{totalEaten}</div>
            <div className="stat-label">uppätna</div>
          </div>
          <div className="stat-card">
            <div className="stat-num" style={{ color: 'var(--red-400)' }}>{totalWasted}</div>
            <div className="stat-label">slängda</div>
          </div>
        </div>
      )}

      <div className="filter-row">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`filter-btn${filter === f.key ? ' active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty">
          <div className="empty-icon">{filter === 'wasted' ? '✅' : '📭'}</div>
          {filter === 'wasted' ? 'Inga slängda varor – bra jobbat!' : 'Ingen historik här ännu.'}
        </div>
      ) : (
        <div className="product-list">
          {visible.map((p, i) => (
            <div key={i} className="product-item">
              <div className="product-info">
                <div className="product-name">{p.name}</div>
                <div className="product-sub">
                  Utgick: {formatDate(p.date)} ·{' '}
                  <span className="location-pill">{locationLabel(p.location)}</span>
                  {' '}· {new Date(p.removedAt).toLocaleDateString('sv-SE')}
                </div>
              </div>
              {p.reason === 'eaten'
                ? <span className="badge badge-ok">🍽️ Åts upp</span>
                : <span className="badge badge-expired">🗑️ Slängt</span>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── main app ───────────────────────────────────────────────────────────────

export default function App() {
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('gf-products')
      return saved ? JSON.parse(saved) : SAMPLE_PRODUCTS
    } catch {
      return SAMPLE_PRODUCTS
    }
  })
  const [nextId, setNextId] = useState(() => {
    try {
      return Number(localStorage.getItem('gf-next-id') || '8')
    } catch {
      return 8
    }
  })
  const [tab, setTab] = useState('overview')

  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('gf-settings')
      return saved ? JSON.parse(saved) : { notifyDaysBefore: 2, soundEnabled: true, darkMode: false, defaultLocation: 'fridge' }
    } catch {
      return { notifyDaysBefore: 2, soundEnabled: true, darkMode: false, defaultLocation: 'fridge' }
    }
  })

  function updateSettings(patch) {
    setSettings(prev => ({ ...prev, ...patch }))
  }

  const [notifications, setNotifications] = useState([])
  const [dismissedIds, setDismissedIds] = useState(() => {
    try { return JSON.parse(localStorage.getItem('gf-dismissed') || '[]') }
    catch { return [] }
  })

  const [wasteLog, setWasteLog] = useState(() => {
    try {
      const saved = localStorage.getItem('gf-waste-log')
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [deleteModal, setDeleteModal] = useState(null)

  useEffect(() => {
    localStorage.setItem('gf-products', JSON.stringify(products))
    localStorage.setItem('gf-next-id', String(nextId))
  }, [products, nextId])

  useEffect(() => {
    localStorage.setItem('gf-waste-log', JSON.stringify(wasteLog))
  }, [wasteLog])

  useEffect(() => {
    localStorage.setItem('gf-settings', JSON.stringify(settings))
    document.body.classList.toggle('dark', settings.darkMode)
    const expiring = products.filter(p => {
      const dl = daysLeft(p.date)
      return dl >= 0 && dl <= settings.notifyDaysBefore && !dismissedIds.includes(p.id)
    })
    setNotifications(expiring)
  }, [products, settings, dismissedIds])

  function addProduct({ name, date, location, image }) {
    setProducts(prev => [{ id: nextId, name, date, location, image }, ...prev])
    setNextId(n => n + 1)
  }

  function requestDelete(id) {
    const product = products.find(p => p.id === id)
    setDeleteModal({ product })
  }

  // Sparar reason ('eaten' eller 'wasted') för alla borttagna varor
  function confirmDelete(reason) {
    const { product } = deleteModal
    setWasteLog(prev => [{ ...product, removedAt: new Date().toISOString(), reason }, ...prev])
    setProducts(prev => prev.filter(p => p.id !== product.id))
    setDeleteModal(null)
  }

  function cancelDelete() {
    setDeleteModal(null)
  }

  function dismissNotification(id) {
    const updated = [...dismissedIds, id]
    setDismissedIds(updated)
    localStorage.setItem('gf-dismissed', JSON.stringify(updated))
  }

  const TABS = [
    { key: 'overview',  label: 'Översikt'        },
    { key: 'fridge',    label: 'Mina varor'       },
    { key: 'add',       label: '+ Lägg till'      },
    { key: 'history',   label: '📋 Historik'      },
    { key: 'settings',  label: '⚙️ Inställningar' },
  ]

  return (
    <div className="app">
      <header className="app-header">
        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 100, height: 100, overflow: 'hidden' }}>
            <img
              src={Logo}
              alt="logo"
              style={{
                width: 100,
                height: 170,
                objectFit: 'cover',
                objectPosition: 'top'
              }}
            />
          </div>
          GoodFridge
        </div>
        <nav className="nav">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`nav-btn${tab === t.key ? ' active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <NotificationBanner notifications={notifications} onDismiss={dismissNotification} settings={settings} />

      <main className="app-body">
        {tab === 'overview'  && <OverviewTab products={products} />}
        {tab === 'settings'  && <SettingsTab settings={settings} onUpdate={updateSettings} />}
        {tab === 'fridge'    && <FridgeTab   products={products} onDelete={requestDelete} />}
        {tab === 'add'       && <AddTab      onAdd={addProduct}  recentProducts={products} onDelete={requestDelete} settings={settings} />}
        {tab === 'history'   && <HistoryTab  wasteLog={wasteLog} />}
      </main>

      {deleteModal && (
        <DeleteModal
          product={deleteModal.product}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  )
}

