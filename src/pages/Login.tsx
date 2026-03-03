import { useNavigate } from 'react-router-dom'
import { auth, db } from '../api/firebase'
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'

export default function Login() {
  const navigate = useNavigate() // เครื่องมือสำหรับเตะเปลี่ยนหน้าเว็บ

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      const loggedInUser = result.user

      // 1. ไปที่แฟ้ม members (Master Data ของเรา)
      const membersRef = collection(db, 'members')
      
      // 2. ตั้งคำถาม: "มีใครในแฟ้มนี้ ที่ช่อง linked_uid ตรงกับ Google UID ของคนนี้ไหม?"
      const q = query(membersRef, where('linked_uid', '==', loggedInUser.uid))
      const querySnapshot = await getDocs(q)

      // 3. ตัดสินใจตามผลลัพธ์
      if (!querySnapshot.empty) {
        // กรณีที่ 1: เจอข้อมูล! แปลว่าเคยผูกบัญชีไว้แล้ว
        console.log("✅ ยินดีต้อนรับกลับมา! เตะเข้า Dashboard")
        navigate('/dashboard')
      } else {
        // กรณีที่ 2: ไม่เจอข้อมูล! แปลว่าล็อกอินครั้งแรก หรือยังไม่ได้ผูกบัญชี
        console.log("⚠️ ยังไม่ได้ผูกบัญชี! เตะเข้าหน้า Register")
        navigate('/register')
      }

    } catch (error) {
      console.error("❌ เกิดข้อผิดพลาดในการล็อกอิน:", error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-indigo-600 mb-6">
          Kotekitai System
        </h1>
        <p className="text-gray-600 mb-6">สำหรับหัวหน้าและผู้ดูแลระบบเท่านั้น</p>
        
        <button 
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    </div>
  )
}