import { Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* แถบเมนูจำลอง (เดี๋ยวเราค่อยซ่อนทีหลัง เอาไว้กดเทสต์ก่อน) */}
      <nav className="bg-indigo-600 p-4 text-white flex justify-center gap-6 shadow-md">
        <Link to="/" className="hover:text-indigo-200 font-medium">หน้า Login</Link>
        <Link to="/register" className="hover:text-indigo-200 font-medium">หน้า Register</Link>
        <Link to="/dashboard" className="hover:text-indigo-200 font-medium">หน้า Dashboard</Link>
      </nav>

      {/* พื้นที่สำหรับแสดงหน้าเว็บตาม URL */}
      <div className="p-4">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </div>
    </div>
  )
}

export default App