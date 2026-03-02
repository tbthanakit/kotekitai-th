import { useEffect } from 'react'
import { db } from './api/firebase'

function App() {
  useEffect(() => {
    // ลองให้มันพ่นค่า Database ออกมาดูว่าเชื่อมต่อสำเร็จไหม
    console.log("Firebase DB Initialized:", db)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Kotekitai System 🚀
      </h1>
      <p className="text-gray-600">ตรวจสอบ Console (F12) เพื่อดูสถานะ Firebase</p>
    </div>
  )
}

export default App