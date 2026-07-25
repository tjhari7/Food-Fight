import { useNavigate, Link } from 'react-router-dom'
import BackHeader from '../components/BackHeader'
import Icon from '../components/Icon'
import './Settings.css'

export default function Settings() {
  const navigate = useNavigate()

  return (
    <div className="page">
      <div className="page-header">
        <BackHeader onBack={() => navigate('/meals')} />
      </div>
      <h1 className="settings__title">Settings</h1>

      <nav className="settings__list">
        <Link to="/categories" className="settings__item">
          <span className="settings__item-label">Edit Meal Types</span>
          <Icon name="chevron_right" className="settings__item-chevron" />
        </Link>

        {/* Onboarding intentionally links nowhere yet — the destination page
            doesn't exist. The row is a plain button with no handler. */}
        <button type="button" className="settings__item">
          <span className="settings__item-label">Onboarding</span>
          <Icon name="chevron_right" className="settings__item-chevron" />
        </button>
      </nav>
    </div>
  )
}
