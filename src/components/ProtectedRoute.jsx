import { Navigate } from 'react-router-dom'

export default function ProtectedRoute({ user, adminOnly, isAdmin, children }) {
  if (!user) return <Navigate to="/login" />
  if (adminOnly && !isAdmin) return <Navigate to="/" />
  return children
}
