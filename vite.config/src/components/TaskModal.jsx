import { useEffect, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'

const categoryOptions = ['College', 'Personal', 'Work', 'Other']
const priorityOptions = ['Low', 'Medium', 'High']

function localDateString() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function TaskModal({ task, onSave, onClose }) {
  const [form, setForm] = useState({ title: task?.title || '', description: task?.description || '', category: task?.category || 'College', priority: task?.priority || 'Medium', dueDate: task?.dueDate || localDateString() })
  const [error, setError] = useState('')
  const isEditing = Boolean(task?.id)

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (error) setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!form.title.trim()) {
      setError('Give your task a title to continue.')
      return
    }
    if (!form.dueDate) {
      setError('Choose a due date to continue.')
      return
    }
    onSave({ ...form, title: form.title.trim(), description: form.description.trim() })
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section className="task-modal" role="dialog" aria-modal="true" aria-labelledby="task-modal-title"><div className="modal-header"><div><div className="eyebrow">{isEditing ? 'MAKE AN UPDATE' : 'A NEW THING TO DO'}</div><h2 id="task-modal-title">{isEditing ? 'Edit task' : 'Create a task'}</h2></div><button className="plain-icon" aria-label="Close dialog" onClick={onClose}><X size={19} /></button></div>
      <form onSubmit={handleSubmit} noValidate><label className="field-label" htmlFor="task-title">Task name <span>*</span></label><input autoFocus id="task-title" name="title" className={`text-field task-title-input ${error && !form.title.trim() ? 'field-error' : ''}`} placeholder="What needs to get done?" maxLength={100} value={form.title} onChange={updateField} />
        <label className="field-label" htmlFor="task-description">Description <small>Optional</small></label><textarea id="task-description" name="description" className="text-field description-field" placeholder="Add a few details to help future you…" rows={3} maxLength={300} value={form.description} onChange={updateField} />
        <div className="form-two-column"><div><label className="field-label" htmlFor="task-category">Category</label><select id="task-category" name="category" className="text-field" value={form.category} onChange={updateField}>{categoryOptions.map((category) => <option key={category}>{category}</option>)}</select></div><div><label className="field-label" htmlFor="task-priority">Priority</label><select id="task-priority" name="priority" className="text-field" value={form.priority} onChange={updateField}>{priorityOptions.map((priority) => <option key={priority}>{priority}</option>)}</select></div></div>
        <label className="field-label" htmlFor="task-due">Due date</label><div className="date-input-wrap"><CalendarDays size={16} /><input id="task-due" name="dueDate" type="date" className="text-field" value={form.dueDate} onChange={updateField} /></div>
        {error && <p className="form-error" role="alert">{error}</p>}<div className="modal-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">{isEditing ? 'Save changes' : 'Create task'}</button></div>
      </form>
    </section>
  </div>
}

export default TaskModal