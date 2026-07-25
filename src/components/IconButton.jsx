import Icon from './Icon'
import './IconButton.css'

export default function IconButton({
  name,
  label,
  size,
  as: Component = 'button',
  className = '',
  ...props
}) {
  const extra = Component === 'button' ? { type: 'button' } : {}
  return (
    <Component aria-label={label} className={`icon-btn ${className}`} {...extra} {...props}>
      <Icon name={name} style={size ? { fontSize: size } : undefined} />
    </Component>
  )
}
