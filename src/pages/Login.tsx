import { useState, useEffect } from 'react'
import { auth, db } from '../api/firebase' // นำเข้า db มาด้วย
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  type User 
} from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore' // เครื่องมือจัดการฐานข้อมูล

function Login() {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // อัปเกรดฟังก์ชัน Login: ล็อกอินเสร็จแล้วให้เซฟลง Database ด้วย
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const loggedInUser = result.user

      // 1. ชี้เป้าไปที่แฟ้มข้อมูลของผู้ใช้คนนี้ในคอลเล็กชัน 'users'
      const userRef = doc(db, 'users', loggedInUser.uid)
      
      // 2. ลองดึงข้อมูลมาดูว่าเคยมีประวัติไหม
      const userSnap = await getDoc(userRef)

      // 3. ถ้าไม่มี (แปลว่าเพิ่งล็อกอินครั้งแรก) ให้สร้างใหม่!
      if (!userSnap.exists()) {
        await setDoc(userRef, {
          uid: loggedInUser.uid,
          displayName: loggedInUser.displayName || 'Unknown Member',
          email: loggedInUser.email || '',
          role: 'member', // ให้ตำแหน่งเริ่มต้นเป็นสมาชิกธรรมดา
          createdAt: new Date()
        })
        console.log("🎉 สร้างโปรไฟล์สมาชิกใหม่ใน Firestore สำเร็จ!")
      } else {
        console.log("👋 ยินดีต้อนรับกลับมาครับ!")
      }

    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการล็อกอิน:", error)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("เกิดข้อผิดพลาดในการออกจากระบบ:", error)
    }
  }

  // ทริคสร้างรูปโปรไฟล์จากชื่อ (ถ้าไม่มีรูปจาก Google)
  const getAvatar = (name: string | null) => {
    return name 
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`
      : 'https://ui-avatars.com/api/?name=User&background=random'
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Kotekitai System
        </h1>

        {user ? (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              {/* เปลี่ยนมาใช้ฟังก์ชัน getAvatar ที่เราสร้างไว้ */}
              <img 
                src={user.photoURL || getAvatar(user.displayName)} 
                alt="Profile" 
                className="w-20 h-20 rounded-full border-4 border-indigo-100 object-cover"
              />
              <div>
                <p className="text-lg font-semibold text-gray-800">{user.displayName}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
                {/* แอบใส่ Badge ตำแหน่งโชว์นิดนึง */}
                <span className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                  Logged In
                </span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="mt-6 w-full bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ออกจากระบบ
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">กรุณาเข้าสู่ระบบเพื่อดำเนินการต่อ</p>
            <button 
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
              เข้าสู่ระบบด้วย Google
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default Login