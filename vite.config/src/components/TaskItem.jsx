import { Check, MoreHorizontal } from 'lucide-react'

function TaskItem({ task, today, onToggle, onEdit, onDelete }) {
  const overdue = !task.completed && task.dueDate < today

  return <article className={`task-row ${task.completed ? 'task-completed' : ''}`}>
    <button className={`task-checkbox ${task.completed ? 'checked' : ''}`} onClick={() => onToggle(task.id)} aria-label={task.completed ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}>{task.completed && <Check size={13} strokeWidth={3} />}</button>
    <button className="task-main" onClick={() => onEdit(task)}><span className="task-title">{task.title}</span>{task.description && <span className="task-description">{task.description}</span>}</button>
    <span className={`task-category task-category-${task.category.toLowerCase()}`}><i />{task.category}</span>
    <span className={`priority-label priority-${task.priority.toLowerCase()}`}><i />{task.priority}</span>
    <span className={`task-due ${overdue ? 'due-overdue' : ''}`}>{new Date(`${task.dueDate}T12:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
    {onDelete && <div className="task-actions"><button className="task-more" aria-label={`Delete ${task.title}`} title="Delete task" onClick={() => onDelete(task.id)}><MoreHorizontal size={17} /></button></div>}
  </article>
}

export default TaskItem