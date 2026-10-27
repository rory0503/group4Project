import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ProfilePage from './profilePage/ProfilePage.jsx'



createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ProfilePage />
  </StrictMode>,
)
