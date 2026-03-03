import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../api/firebase'
import { onAuthStateChanged, type User } from 'firebase/auth'
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore'

// สร้าง Type เพื่อให้ TypeScript ช่วยเช็คความถูกต้อง
interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  core_role: string;
  group: string;
}

export default function Register() {
  const [leaders, setLeaders] = useState<Member[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLinking, setIsLinking] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // 1. เช็คว่าใครกำลัง Login ค้างอยู่
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser(user)
        fetchEligibleLeaders()
      } else {
        navigate('/') // ถ้าไม่ได้ Login ให้เตะกลับหน้าแรก
      }
    })
    return () => unsubscribe()
  }, [navigate])

  const fetchEligibleLeaders = async () => {
    try {
      const membersRef = collection(db, 'members')
      // ดึงเฉพาะคนที่ยังว่าง (ยังไม่ได้ผูกบัญชี)
      const q = query(membersRef, where('linked_uid', '==', null))
      const querySnapshot = await getDocs(q)

      const availableLeaders: Member[] = []
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        // กรองเฉพาะระดับผู้นำ (คุณสามารถเพิ่ม/ลด คำในวงเล็บนี้ได้ตาม Master Data เลยครับ)
        if (['หัวหน้าวง', 'ผู้รับผิดชอบ'].includes(data.core_role)) {
          availableLeaders.push({
            id: doc.id,
            first_name: data.first_name,
            last_name: data.last_name,
            nickname: data.nickname,
            core_role: data.core_role,
            group: data.group
          })
        }
      })

      // เรียงตามตัวอักษรชื่อจริง ให้หาง่ายๆ
      availableLeaders.sort((a, b) => a.first_name.localeCompare(b.first_name))
      setLeaders(availableLeaders)
    } catch (error) {
      console.error("❌ Error fetching leaders:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBindAccount = async () => {
    if (!selectedId || !currentUser) return
    setIsLinking(true)

    try {
      // เอา Google UID ไปอัปเดตใส่ใน Master Data ของคนที่เลือก!
      const memberRef = doc(db, 'members', selectedId)
      await updateDoc(memberRef, {
        linked_uid: currentUser.uid
      })

      console.log("🎉 ผูกบัญชีสำเร็จ!")
      navigate('/dashboard') // พุ่งทะลุไป Dashboard ทันที
    } catch (error) {
      console.error("❌ Error linking account:", error)
      alert("เกิดข้อผิดพลาดในการผูกบัญชีครับ")
      setIsLinking(false)
    }
  }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50">กำลังโหลดรายชื่อ... ⏳</div>
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-2">ยืนยันตัวตน</h2>
        <p className="text-gray-600 mb-6 text-sm">
          กรุณาเลือกรายชื่อของคุณจากระบบการ เพื่อผูกกับบัญชี <br/>
          <span className="font-semibold text-gray-800">{currentUser?.email}</span>
        </p>
        
        <div className="text-left mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            เลือกรายชื่อของคุณ:
          </label>
          <select 
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 bg-gray-50 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
          >
            <option value="" disabled>-- ค้นหารายชื่อ / ตำแหน่ง --</option>
            {leaders.map(leader => (
              <option key={leader.id} value={leader.id}>
                {leader.first_name} {leader.last_name} ({leader.nickname}) - {leader.group}
              </option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleBindAccount}
          disabled={!selectedId || isLinking}
          className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-colors ${
            !selectedId || isLinking ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'
          }`}
        >
          {isLinking ? 'กำลังผูกบัญชี... ⏳' : '🔗 ยืนยันการผูกบัญชี'}
        </button>
      </div>
    </div>
  )
}