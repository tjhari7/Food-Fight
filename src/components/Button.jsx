import './Button.css'

export default function Button({
  variant = 'primary',
  as: Component = 'button',
  className = '',
  children,
  ...props
}) {
  return (
    <Component className={`btn btn--${variant} ${className}`} {...props}>
      {children}
    </Component>
  )
}
