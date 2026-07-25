export default function Icon({ name, className = '', style, ...props }) {
  return (
    <span className={`material-symbols-outlined ${className}`} style={style} {...props}>
      {name}
    </span>
  )
}
