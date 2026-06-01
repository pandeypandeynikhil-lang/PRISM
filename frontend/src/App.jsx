import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import CustomerDetail from './pages/CustomerDetail'
import Analytics from './pages/Analytics'
import Predict from './pages/Predict'

export default function App() {
  return (
    <BrowserRouter>
      <div className="noise" />
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard"          element={<Dashboard />} />
          <Route path="customers"          element={<Customers />} />
          <Route path="customers/:id"      element={<CustomerDetail />} />
          <Route path="analytics"          element={<Analytics />} />
          <Route path="predict"            element={<Predict />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
