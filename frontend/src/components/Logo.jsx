import { Link } from 'react-router-dom'

export default function Logo({ to = '/', size = 'text-3xl' }) {
  return (
    <Link to={to} className="display inline-flex items-baseline leading-none press-sm">
      <span className={`${size} text-ink`}>scribble</span>
      <span className={`${size} text-pink`}>!</span>
    </Link>
  )
}
