import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  ArrowDownWideNarrow, ArrowLeft, ArrowRight, BookOpen, BriefcaseBusiness,
  CalendarDays, Check, CheckCircle2, ChevronDown, Circle, CircleHelp,
  ClipboardList, Command, LayoutDashboard, Menu, Moon, MoreHorizontal,
  Plus, Search, Settings2, Sun, Tag, UserRound, X,
} from 'lucide-react'
import TaskItem from './components/TaskItem.jsx'
import TaskModal from './components/TaskModal.jsx'

const WeeklyChart = lazy(() => import('./components/WeeklyChart.jsx'))
const TASKS_KEY = 'taskmate.tasks.v1'
const PREFERENCES_KEY = 'taskmate.preferences.v1'
const categories = ['College', 'Personal', 'Work', 'Other']
const navigation = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'My tasks', icon: ClipboardList },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Categories', icon: Tag },
]
const categoryIcons = { College: BookOpen, Personal: UserRound, Work: BriefcaseBusiness, Other: Tag }

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateOffset(offset) {
  const date = new Date()
  date.setDate(date.getDate() + offset)
  return formatDate(date)
}

function getToday() {
  return formatDate(new Date())
}

function createSampleTasks() {
  return [
    { id: 'sample-1', title: 'Review research paper', description: 'Add final notes and check the citations before submission.', category: 'College', priority: 'High', dueDate: dateOffset(0), completed: false },
    { id: 'sample-2', title: 'Plan the week ahead', description: 'Set three priorities and make room for a proper break.', category: 'Personal', priority: 'Medium', dueDate: dateOffset(1), completed: false },
    { id: 'sample-3', title: 'Send project update', description: 'Share the latest progress with the product team.', category: 'Work', priority: 'High', dueDate: dateOffset(2), completed: false },
    { id: 'sample-4', title: 'Pick up groceries', description: 'Get the essentials for a few easy dinners.', category: 'Personal', priority: 'Low', dueDate: dateOffset(3), completed: false },
    { id: 'sample-5', title: 'Finish statistics problem set', description: 'Complete questions 4 through 8.', category: 'College', priority: 'Medium', dueDate: dateOffset(-1), completed: false },
    { id: 'sample-6', title: 'Prepare design critique', description: 'Collect the latest mockups and discussion points.', category: 'Work', priority: 'Medium', dueDate: dateOffset(4), completed: false },
    { id: 'sample-7', title: 'Book a dentist appointment', description: '', category: 'Personal', priority: 'Low', dueDate: dateOffset(5), completed: false },
    { id: 'sample-8', title: 'Read chapter three', description: 'Make a short summary for seminar.', category: 'College', priority: 'Low', dueDate: dateOffset(-2), completed: true, completedAt: dateOffset(-2) },
    { id: 'sample-9', title: 'Update project brief', description: '', category: 'Work', priority: 'High', dueDate: dateOffset(-3), completed: true, completedAt: dateOffset(-1) },
  ]
}

function readTasks() {
  try {
    const saved = localStorage.getItem(TASKS_KEY)
    return saved ? JSON.parse(saved) : createSampleTasks()
  } catch {
    return createSampleTasks()
  }
}

function readPreferences() {
  const defaults = { theme: 'light', displayName: 'Alex Morgan', showProfile: true }
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}') }
  } catch {
    return defaults
  }
}

function prettyDate(dateString, options = { month: 'short', day: 'numeric' }) {
  if (!dateString) return 'No date'
  return new Date(`${dateString}T12:00:00`).toLocaleDateString('en-US', options)
}

function startOfWeek(date) {
  const first = new Date(date)
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7))
  first.setHours(0, 0, 0, 0)
  return first
}

function App() {
  const [now] = useState(() => new Date())
  const [tasks, setTasks] = useState(readTasks)
  const [preferences, setPreferences] = useState(readPreferences)
  const [page, setPage] = useState('Overview')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All tasks')
  const [categoryFilter, setCategoryFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All priorities')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [modalTask, setModalTask] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [toast, setToast] = useState(null)
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  useEffect(() => { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)) }, [tasks])
  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences))
    document.documentElement.dataset.theme = preferences.theme
  }, [preferences])
  useEffect(() => {
    if (!toast) return undefined
    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [toast])

  const today = getToday()
  const completedCount = tasks.filter((task) => task.completed).length
  const pendingCount = tasks.length - completedCount
  const overdueCount = tasks.filter((task) => !task.completed && task.dueDate < today).length
  const completionRate = tasks.length ? Math.round((completedCount / tasks.length) * 100) : 0
  const visibleTasks = useMemo(() => tasks.filter((task) => {
    const matchesQuery = `${task.title} ${task.description} ${task.category}`.toLowerCase().includes(query.toLowerCase().trim())
    const matchesCategory = categoryFilter === 'All' || task.category === categoryFilter
    const matchesPriority = priorityFilter === 'All priorities' || task.priority === priorityFilter
    const matchesStatus = statusFilter === 'All tasks'
      || (statusFilter === 'Completed' && task.completed)
      || (statusFilter === 'Pending' && !task.completed)
      || (statusFilter === 'Today' && task.dueDate === today && !task.completed)
      || (statusFilter === 'Overdue' && task.dueDate < today && !task.completed)
    return matchesQuery && matchesCategory && matchesPriority && matchesStatus
  }).sort((first, second) => first.dueDate.localeCompare(second.dueDate)), [tasks, query, categoryFilter, priorityFilter, statusFilter, today])
  const weeklyData = useMemo(() => {
    const monday = startOfWeek(now)
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + index)
      const dayKey = formatDate(date)
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        completed: tasks.filter((task) => task.completed && task.completedAt === dayKey).length,
      }
    })
  }, [tasks, now])

  function showToast(message, kind = 'success') {
    setToast({ message, kind, id: Date.now() })
  }

  function openCreateTask(category = 'College', dueDate = today) {
    setModalTask({ category, dueDate })
    setModalOpen(true)
  }

  function saveTask(values) {
    if (!values.title.trim()) {
      showToast('Add a task title before saving.', 'error')
      return false
    }
    if (modalTask?.id) {
      setTasks((current) => current.map((task) => task.id === modalTask.id ? { ...task, ...values } : task))
      showToast('Task updated')
    } else {
      setTasks((current) => [{ ...values, id: `task-${Date.now()}`, completed: false }, ...current])
      showToast('Task created')
    }
    setModalOpen(false)
    setModalTask(null)
    return true
  }

  function toggleTask(taskId) {
    setTasks((current) => current.map((task) => task.id === taskId
      ? { ...task, completed: !task.completed, completedAt: task.completed ? undefined : today }
      : task))
    const task = tasks.find((item) => item.id === taskId)
    showToast(task?.completed ? 'Task moved back to pending' : 'Task completed')
  }

  function deleteTask(taskId) {
    setTasks((current) => current.filter((task) => task.id !== taskId))
    showToast('Task deleted')
  }

  function openTasks(filter = 'All tasks', category = 'All') {
    setStatusFilter(filter)
    setCategoryFilter(category)
    setPage('My tasks')
  }

  function clearLocalData() {
    localStorage.removeItem(TASKS_KEY)
    localStorage.removeItem(PREFERENCES_KEY)
    setTasks([])
    setPreferences({ theme: 'light', displayName: 'Alex Morgan', showProfile: true })
    setQuery('')
    setCategoryFilter('All')
    setStatusFilter('All tasks')
    setPriorityFilter('All priorities')
    setConfirmClear(false)
    showToast('Local data cleared')
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup"><div className="brand-mark"><Check size={19} strokeWidth={3} /></div><span>taskmate<span className="brand-period">.</span></span><button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={18} /></button></div>
        <div className="workspace-switcher"><div className="workspace-avatar">A</div><div className="workspace-meta"><strong>Personal space</strong><span>Free plan</span></div><ChevronDown size={15} /></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav className="primary-nav" aria-label="Main navigation">{navigation.map(({ label, icon: Icon }) => <button key={label} className={`nav-link ${page === label ? 'active' : ''}`} onClick={() => { setPage(label); setMobileNavOpen(false) }}><Icon size={18} strokeWidth={1.8} /><span>{label}</span>{label === 'My tasks' && <span className="nav-count">{pendingCount}</span>}</button>)}</nav>
        <div className="nav-caption category-caption">YOUR CATEGORIES <button className="tiny-icon-button" aria-label="Add a task" title="Add a task" onClick={() => openCreateTask()}><Plus size={15} /></button></div>
        <nav className="category-nav" aria-label="Task categories">{categories.map((category) => {
          const Icon = categoryIcons[category]
          return <button key={category} className="nav-link category-link" onClick={() => { openTasks('All tasks', category); setMobileNavOpen(false) }}><span className={`category-dot dot-${category.toLowerCase()}`}><Icon size={14} /></span><span>{category}</span><span className="nav-count">{tasks.filter((task) => task.category === category).length}</span></button>
        })}</nav>
        <div className="sidebar-spacer" />
        <div className="sidebar-tip"><div className="tip-icon"><Command size={17} /></div><div><strong>Make space to focus</strong><span>One thing at a time is enough.</span></div></div>
        <button className={`nav-link settings-link ${page === 'Settings' ? 'active' : ''}`} onClick={() => { setPage('Settings'); setMobileNavOpen(false) }}><Settings2 size={18} /><span>Settings</span></button>
        {preferences.showProfile && <button className="profile-row" onClick={() => setPage('Settings')} aria-label="Open profile settings"><div className="profile-avatar">{(preferences.displayName || 'A').charAt(0).toUpperCase()}</div><div className="profile-copy"><strong>{preferences.displayName || 'Your name'}</strong><span>Personal workspace</span></div><MoreHorizontal size={18} /></button>}
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}

      <main className="main-panel">
        <header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button><div className="breadcrumbs"><span>Workspace</span><span className="breadcrumb-slash">/</span><strong>{page}</strong></div></div>
          <div className="topbar-actions"><label className="global-search"><Search size={16} /><input value={query} onFocus={() => setPage('My tasks')} onChange={(event) => setQuery(event.target.value)} placeholder="Search tasks" aria-label="Search tasks" /><kbd>⌘ K</kbd></label><span className="topbar-divider" /><span className="today-label">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span><button className="topbar-avatar" aria-label="Open settings" onClick={() => setPage('Settings')}>{(preferences.displayName || 'A').charAt(0).toUpperCase()}</button></div>
        </header>
        <div className="page-content">
          {page === 'Overview' && <Overview name={preferences.displayName} now={now} today={today} tasks={tasks} completedCount={completedCount} pendingCount={pendingCount} overdueCount={overdueCount} completionRate={completionRate} weeklyData={weeklyData} onCreate={() => openCreateTask()} onEdit={(task) => { setModalTask(task); setModalOpen(true) }} onToggle={toggleTask} onTasks={openTasks} onCalendar={() => setPage('Calendar')} />}
          {page === 'My tasks' && <TasksPage tasks={visibleTasks} totalCount={tasks.length} today={today} query={query} statusFilter={statusFilter} categoryFilter={categoryFilter} priorityFilter={priorityFilter} onStatus={setStatusFilter} onCategory={setCategoryFilter} onPriority={setPriorityFilter} onCreate={() => openCreateTask(categoryFilter === 'All' ? 'College' : categoryFilter)} onToggle={toggleTask} onEdit={(task) => { setModalTask(task); setModalOpen(true) }} onDelete={deleteTask} onReset={() => { setQuery(''); setStatusFilter('All tasks'); setCategoryFilter('All'); setPriorityFilter('All priorities') }} />}
          {page === 'Calendar' && <CalendarPage tasks={tasks} month={calendarMonth} today={today} onMonth={setCalendarMonth} onCreate={(dueDate) => openCreateTask('College', dueDate)} onEdit={(task) => { setModalTask(task); setModalOpen(true) }} />}
          {page === 'Categories' && <CategoriesPage tasks={tasks} onOpenCategory={(category) => openTasks('All tasks', category)} onCreate={openCreateTask} />}
          {page === 'Settings' && <SettingsPage preferences={preferences} onPreferences={setPreferences} onClear={() => setConfirmClear(true)} tasksCount={tasks.length} />}
        </div>
      </main>
      {modalOpen && <TaskModal task={modalTask} onSave={saveTask} onClose={() => { setModalOpen(false); setModalTask(null) }} />}
      {confirmClear && <ConfirmDialog onCancel={() => setConfirmClear(false)} onConfirm={clearLocalData} />}
      {toast && <div className={`toast toast-${toast.kind}`} role="status"><span className="toast-check">{toast.kind === 'error' ? <CircleHelp size={17} /> : <CheckCircle2 size={17} />}</span>{toast.message}</div>}
    </div>
  )
}

function Overview({ name, now, today, tasks, completedCount, pendingCount, overdueCount, completionRate, weeklyData, onCreate, onEdit, onToggle, onTasks, onCalendar }) {
  const recentTasks = [...tasks].sort((first, second) => first.dueDate.localeCompare(second.dueDate)).slice(0, 4)
  const upcoming = tasks.filter((task) => !task.completed && task.dueDate >= today).sort((first, second) => first.dueDate.localeCompare(second.dueDate)).slice(0, 3)
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'
  return <>
    <section className="welcome-row"><div><div className="eyebrow">{now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div><h1>{greeting}, {name?.split(' ')[0] || 'there'} <span className="wave-mark">✳</span></h1><p>A little progress each day adds up to a lot.</p></div><button className="button button-primary" onClick={onCreate}><Plus size={17} /> New task</button></section>
    <section className="stats-grid" aria-label="Task summary"><StatCard label="Total tasks" value={tasks.length} detail="Across all categories" icon={ClipboardList} tone="mint" onClick={() => onTasks('All tasks')} /><StatCard label="Completed" value={completedCount} detail={`${completionRate}% completion rate`} icon={CheckCircle2} tone="green" onClick={() => onTasks('Completed')} /><StatCard label="In progress" value={pendingCount} detail="Ready for your focus" icon={Circle} tone="blue" onClick={() => onTasks('Pending')} /><StatCard label="Overdue" value={overdueCount} detail={overdueCount ? 'A good place to start' : 'You are all caught up'} icon={CalendarDays} tone="coral" onClick={() => onTasks('Overdue')} /></section>
    <section className="dashboard-grid">
      <article className="surface productivity-panel"><div className="panel-heading"><div><div className="eyebrow">YOUR RHYTHM</div><h2>Weekly productivity</h2></div><span className="chart-legend"><i /> Completed</span></div><div className="chart-area"><Suspense fallback={<div className="chart-loading">Loading chart…</div>}><WeeklyChart data={weeklyData} /></Suspense></div><div className="chart-footnote"><span className="chart-footnote-dot" />Tasks completed this week</div></article>
      <article className="surface progress-panel"><div className="panel-heading"><div><div className="eyebrow">AT A GLANCE</div><h2>Task completion</h2></div><button className="plain-icon" aria-label="View completed tasks" onClick={() => onTasks('Completed')}><ArrowDownWideNarrow size={17} /></button></div><div className="completion-ring" style={{ '--completion': `${completionRate}%` }}><div className="ring-center"><strong>{completionRate}<small>%</small></strong><span>complete</span></div></div><div className="completion-summary"><div><span className="summary-dot completed-dot" />Completed <strong>{completedCount}</strong></div><div><span className="summary-dot pending-dot" />Remaining <strong>{pendingCount}</strong></div></div><div className="progress-caption">You are building a great rhythm. Keep it up.</div></article>
    </section>
    <section className="lower-grid"><article className="surface recent-panel"><div className="panel-heading"><div><div className="eyebrow">PICK UP WHERE YOU LEFT OFF</div><h2>Recent tasks</h2></div><button className="text-button" onClick={() => onTasks('All tasks')}>View all <ArrowRight size={15} /></button></div>{recentTasks.length ? <div className="task-list compact-list">{recentTasks.map((task) => <TaskItem key={task.id} task={task} today={today} onToggle={onToggle} onEdit={onEdit} />)}</div> : <EmptyState title="A clean slate" message="Create your first task and get things moving." onCreate={onCreate} />}</article>
      <article className="surface upcoming-panel"><div className="panel-heading"><div><div className="eyebrow">NEXT UP</div><h2>Coming up</h2></div><CalendarDays className="heading-illustration" size={19} /></div>{upcoming.length ? <div className="upcoming-list">{upcoming.map((task) => <button key={task.id} className="upcoming-item" onClick={() => onEdit(task)}><span className="upcoming-date"><strong>{new Date(`${task.dueDate}T12:00:00`).getDate()}</strong><small>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short' })}</small></span><span className="upcoming-copy"><strong>{task.title}</strong><small><span className={`mini-${task.category.toLowerCase()}`} />{task.category}</small></span><ArrowRight size={15} /></button>)}</div> : <div className="upcoming-empty"><CalendarDays size={23} /><span>Nothing coming up yet.</span></div>}<button className="calendar-link" onClick={onCalendar}>Open your calendar <ArrowRight size={13} /></button></article>
    </section>
  </>
}

function StatCard({ label, value, detail, icon: Icon, tone, onClick }) {
  return <button className="stat-card surface" onClick={onClick}><div className={`stat-icon stat-${tone}`}><Icon size={18} /></div><div className="stat-copy"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div><ArrowRight className="stat-arrow" size={16} /></button>
}

function TasksPage({ tasks, totalCount, today, query, statusFilter, categoryFilter, priorityFilter, onStatus, onCategory, onPriority, onCreate, onToggle, onEdit, onDelete, onReset }) {
  const filters = ['All tasks', 'Today', 'Pending', 'Completed', 'Overdue']
  const hasFilters = query || statusFilter !== 'All tasks' || categoryFilter !== 'All' || priorityFilter !== 'All priorities'
  return <><section className="page-heading-row"><div><div className="eyebrow">YOUR WORK, YOUR WAY</div><h1>My tasks</h1><p>{totalCount} tasks across your personal space</p></div><button className="button button-primary" onClick={onCreate}><Plus size={17} /> New task</button></section>
    <section className="surface tasks-surface"><div className="task-toolbar"><div className="filter-tabs" role="tablist" aria-label="Filter by status">{filters.map((filter) => <button key={filter} role="tab" aria-selected={statusFilter === filter} className={statusFilter === filter ? 'selected' : ''} onClick={() => onStatus(filter)}>{filter}</button>)}</div><div className="select-filters"><label><span className="sr-only">Category</span><select value={categoryFilter} onChange={(event) => onCategory(event.target.value)}><option value="All">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label><span className="sr-only">Priority</span><select value={priorityFilter} onChange={(event) => onPriority(event.target.value)}><option>All priorities</option><option>High</option><option>Medium</option><option>Low</option></select></label></div></div>
      <div className="task-list tasks-page-list">{tasks.length ? tasks.map((task) => <TaskItem key={task.id} task={task} today={today} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} />) : <EmptyState title={hasFilters ? 'No matching tasks' : 'Nothing on your list yet'} message={hasFilters ? 'Try adjusting your filters or search.' : 'Add a task and give your day a little direction.'} onCreate={hasFilters ? onReset : onCreate} actionLabel={hasFilters ? 'Clear filters' : 'Create a task'} />}</div><div className="tasks-footer"><span>Showing <strong>{tasks.length}</strong> of <strong>{totalCount}</strong> tasks</span>{query && <span className="search-note">Search: “{query}”</span>}</div>
    </section></>
}

function CalendarPage({ tasks, month, today, onMonth, onCreate, onEdit }) {
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  const cells = Array.from({ length: 42 }, (_, index) => {
    const dayNumber = index - offset + 1
    const date = new Date(month.getFullYear(), month.getMonth(), dayNumber)
    return { date, currentMonth: dayNumber > 0 && dayNumber <= daysInMonth, key: formatDate(date) }
  })
  const monthPrefix = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
  const monthTasks = tasks.filter((task) => task.dueDate.startsWith(monthPrefix)).length
  return <><section className="page-heading-row calendar-heading"><div><div className="eyebrow">MAKE ROOM FOR WHAT MATTERS</div><h1>Calendar</h1><p>{monthTasks} {monthTasks === 1 ? 'task' : 'tasks'} this month</p></div><button className="button button-primary" onClick={() => onCreate(today)}><Plus size={17} /> New task</button></section>
    <section className="surface calendar-surface"><div className="calendar-toolbar"><div className="month-controls"><button className="plain-icon" aria-label="Previous month" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ArrowLeft size={17} /></button><h2>{month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</h2><button className="plain-icon" aria-label="Next month" onClick={() => onMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ArrowRight size={17} /></button><button className="today-button" onClick={() => onMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Today</button></div><div className="calendar-legend">{categories.map((category) => <span key={category}><i className={`mini-${category.toLowerCase()}`} />{category}</span>)}</div></div>
      <div className="calendar-grid calendar-weekdays">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => <div key={day}>{day}</div>)}</div><div className="calendar-grid calendar-days">{cells.map(({ date, currentMonth, key }) => {
        const dayTasks = tasks.filter((task) => task.dueDate === key)
        return <div key={key} className={`calendar-cell ${!currentMonth ? 'outside-month' : ''} ${key === today ? 'is-today' : ''}`}><button className="calendar-date" aria-label={`Add task on ${prettyDate(key, { month: 'long', day: 'numeric', year: 'numeric' })}`} onClick={() => onCreate(key)}><span>{date.getDate()}</span>{key === today && <i />}</button><div className="calendar-cell-tasks">{dayTasks.slice(0, 3).map((task) => <button key={task.id} className={`calendar-task cal-${task.category.toLowerCase()} ${task.completed ? 'is-complete' : ''}`} title={task.title} onClick={() => onEdit(task)}><span>{task.title}</span></button>)}{dayTasks.length > 3 && <span className="more-tasks">+{dayTasks.length - 3} more</span>}</div></div>
      })}</div><div className="calendar-mobile-list"><div className="eyebrow">THIS MONTH</div>{tasks.filter((task) => task.dueDate.startsWith(monthPrefix)).sort((first, second) => first.dueDate.localeCompare(second.dueDate)).map((task) => <button key={task.id} className="mobile-calendar-task" onClick={() => onEdit(task)}><span className="mobile-calendar-day">{prettyDate(task.dueDate)}</span><span className={`mini-${task.category.toLowerCase()}`} /><strong>{task.title}</strong></button>)}</div>
    </section></>
}

function CategoriesPage({ tasks, onOpenCategory, onCreate }) {
  const details = { College: 'Classes, assignments & learning', Personal: 'Life admin, health & downtime', Work: 'Projects, meetings & ideas', Other: 'Everything else worth remembering' }
  return <><section className="page-heading-row"><div><div className="eyebrow">A PLACE FOR EVERY PRIORITY</div><h1>Categories</h1><p>Keep different parts of life in balance.</p></div><button className="button button-primary" onClick={() => onCreate('Other')}><Plus size={17} /> New task</button></section><section className="category-cards">{categories.map((category, index) => {
    const Icon = categoryIcons[category]
    const categoryTasks = tasks.filter((task) => task.category === category)
    const finished = categoryTasks.filter((task) => task.completed).length
    const percentage = categoryTasks.length ? Math.round(finished / categoryTasks.length * 100) : 0
    return <button key={category} className={`surface category-card category-card-${category.toLowerCase()}`} onClick={() => onOpenCategory(category)}><div className="category-card-top"><div className={`category-large-icon cat-icon-${category.toLowerCase()}`}><Icon size={21} /></div><span className="category-open"><ArrowRight size={17} /></span></div><div className="category-title-line"><h2>{category}</h2><span>{categoryTasks.length} {categoryTasks.length === 1 ? 'task' : 'tasks'}</span></div><p>{details[category]}</p><div className="category-progress"><div><span>Completed</span><strong>{finished} / {categoryTasks.length}</strong></div><div className="progress-track"><i style={{ width: `${percentage}%` }} /></div></div><div className="category-card-index">0{index + 1}</div></button>
  })}</section><section className="category-note"><div className="note-mark"><Check size={15} /></div><p><strong>Small things add up.</strong> Everything you track gets a little easier to manage.</p></section></>
}

function SettingsPage({ preferences, onPreferences, onClear, tasksCount }) {
  return <><section className="page-heading-row"><div><div className="eyebrow">MAKE TASKMATE YOURS</div><h1>Settings</h1><p>Adjust your workspace and local data.</p></div></section><div className="settings-layout">
    <section className="surface settings-section"><div className="settings-section-heading"><div className="settings-section-icon"><UserRound size={18} /></div><div><h2>Profile</h2><p>Your name appears in the workspace.</p></div></div><label className="field-label" htmlFor="display-name">Display name</label><input id="display-name" className="text-field settings-name" value={preferences.displayName} maxLength={40} onChange={(event) => onPreferences((current) => ({ ...current, displayName: event.target.value }))} placeholder="Your name" /><div className="settings-divider" /><div className="settings-option"><div><strong>Show profile in sidebar</strong><span>Display your name and avatar at the bottom of the navigation.</span></div><button className={`toggle ${preferences.showProfile ? 'toggle-on' : ''}`} role="switch" aria-checked={preferences.showProfile} aria-label="Show profile in sidebar" onClick={() => onPreferences((current) => ({ ...current, showProfile: !current.showProfile }))}><i /></button></div></section>
    <section className="surface settings-section"><div className="settings-section-heading"><div className="settings-section-icon"><Sun size={18} /></div><div><h2>Appearance</h2><p>Choose the look that feels right.</p></div></div><div className="theme-options"><button className={`theme-option ${preferences.theme === 'light' ? 'theme-selected' : ''}`} onClick={() => onPreferences((current) => ({ ...current, theme: 'light' }))}><span className="theme-preview theme-preview-light"><i /><i /><i /></span><span><Sun size={16} /> Light</span>{preferences.theme === 'light' && <Check size={16} />}</button><button className={`theme-option ${preferences.theme === 'dark' ? 'theme-selected' : ''}`} onClick={() => onPreferences((current) => ({ ...current, theme: 'dark' }))}><span className="theme-preview theme-preview-dark"><i /><i /><i /></span><span><Moon size={16} /> Dark</span>{preferences.theme === 'dark' && <Check size={16} />}</button></div></section>
    <section className="surface settings-section data-settings"><div className="settings-section-heading"><div className="settings-section-icon"><Settings2 size={18} /></div><div><h2>Local data</h2><p>Your tasks and preferences are stored only in this browser.</p></div></div><div className="data-summary"><span>{tasksCount} saved {tasksCount === 1 ? 'task' : 'tasks'}</span><span className="local-only-label"><i /> Stored on this device</span></div><div className="settings-divider" /><div className="settings-option"><div><strong>Clear all local data</strong><span>Remove saved tasks and reset your theme and profile settings.</span></div><button className="button button-danger-outline" onClick={onClear}>Clear data</button></div></section>
  </div></>
}

function EmptyState({ title, message, onCreate, actionLabel = 'Add a task' }) {
  return <div className="empty-state"><div className="empty-illustration"><ClipboardList size={23} /><span><Check size={11} /></span></div><h3>{title}</h3><p>{message}</p><button className="button button-soft" onClick={onCreate}><Plus size={15} />{actionLabel}</button></div>
}

function ConfirmDialog({ onCancel, onConfirm }) {
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel() }}><section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="clear-title"><div className="confirm-icon"><X size={19} /></div><h2 id="clear-title">Clear local data?</h2><p>This removes every task and resets your theme and profile settings. This cannot be undone.</p><div className="confirm-actions"><button className="button button-secondary" onClick={onCancel}>Cancel</button><button className="button button-danger" onClick={onConfirm}>Clear data</button></div></section></div>
}

export default App
