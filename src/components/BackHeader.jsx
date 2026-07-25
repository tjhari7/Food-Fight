import IconButton from './IconButton'
import './BackHeader.css'

export default function BackHeader({ onBack, label = 'Back', icon = 'chevron_left' }) {
  return (
    <IconButton
      name={icon}
      label={label}
      className="back-header icon-btn--filled"
      onClick={onBack}
    />
  )
}
