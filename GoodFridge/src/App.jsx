import { useState, useEffect } from 'react'

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

function getEmoji(location) {
return { fridge: '🧊', freezer: '❄️', pantry: '🗄️' }[location] || '📦'
}

function getIconBg(days) {
if (days < 0) return 'var(–bg-muted)'
if (days <= 2) return 'var(–red-50)'
if (days <= 5) return 'var(–amber-50)'
return 'var(–green-50)'
}

function locationLabel(loc) {
return { fridge: 'Kyl', freezer: 'Frys', pantry: 'Skafferi' }[loc] || loc
}

const SAMPLE_PRODUCTS = [
{ id: 1, name: 'Mjölk',         date: offsetDate(1),  location: 'fridge'  },
{ id: 2, name: 'Yoghurt',       date: offsetDate(3),  location: 'fridge'  },
{ id: 3, name: 'Morötter',      date: offsetDate(7),  location: 'fridge'  },
{ id: 4, name: 'Kycklingfilé',  date: offsetDate(-1), location: 'freezer' },
{ id: 5, name: 'Pasta',         date: offsetDate(30), location: 'pantry'  },
{ id: 6, name: 'Ägg',           date: offsetDate(5),  location: 'fridge'  },
{ id: 7, name: 'Cheddar',       date: offsetDate(2),  location: 'fridge'  },
]

// ── sub-components ─────────────────────────────────────────────────────────

function ProductItem({ product, onDelete }) {
const days = daysLeft(product.date)
const badge = getBadge(days)
return (
<div className="product-item">
<div className="product-icon" style={{ background: getIconBg(days) }}>
{getEmoji(product.location)}
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
const statOk     = products.filter(p => daysLeft(p.date) > 5).length

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
const [search, setSearch]   = useState('')
const [filter, setFilter]   = useState('all')

const FILTERS = [
{ key: 'all',     label: 'Alla'       },
{ key: 'fridge',  label: '🧊 Kyl'     },
{ key: 'freezer', label: '❄️ Frys'    },
{ key: 'pantry',  label: '🗄️ Skafferi'},
]

const visible = products
.filter(p => filter === 'all' || p.location === filter)
.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
.sort((a, b) => daysLeft(a.date) - daysLeft(b.date))

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

function AddTab({ onAdd, recentProducts, onDelete }) {
const today = new Date().toISOString().slice(0, 10)
const [name,     setName]     = useState('')
const [date,     setDate]     = useState(today)
const [location, setLocation] = useState('fridge')
const [msg,      setMsg]      = useState(null)

function handleAdd() {
if (!name.trim() || !date) {
setMsg({ type: 'error', text: 'Fyll i namn och datum.' })
return
}
onAdd({ name: name.trim(), date, location })
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
<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
<button className="add-btn" onClick={handleAdd}>Lägg till vara</button>
{msg && (
<span style={{ fontSize: 13, color: msg.type === 'ok' ? 'var(–green-600)' : 'var(–red-600)' }}>
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

useEffect(() => {
localStorage.setItem('gf-products', JSON.stringify(products))
localStorage.setItem('gf-next-id', String(nextId))
}, [products, nextId])

function addProduct({ name, date, location }) {
setProducts(prev => [{ id: nextId, name, date, location }, ...prev])
setNextId(n => n + 1)
}

function deleteProduct(id) {
setProducts(prev => prev.filter(p => p.id !== id))
}

const TABS = [
{ key: 'overview', label: 'Översikt'   },
{ key: 'fridge',   label: 'Mina varor' },
{ key: 'add',      label: '+ Lägg till'},
]

return (
<div className="app">
<header className="app-header">
<div className="logo">
<div className="logo-icon">🥦</div>
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

  <main className="app-body">
    {tab === 'overview' && <OverviewTab products={products} />}
    {tab === 'fridge'   && <FridgeTab   products={products} onDelete={deleteProduct} />}
    {tab === 'add'      && <AddTab       onAdd={addProduct}  recentProducts={products} onDelete={deleteProduct} />}
  </main>
</div>

)
}
