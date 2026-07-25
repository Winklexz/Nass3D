import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

const LEVEL_BORDER = { atrasado: 'border-l-destructive', urgente: 'border-l-warning', ok: 'border-l-success' }

export default function AlertCard({ icon, text, level = 'ok', linkTo, linkLabel, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`glass-panel flex items-center justify-between gap-3 border-l-[3px] px-4 py-3 text-sm ${LEVEL_BORDER[level]}`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="font-medium text-foreground">{text}</span>
      </div>
      {linkTo && (
        <Link to={linkTo} className="whitespace-nowrap font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground">
          {linkLabel}
        </Link>
      )}
    </motion.div>
  )
}
