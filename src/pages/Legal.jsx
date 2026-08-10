import { useNavigate } from 'react-router-dom'
import BackHeader from '../components/BackHeader'
import './Legal.css'

// The Terms and Privacy pages the paywall links to (App Store guideline 3.1.2
// wants both reachable from the purchase screen itself).
//
// These are deliberately NOT drafted legal documents. A privacy policy is a
// factual claim about what a system collects, stores, shares, and retains, and
// terms are a claim about what is being sold — and today none of that exists:
// there is no auth anywhere in src/, no payment integration, and no analytics
// SDK. Writing either document now would mean describing a system that hasn't
// been built, and these are precisely the documents you get held to when the
// real implementation diverges from them.
//
// So each page states the true current position and names what will replace it.
// That is honest to a reader, it keeps the paywall's links from 404ing, and it
// leaves the real drafting until there is a real system to describe.
//
// BEFORE LAUNCH — before the app accepts a single sign-up or payment:
//   * Replace both bodies with the real documents, written from the shipped
//     data flows (Supabase tables, auth provider, IAP receipts, any analytics
//     adopted by then).
//   * Terms may not need drafting at all: Apple publishes a standard EULA that
//     subscription apps are permitted to link instead of authoring their own.
//     See apple.com/legal/internet-services/itunes/dev/stdeula/
//   * Add a monitored contact address to CONTACT below — intentionally left
//     unset rather than filled with a plausible-looking address that nobody
//     reads.
//   * Apple also requires the privacy policy URL in App Store Connect metadata,
//     separately from these links.
//   * Give the real documents an effective date. These placeholders carry none
//     by choice — the app shows no timestamps anywhere — but a published policy
//     needs one to establish which version a user agreed to, and it's the first
//     thing a reader looks for. It comes back with the real text, not before.

// Rendered as the closing section of both documents. Kept as one constant so
// the eventual real address only has to be set in a single place.
const CONTACT =
  'Contact details for privacy and billing questions will be published alongside the full documents.'

const DOCS = {
  terms: {
    title: 'Terms of Use',
    status: 'Not yet published. Food Fight is in development.',
    sections: [
      {
        heading: 'Where this stands',
        paragraphs: [
          'Food Fight is a prototype under active development. It is not finished, it is not being sold, and it is not accepting customers.',
          'This page exists so the links on the subscription screen resolve to an honest answer rather than a dead URL. It is not a contract, and nothing on it is offered as one.',
        ],
      },
      {
        heading: 'Nothing is currently for sale',
        paragraphs: [
          'The subscription screen is a design prototype. It is not connected to a payment processor, no purchase can be completed, and no money can change hands.',
          'The prices shown there are placeholders used for layout and user testing. They are not an offer, and they are not a commitment to charge those amounts if the app does launch.',
        ],
      },
      {
        heading: 'What will replace this page',
        paragraphs: [
          'Before any subscription is sold, this placeholder will be replaced by full terms covering billing and what each plan includes; free-trial length and what happens when it ends; renewal, cancellation, and refunds; acceptable use of the app; who owns the meals and lists you add; the warranty and liability position; governing law; and how changes to the terms are communicated.',
          'That document will describe the product as it actually works at launch, which is why it is not being written ahead of building it.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [CONTACT],
      },
    ],
  },

  privacy: {
    title: 'Privacy Policy',
    status: 'Not yet published. Food Fight is in development.',
    sections: [
      {
        heading: 'Where this stands',
        paragraphs: [
          'Food Fight is a prototype under active development. This page exists so the links on the subscription screen resolve to an honest answer rather than a dead URL.',
          'It is not a privacy policy. It is a plain description of what the app does and does not collect as it stands today.',
        ],
      },
      {
        heading: 'What the app collects today',
        // Each of these is a checked claim about the current codebase, not a
        // reassurance. If any stops being true, this section is wrong and has
        // to change with the commit that breaks it.
        paragraphs: [
          'No accounts. The app has no authentication of any kind. The email and password fields in the onboarding flow are part of a visual prototype — what you type stays in the browser tab and is discarded when you close it. It is never transmitted and never stored.',
          'No tracking. There is no analytics SDK, no advertising pixel, and no third-party tracking script anywhere in the app.',
          'No payment details. The subscription screen does not reach a payment processor, so no card or billing information is ever requested or handled.',
          'Meals and meal types. The meals and categories you create are stored in a hosted Supabase database so they survive a refresh. Because there are no accounts, they are not attached to any identity.',
        ],
      },
      {
        heading: 'What will replace this page',
        paragraphs: [
          'Before the app accepts a sign-up or a payment, this placeholder will be replaced by a full privacy policy covering what personal data is collected and why; how long each category is kept; the third-party processors involved in hosting, storage, payments, and any analytics adopted by then; how to request a copy of your data or have it deleted; and how changes to the policy are communicated.',
          'That document will describe the system as it is actually built, which is why it is not being written in advance of building it.',
        ],
      },
      {
        heading: 'Questions',
        paragraphs: [CONTACT],
      },
    ],
  },
}

export default function Legal({ doc }) {
  const navigate = useNavigate()
  const { title, status, sections } = DOCS[doc]

  // The paywall opens these in a new tab so the in-memory onboarding flow isn't
  // torn down, and in a fresh tab there is nothing to go back to. React Router
  // stamps an `idx` into history state, so a value above 0 means this page was
  // reached by navigating inside the app and Back can pop the stack; otherwise
  // it lands on Home rather than dead-ending on a button that does nothing.
  function handleBack() {
    if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }

  return (
    <div className="page legal">
      <div className="page-header">
        <BackHeader onBack={handleBack} />
      </div>

      <h1 className="legal__title">{title}</h1>
      <p className="legal__status">{status}</p>

      {sections.map((section) => (
        <section key={section.heading} className="legal__section">
          <h2 className="legal__heading">{section.heading}</h2>
          {section.paragraphs.map((text) => (
            <p key={text} className="legal__body">
              {text}
            </p>
          ))}
        </section>
      ))}
    </div>
  )
}
