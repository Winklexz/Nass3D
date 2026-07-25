import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useCountUp } from '@/hooks/useCountUp'

export default function StatCard({ label, value, format, color = 'text-foreground', linkTo, linkLabel, delay = 0 }) {
  const display = useCountUp(value, format)
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      whileHover={{ y: -2 }}
      className="glass-panel p-4"
    >
      <div className="mb-2 text-[10.5px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-ui text-2xl font-bold ${color}`}>{display}</div>
      {linkTo && (
        <Link to={linkTo} className="mt-1.5 block text-[11.5px] text-muted-foreground transition-colors hover:text-primary">
          {linkLabel}
        </Link>
      )}
    </motion.div>
  )
}
