import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'

type TabKey = 'home' | 'brief' | 'venues' | 'teleprompter' | 'settings'
type GearStateKey = 'packed' | 'returned'
type SpeedKey = 'slow' | 'medium' | 'fast'

type Scene = {
  id: string
  category: '探店' | '口播' | 'Vlog'
  mark: string
  title: string
  desc: string
  modalTitle: string
  blocks: Array<[string, string]>
  brief: {
    advice: string
    rhythm: string
    risk: string
  }
}

type GearItem = {
  id: string
  name: string
  type: string
  count: number
  weight: number
  note: string
  mark: string
  packed: boolean
  returned: boolean
}

type Shot = {
  id: string
  title: string
  meta: string
  done: boolean
}

type Venue = {
  id: string
  name: string
  category: '探店' | 'Vlog' | '口播' | '其他'
  desc: string
  rating: number
}

type AppState = {
  currentTab: TabKey
  selectedSceneId: string
  gear: GearItem[]
  shots: Shot[]
  venues: Venue[]
  teleText: string
  teleSpeed: SpeedKey
  teleFontSize: number
}

const storageKey = 'shootingAssistantPwa:v1'

const scenes: Scene[] = [
  {
    id: 'cafe',
    category: '探店',
    mark: '探',
    title: '咖啡店探店',
    desc: '适合环境空镜、手部特写、产品细节和一句话点评。',
    modalTitle: '咖啡店探店方案',
    blocks: [
      ['最佳拍摄点位', '靠窗双人桌、吧台出杯位、门口招牌下方。优先选择背景干净的位置。'],
      ['运镜节奏建议', '门头推进、咖啡特写、手部动作、人物一句话评价，最后用环境空镜收尾。'],
      ['核心要点', '突出「安静」「自然光」「适合办公」三个关键词，避免镜头信息太散。'],
      ['风险提示', '注意店内授权、路人入镜和咖啡机噪声。拍摄前最好先和店员确认。'],
    ],
    brief: {
      advice: '先拍门头和店内环境，再拍点单、咖啡拉花、手拿杯靠窗的细节。人物出镜时保持背景干净，画面留出字幕区域。',
      rhythm: '开头3秒给出店名和亮点，中段用5个短镜头展示环境与产品，结尾用一句主观评价收束。',
      risk: '避开正午强反光，收音注意咖啡机噪声。若店内人多，优先拍局部细节，减少路人入镜。',
    },
  },
  {
    id: 'talk',
    category: '口播',
    mark: '口',
    title: '轻量口播',
    desc: '优先收音、补光和稳定构图，自动生成3段表达节奏。',
    modalTitle: '轻量口播拍摄方案',
    blocks: [
      ['最佳拍摄点位', '选择安静墙面或窗边半身位，背景保留少量环境信息，人物脸部受光要稳定。'],
      ['运镜节奏建议', '开头固定近景说结论，中段切到中景补充理由，结尾回到近景给行动建议。'],
      ['核心要点', '先说观点，再给例子，最后总结一句。每段控制在12秒以内，方便后期剪短。'],
      ['风险提示', '先检查麦克风电量和环境噪声，避免逆光让脸部过暗。'],
    ],
    brief: {
      advice: '先确认口播主题和一句话结论，再固定机位拍正面表达。补拍手部动作、产品细节或屏幕演示，给后期留下转场素材。',
      rhythm: '开头直接抛结论，中段拆成3个短观点，每个观点搭配一个例子，结尾用一句行动建议收住。',
      risk: '重点检查收音、眼神方向和面部光线。环境太吵时先录纯口播，再补拍画面。',
    },
  },
  {
    id: 'vlog',
    category: 'Vlog',
    mark: 'V',
    title: '日常Vlog',
    desc: '从出发到收尾，按地点拆镜头，适合移动拍摄。',
    modalTitle: '日常Vlog拍摄方案',
    blocks: [
      ['最佳拍摄点位', '出发点、路上转场、目的地入口和收尾地点各拍一组，保证故事有起承转合。'],
      ['运镜节奏建议', '用走拍建立行动感，穿插手部细节和环境声，结尾用静态镜头让节奏落下来。'],
      ['核心要点', '记录「去哪儿」「为什么去」「看到了什么」「感受如何」四件事。'],
      ['风险提示', '移动拍摄注意防抖和安全，尽量不要边走边看屏幕太久。'],
    ],
    brief: {
      advice: '按出发、路上、抵达、体验、收尾的顺序拍。每个地点至少留一个环境镜头和一个手部细节镜头。',
      rhythm: '开头用移动镜头带出目的地，中段穿插短句旁白和现场声，结尾用慢镜头或定格镜头做情绪收束。',
      risk: '走拍时注意路面和人流，避免长时间盯屏。风大时优先保护收音。',
    },
  },
]

const defaultState: AppState = {
  currentTab: 'home',
  selectedSceneId: '',
  gear: [
    { id: 'gear-1', name: 'Sony A7C II', type: '机身', count: 1, weight: 0.52, note: '电池已充满', mark: '机', packed: true, returned: true },
    { id: 'gear-2', name: '24-70mm 镜头', type: '镜头', count: 1, weight: 0.69, note: '适合探店主力镜头', mark: '镜', packed: true, returned: true },
    { id: 'gear-3', name: '小型补光灯', type: '灯光', count: 1, weight: 0.25, note: '带冷靴转接', mark: '灯', packed: true, returned: false },
    { id: 'gear-4', name: '无线麦克风', type: '收音', count: 2, weight: 0.13, note: '检查接收器', mark: '麦', packed: true, returned: false },
    { id: 'gear-5', name: '移动电源', type: '电源', count: 1, weight: 0.32, note: '给手机和灯补电', mark: '电', packed: false, returned: false },
  ],
  shots: [
    { id: '01', title: '门头远景', meta: '远景｜平视｜店名建立', done: true },
    { id: '02', title: '推门进入', meta: '中景｜跟拍｜开场转场', done: true },
    { id: '03', title: '咖啡拉花', meta: '特写｜俯拍｜产品质感', done: true },
    { id: '04', title: '窗边人物', meta: '中近景｜侧逆光｜氛围感', done: true },
    { id: '05', title: '菜单细节', meta: '近景｜手持｜信息补充', done: false },
    { id: '06', title: '一句话点评', meta: '近景｜固定机位｜口播', done: false },
    { id: '07', title: '环境收尾', meta: '全景｜慢摇｜结尾空镜', done: false },
  ],
  venues: [
    { id: 'venue-1', name: '梧桐巷咖啡', category: '探店', desc: '窗边光线稳定，适合产品和人物半身。', rating: 4 },
    { id: 'venue-2', name: '河岸步道', category: 'Vlog', desc: '傍晚逆光漂亮，适合走拍和转场。', rating: 5 },
  ],
  teleText: '',
  teleSpeed: 'medium',
  teleFontSize: 46,
}

function readState(): AppState {
  try {
    const saved = localStorage.getItem(storageKey)
    if (!saved) return defaultState
    return { ...defaultState, ...JSON.parse(saved) }
  } catch {
    return defaultState
  }
}

function stars(rating: number) {
  const count = Math.max(1, Math.min(5, rating))
  return '★★★★★'.slice(0, count) + '☆☆☆☆☆'.slice(0, 5 - count)
}

function App() {
  const [state, setState] = useState<AppState>(readState)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'全部' | Scene['category']>('全部')
  const [toast, setToast] = useState('')
  const [aiScene, setAiScene] = useState<Scene | null>(null)
  const [gearFormOpen, setGearFormOpen] = useState(false)
  const [shotFormOpen, setShotFormOpen] = useState(false)
  const [venueForm, setVenueForm] = useState<{ open: boolean; index: number | null }>({ open: false, index: null })
  const [teleOpen, setTeleOpen] = useState(false)
  const [telePaused, setTelePaused] = useState(false)
  const [teleProgress, setTeleProgress] = useState(0)
  const teleStageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 1700)
    return () => window.clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    if (!teleOpen || telePaused) return
    const speed = { slow: 0.45, medium: 0.9, fast: 1.45 }[state.teleSpeed]
    const timer = window.setInterval(() => {
      const stage = teleStageRef.current
      if (!stage) return
      const maxScroll = Math.max(1, stage.scrollHeight - stage.clientHeight)
      stage.scrollTop += speed
      setTeleProgress(Math.round((stage.scrollTop / maxScroll) * 100))
      if (stage.scrollTop >= maxScroll - 2) setTelePaused(true)
    }, 28)
    return () => window.clearInterval(timer)
  }, [teleOpen, telePaused, state.teleSpeed])

  const selectedScene = scenes.find((scene) => scene.id === state.selectedSceneId)
  const visibleScenes = scenes.filter((scene) => {
    const text = `${scene.title} ${scene.desc} ${scene.category}`.toLowerCase()
    return (filter === '全部' || scene.category === filter) && (!search || text.includes(search.toLowerCase()))
  })
  const totalWeight = state.gear
    .filter((item) => item.packed)
    .reduce((total, item) => total + item.weight * item.count, 0)
  const shotDone = state.shots.filter((shot) => shot.done).length

  function updateState(patch: Partial<AppState>) {
    setState((current) => ({ ...current, ...patch }))
  }

  function setTab(tab: TabKey) {
    updateState({ currentTab: tab })
  }

  function openScene(scene: Scene) {
    updateState({ selectedSceneId: scene.id })
    setAiScene(scene)
  }

  function toggleGear(index: number, key: GearStateKey) {
    const gear = state.gear.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [key]: !item[key] } : item
    ))
    updateState({ gear })
    setToast(key === 'packed' ? '器材携带状态已保存' : '器材收回状态已保存')
  }

  function addGear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const type = String(form.get('type') || '配件')
    const gear: GearItem = {
      id: `gear-${Date.now()}`,
      name: String(form.get('name') || '').trim(),
      type,
      count: Math.max(1, Number(form.get('count')) || 1),
      weight: Math.max(0, Number(form.get('weight')) || 0),
      note: String(form.get('note') || '').trim(),
      mark: type.slice(0, 1),
      packed: true,
      returned: false,
    }
    updateState({ gear: [...state.gear, gear] })
    setGearFormOpen(false)
    setToast('新器材已添加')
  }

  function addShot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextId = String(state.shots.length + 1).padStart(2, '0')
    const shot: Shot = {
      id: nextId,
      title: String(form.get('title') || '').trim(),
      meta: String(form.get('meta') || '').trim(),
      done: false,
    }
    updateState({ shots: [...state.shots, shot] })
    setShotFormOpen(false)
    setToast('新镜头已添加')
  }

  function saveVenue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const venue: Venue = {
      id: venueForm.index === null ? `venue-${Date.now()}` : state.venues[venueForm.index].id,
      name: String(form.get('name') || '').trim(),
      category: String(form.get('category') || '其他') as Venue['category'],
      desc: String(form.get('desc') || '').trim(),
      rating: Number(form.get('rating')) || 4,
    }
    const venues = [...state.venues]
    if (venueForm.index === null) venues.push(venue)
    else venues[venueForm.index] = venue
    updateState({ venues })
    setVenueForm({ open: false, index: null })
    setToast(venueForm.index === null ? '新场地已添加' : '场地已更新')
  }

  function dragShot(fromIndex: number, toIndex: number) {
    const shots = [...state.shots]
    const [moved] = shots.splice(fromIndex, 1)
    shots.splice(toIndex, 0, moved)
    updateState({ shots: shots.map((shot, index) => ({ ...shot, id: String(index + 1).padStart(2, '0') })) })
    setToast('镜头顺序已保存')
  }

  function setTeleScroll(value: number) {
    const stage = teleStageRef.current
    if (!stage) return
    const maxScroll = Math.max(1, stage.scrollHeight - stage.clientHeight)
    stage.scrollTop = (maxScroll * value) / 100
    setTeleProgress(value)
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="icon-btn" type="button" onClick={() => setToast('菜单暂未展开')}>≡</button>
        <div className="title">{({ home: '拍摄助手', brief: '拍摄简报', venues: '场地', teleprompter: '提词器', settings: '设置' } as Record<TabKey, string>)[state.currentTab]}</div>
        <button className="icon-btn avatar" type="button" onClick={() => setToast('个人设置入口')}>王</button>
      </header>

      <main>
        {state.currentTab === 'home' && (
          <section className="view">
            <div className="search-row">
              <label className="search">⌕
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索地点、主题或装备" />
              </label>
              <button className="icon-btn" type="button" onClick={() => setToast('已定位到示例城市')}>⌖</button>
            </div>

            <article className="hero-card">
              <span className="eyebrow">AI 驱动｜今日外拍建议</span>
              <h1>先定场景，再带对装备。</h1>
              <p>用一页清单串起器材、镜头脚本和拍摄简报，出门前少漏一件，现场少乱一步。</p>
              <div className="hero-actions">
                <button className="btn btn-soft" type="button" onClick={() => setToast('已进入纯拍摄模式')}>纯拍摄</button>
                <button className="btn btn-primary" type="button" onClick={() => openScene(scenes[0])}>生成简报</button>
              </div>
            </article>

            <div className="section-head"><h2>推荐拍摄场景</h2><span>可点击体验</span></div>
            <div className="chips">
              {(['全部', '探店', '口播', 'Vlog'] as const).map((chip) => (
                <button className={`chip ${filter === chip ? 'active' : ''}`} key={chip} type="button" onClick={() => setFilter(chip)}>{chip}</button>
              ))}
            </div>
            <div className="cards">
              {visibleScenes.map((scene) => (
                <button className="card scene-card" key={scene.id} type="button" onClick={() => openScene(scene)}>
                  <span className="icon">{scene.mark}</span>
                  <span><h3>{scene.title}</h3><p>{scene.desc}</p></span>
                  <span className="arrow">›</span>
                </button>
              ))}
            </div>
            {visibleScenes.length === 0 && <div className="empty-state">没有找到匹配场景。可以换个关键词，或切回「全部」。</div>}

            <div className="section-head"><h2>器材出行清单</h2><span>总负重 {totalWeight.toFixed(2)}kg</span></div>
            <article className="card">
              <div className="gear-top">
                <div><h3>Vlog 包模板</h3><p className="small">机身、稳定器、收音、电源、存储卡</p></div>
                <div className="inline-actions">
                  <button className="btn btn-soft" type="button" onClick={() => updateState({ gear: state.gear.map((item) => ({ ...item, packed: true })) })}>全带</button>
                  <button className="btn btn-soft" type="button" onClick={() => updateState({ gear: state.gear.map((item) => ({ ...item, packed: false })) })}>全不带</button>
                  <button className="btn btn-primary" type="button" onClick={() => setGearFormOpen(true)}>+ 添加器材</button>
                </div>
              </div>
              <div className="list">
                {state.gear.map((item, index) => (
                  <div className="list-item" key={item.id}>
                    <span className="thumb">{item.mark}</span>
                    <span><strong>{item.name}</strong><p className="small">{item.type}｜{item.count}件｜{item.weight.toFixed(2)}kg｜{item.note || '无备注'}</p></span>
                    <span className="toggle-pair">
                      <button className={`state ${item.packed ? 'on' : ''}`} type="button" onClick={() => toggleGear(index, 'packed')}>带</button>
                      <button className={`state ${item.returned ? 'on' : ''}`} type="button" onClick={() => toggleGear(index, 'returned')}>回</button>
                      <button className="delete-btn" type="button" onClick={() => updateState({ gear: state.gear.filter((_, itemIndex) => itemIndex !== index) })}>×</button>
                    </span>
                  </div>
                ))}
              </div>
            </article>
          </section>
        )}

        {state.currentTab === 'brief' && (
          <section className="view">
            <article className="card">
              <div className="brief-cover">
                <span className="eyebrow">本地规则生成｜示例简报</span>
                <div><h2>{selectedScene?.title || '请先选择场景'}</h2><p className="small">根据首页场景动态生成拍摄建议</p></div>
              </div>
              <div className="score-row">
                <div className="metric"><strong>92</strong><span>综合评分</span></div>
                <div className="metric"><strong>高</strong><span>推荐指数</span></div>
                <div className="metric"><strong>88%</strong><span>出片潜力</span></div>
              </div>
            </article>
            <div className="section-head"><h2>拍摄方案</h2><span className="stars">★★★★★</span></div>
            <details open><summary>拍摄建议</summary><p>{selectedScene?.brief.advice || '请先在首页选择一个场景。'}</p></details>
            <details><summary>镜头节奏</summary><p>{selectedScene?.brief.rhythm || '请先在首页选择一个场景。'}</p></details>
            <details><summary>风险提醒</summary><p>{selectedScene?.brief.risk || '请先在首页选择一个场景。'}</p></details>

            <div className="section-head"><h2>镜头脚本</h2><span>已拍 {shotDone}/{state.shots.length}</span></div>
            <article className="card">
              <h3>窗边区域</h3>
              <div className="shot-progress"><i style={{ width: `${state.shots.length ? (shotDone / state.shots.length) * 100 : 0}%` }} /></div>
              <div className="list">
                {state.shots.map((shot, index) => (
                  <div className="list-item shot" key={`${shot.id}-${shot.title}`} draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', String(index))} onDrop={(event) => dragShot(Number(event.dataTransfer.getData('text/plain')), index)} onDragOver={(event) => event.preventDefault()}>
                    <span className="shot-num">{shot.id}</span>
                    <span><strong>{shot.title}</strong><p className="small">{shot.meta}</p></span>
                    <button className={`check ${shot.done ? 'done' : ''}`} type="button" onClick={() => updateState({ shots: state.shots.map((item, shotIndex) => shotIndex === index ? { ...item, done: !item.done } : item) })}>{shot.done ? '✓' : ''}</button>
                  </div>
                ))}
              </div>
              <button className="btn btn-primary wide" type="button" onClick={() => setShotFormOpen(true)}>+ 添加镜头</button>
            </article>
          </section>
        )}

        {state.currentTab === 'venues' && (
          <section className="view">
            <div className="section-head"><h2>场地库</h2><span>{state.venues.length}个场地</span></div>
            <div className="venue-grid">
              {state.venues.map((venue, index) => (
                <article className="card venue" key={venue.id}>
                  <div className="venue-actions">
                    <button className="mini-btn" type="button" onClick={() => setVenueForm({ open: true, index })}>✎</button>
                    <button className="mini-btn" type="button" onClick={() => {
                      if (window.confirm(`确认删除「${venue.name}」吗？`)) updateState({ venues: state.venues.filter((_, itemIndex) => itemIndex !== index) })
                    }}>×</button>
                  </div>
                  <span className="eyebrow">{venue.category}</span>
                  <h3>{venue.name}</h3>
                  <p className="small">{venue.desc}</p>
                  <span className="stars">{stars(venue.rating)}</span>
                </article>
              ))}
            </div>
            <button className="btn btn-primary wide" type="button" onClick={() => setVenueForm({ open: true, index: null })}>+ 添加场地</button>
          </section>
        )}

        {state.currentTab === 'teleprompter' && (
          <section className="view">
            <article className="card tele-card">
              <span className="eyebrow">口播辅助｜自动滚动</span>
              <h2>提词器</h2>
              <p className="small">粘贴口播稿，点击开始后进入全屏提词模式。文字会自动保存。</p>
              <textarea value={state.teleText} onChange={(event) => updateState({ teleText: event.target.value })} placeholder={'在这里输入或粘贴口播稿。\n\n建议每段之间空一行，提词时会保留段落间距。'} />
              <div className="tele-toolbar">
                <div className="segmented">
                  {(['slow', 'medium', 'fast'] as SpeedKey[]).map((speed) => (
                    <button className={`segment ${state.teleSpeed === speed ? 'active' : ''}`} key={speed} type="button" onClick={() => updateState({ teleSpeed: speed })}>{speed === 'slow' ? '慢' : speed === 'medium' ? '中' : '快'}</button>
                  ))}
                </div>
                <label className="range-row">字号
                  <input type="range" min="40" max="60" value={state.teleFontSize} onChange={(event) => updateState({ teleFontSize: Number(event.target.value) })} />
                  <span>{state.teleFontSize}px</span>
                </label>
              </div>
              <button className="btn btn-primary wide start-btn" type="button" onClick={() => state.teleText.trim() ? setTeleOpen(true) : setToast('请先输入口播稿')}>开始提词</button>
            </article>
          </section>
        )}

        {state.currentTab === 'settings' && (
          <section className="view">
            <article className="card">
              <h3>设置</h3>
              {[
                ['离线使用', 'PWA 会缓存页面和本地数据。'],
                ['应用内提醒', 'iOS26.5 支持 PWA 推送前提条件，后续可再接 Web Push。'],
                ['AI 文案', '第一期默认本地占位，接入在线 AI 前需确认。'],
              ].map(([title, desc]) => (
                <div className="setting-row" key={title}>
                  <span><strong>{title}</strong><p className="small">{desc}</p></span><span className="switch"><i /></span>
                </div>
              ))}
            </article>
          </section>
        )}
      </main>

      <nav className="tabbar" aria-label="底部导航">
        {[
          ['home', '⌂', '首页'],
          ['brief', '▤', '简报'],
          ['venues', '⌖', '场地'],
          ['teleprompter', 'T', '提词器'],
          ['settings', '⚙', '设置'],
        ].map(([key, icon, label]) => (
          <button className={`tab ${state.currentTab === key ? 'active' : ''}`} key={key} type="button" onClick={() => setTab(key as TabKey)}><b>{icon}</b><span>{label}</span></button>
        ))}
      </nav>

      {aiScene && <AiModal scene={aiScene} onClose={() => setAiScene(null)} />}
      {gearFormOpen && <GearModal onClose={() => setGearFormOpen(false)} onSubmit={addGear} />}
      {shotFormOpen && <ShotModal onClose={() => setShotFormOpen(false)} onSubmit={addShot} />}
      {venueForm.open && <VenueModal venue={venueForm.index === null ? null : state.venues[venueForm.index]} onClose={() => setVenueForm({ open: false, index: null })} onSubmit={saveVenue} />}
      {teleOpen && (
        <div className="teleprompter">
          <div className="tele-fullbar">
            <button className="icon-btn" type="button" onClick={() => { setTeleOpen(false); setTelePaused(false); }}>‹</button>
            <div className="inline-actions">
              {(['slow', 'medium', 'fast'] as SpeedKey[]).map((speed) => (
                <button className={`segment ${state.teleSpeed === speed ? 'active' : ''}`} key={speed} type="button" onClick={() => updateState({ teleSpeed: speed })}>{speed === 'slow' ? '慢' : speed === 'medium' ? '中' : '快'}</button>
              ))}
            </div>
            <div className="inline-actions">
              <button className="mini-btn" type="button" onClick={() => updateState({ teleFontSize: Math.max(40, state.teleFontSize - 2) })}>A-</button>
              <button className="mini-btn" type="button" onClick={() => updateState({ teleFontSize: Math.min(60, state.teleFontSize + 2) })}>A+</button>
            </div>
          </div>
          <div className="tele-stage" ref={teleStageRef} onClick={() => setTelePaused((value) => !value)}>
            <div className="tele-text" style={{ fontSize: state.teleFontSize }}>{state.teleText}</div>
          </div>
          <div className="tele-progress">
            <input type="range" min="0" max="100" value={teleProgress} onChange={(event) => setTeleScroll(Number(event.target.value))} />
            <span>{telePaused ? '已暂停' : '播放中'}</span>
          </div>
        </div>
      )}
      <div className={`toast ${toast ? 'show' : ''}`}>{toast}</div>
    </div>
  )
}

function AiModal({ scene, onClose }: { scene: Scene; onClose: () => void }) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <section className="modal" onClick={(event) => event.stopPropagation()}>
        <span className="ai-badge">AI 驱动｜拍摄建议</span>
        <h2>{scene.modalTitle}</h2>
        {scene.blocks.map(([title, text]) => <div className="ai-block" key={title}><strong>{title}</strong><p>{text}</p></div>)}
        <button className="btn btn-primary wide" type="button" onClick={onClose}>执行拍摄计划</button>
      </section>
    </div>
  )
}

function GearModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <FormModal title="添加新器材" badge="器材清单" onClose={onClose} onSubmit={onSubmit}>
      <label className="field">名称<input name="name" placeholder="例如：备用存储卡" required /></label>
      <label className="field">分类<select name="type">{['机身', '镜头', '灯光', '稳定器', '收音', '电源', '存储', '配件', '个人物品'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field">数量<input name="count" type="number" min="1" step="1" defaultValue="1" required /></label>
      <label className="field">单件重量（kg）<input name="weight" type="number" min="0" step="0.01" defaultValue="0.10" required /></label>
      <label className="field">备注<textarea name="note" placeholder="例如：出门前检查电量" /></label>
    </FormModal>
  )
}

function ShotModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <FormModal title="添加新镜头" badge="镜头脚本" onClose={onClose} onSubmit={onSubmit}>
      <label className="field">镜头名<input name="title" placeholder="例如：窗边手拿杯特写" required /></label>
      <label className="field">描述<textarea name="meta" placeholder="例如：特写｜俯拍｜突出杯身和自然光" required /></label>
    </FormModal>
  )
}

function VenueModal({ venue, onClose, onSubmit }: { venue: Venue | null; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <FormModal title={venue ? '编辑场地' : '添加场地'} badge="场地库" onClose={onClose} onSubmit={onSubmit}>
      <label className="field">场地名称<input name="name" defaultValue={venue?.name} placeholder="例如：梧桐巷咖啡" required /></label>
      <label className="field">分类<select name="category" defaultValue={venue?.category || '探店'}>{['探店', 'Vlog', '口播', '其他'].map((item) => <option key={item}>{item}</option>)}</select></label>
      <label className="field">描述<textarea name="desc" defaultValue={venue?.desc} placeholder="例如：窗边光线稳定，适合产品和人物半身。" required /></label>
      <label className="field">星级评分<input name="rating" type="number" min="1" max="5" defaultValue={venue?.rating || 4} required /></label>
    </FormModal>
  )
}

function FormModal({ title, badge, children, onClose, onSubmit }: { title: string; badge: string; children: ReactNode; onClose: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) {
  return (
    <div className="modal-mask" onClick={onClose}>
      <section className="modal" onClick={(event) => event.stopPropagation()}>
        <span className="ai-badge">{badge}</span>
        <h2>{title}</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          {children}
          <button className="btn btn-primary wide" type="submit">保存</button>
          <button className="btn btn-soft wide" type="button" onClick={onClose}>取消</button>
        </form>
      </section>
    </div>
  )
}

export default App
