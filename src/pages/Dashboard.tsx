import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../api/firebase'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { collection, query, where, getDocs } from 'firebase/firestore'

// สร้าง Type โครงสร้างข้อมูลให้ตรงกับ Master Data ของเรา
interface MemberData {
  first_name: string;
  last_name: string;
  nickname: string;
  core_role: string;
  group: string;
  regional: string;
  zone: string;
  status: string;
}

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [memberInfo, setMemberInfo] = useState<MemberData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // 1. ตรวจสอบว่าใครกำลัง Login อยู่
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        fetchMemberData(user.uid) // ถ้ามีคน Login ให้ไปดึงข้อมูลมา
      } else {
        navigate('/') // ถ้าไม่ได้ Login เตะกลับหน้าแรก
      }
    })
    return () => unsubscribe()
  }, [navigate])

  // ฟังก์ชันดึงข้อมูลจาก Master Data
  const fetchMemberData = async (uid: string) => {
    try {
      const membersRef = collection(db, 'members')
      const q = query(membersRef, where('linked_uid', '==', uid))
      const querySnapshot = await getDocs(q)

      if (!querySnapshot.empty) {
        // เจอข้อมูลแล้ว! เอาเอกสารแรกที่เจอมาแสดงผล
        const data = querySnapshot.docs[0].data() as MemberData
        setMemberInfo(data)
      } else {
        console.warn("ไม่พบข้อมูลใน Master Data")
      }
    } catch (error) {
      console.error("Error fetching member data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/')
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  // หน้าจอตอนกำลังโหลด
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">กำลังโหลดข้อมูลบัญชาการ... ⏳</div>
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* ส่วนหัว: แถบต้อนรับ */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              สวัสดี, {memberInfo?.nickname || 'ไม่ทราบชื่อ'} 👋
            </h1>
            <p className="text-gray-500 mt-1">
              เข้าสู่ระบบด้วยอีเมล: {currentUser?.email}
            </p>
          </div>
          <button 
            onClick={handleLogout}
            className="bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-4 rounded-lg transition-colors text-sm"
          >
            ออกจากระบบ
          </button>
        </div>

        {/* การ์ดแสดงข้อมูลส่วนตัว (Profile Card) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-indigo-600 mb-4 border-b pb-2">ข้อมูลประจำตัว</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ชื่อ-นามสกุล</p>
              <p className="font-semibold text-gray-800">
                {memberInfo?.first_name} {memberInfo?.last_name}
              </p>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">กลุ่ม</p>
              <p className="font-semibold text-gray-800">{memberInfo?.group}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">ตำแหน่ง (แกน)</p>
              <p className="font-semibold text-indigo-600">{memberInfo?.core_role}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">สังกัดระบบการ</p>
              <p className="font-semibold text-gray-800">
                {memberInfo?.regional} / {memberInfo?.zone}
              </p>
            </div>
          </div>
        </div>

        {/* พื้นที่เตรียมพร้อมสำหรับฟีเจอร์ต่อไป */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl text-center">
          <h3 className="text-indigo-800 font-semibold mb-2">🚀 พื้นที่เตรียมพัฒนาระบบการประชุม</h3>
          <p className="text-indigo-600 text-sm">ส่วนนี้จะถูกพัฒนาเป็นเมนูสร้างวาระและเช็คชื่อสมาชิกในเร็วๆ นี้</p>
        </div>

      </div>
    </div>
  )
}