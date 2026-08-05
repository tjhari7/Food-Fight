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

        {/* Two onboarding variants under test. Both are prototypes: they build
            a roster in session state and write nothing, so either can be run
            repeatedly without touching the real meal list. */}
        <Link to="/onboarding/a" className="settings__item">
          <span className="settings__item-label">Onboarding A</span>
          <Icon name="chevron_right" className="settings__item-chevron" />
        </Link>

        <Link to="/onboarding/b" className="settings__item">
          <span className="settings__item-label">Onboarding B</span>
          <Icon name="chevron_right" className="settings__item-chevron" />
        </Link>
      </nav>
    </div>
  )
}
