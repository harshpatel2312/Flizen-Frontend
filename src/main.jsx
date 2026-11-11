import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import App from './App.jsx'
import FlightListingPage from './pages/FlightListingPage.jsx'
import PassengerDetailsPage from './pages/PassengerDetailsPage.jsx'
import SeatSelectionChoicePage from './pages/SeatSelectionChoicePage.jsx'
import SeatSelectionPage from './pages/SeatSelectionPage.jsx'
import PaymentPage from './pages/PaymentPage.jsx'
import BookingResultPage from './pages/BookingResultPage.jsx'
import MyTripsPage from './pages/MyTripsPage.jsx'
import ProfilePage from './pages/ProfilePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import SignUpPage from './pages/SignUpPage.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes — redirect to dashboard if already signed in */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route
            path="/flights"
            element={
              <ProtectedRoute>
                <FlightListingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/passengers"
            element={
              <ProtectedRoute>
                <PassengerDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seat-choice"
            element={
              <ProtectedRoute>
                <SeatSelectionChoicePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/seats"
            element={
              <ProtectedRoute>
                <SeatSelectionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:bookingId"
            element={
              <ProtectedRoute>
                <PaymentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/payment/:bookingId/processing"
            element={
              <ProtectedRoute>
                <BookingResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/booking/:bookingId"
            element={
              <ProtectedRoute>
                <BookingResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips"
            element={
              <ProtectedRoute>
                <MyTripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/trips/:bookingId"
            element={
              <ProtectedRoute>
                <MyTripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  </React.StrictMode>,
)
