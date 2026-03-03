import { useState, useEffect } from 'react'
import { db } from '../api/firebase'
import { collection, getDocs, doc, query, where, setDoc, serverTimestamp } from 'firebase/firestore'

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
  group: string;
}

interface Meeting {
  id: string;
  title: string;
  start_time: string;
  registration_assigned: string[];
}

export default function Registration() {
  const [step, setStep] = useState(1) // 1: List Meetings, 2: Check-in
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null)
  
  // Modal & Verification State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [myId, setMyId] = useState('')
  const [error, setError] = useState('')
  
  const [membersGrouped, setMembersGrouped] = useState<Record<string, Member[]>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchTodayMeetings()
  }, [])

  // ดึงรายการประชุมทั้งหมดของวันนี้
  const fetchTodayMeetings = async () => {
    setIsLoading(true)
    const today = new Date().toISOString().split('T')[0]
    const q = query(collection(db, 'meetings'), where('date', '==', today))
    const snap = await getDocs(q)
    const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting))
    setMeetings(list)
    setIsLoading(false)
  }

  // เมื่อเลือกรายการประชุม -> เปิด Modal ถาม ID
  const handleSelectMeeting = (meeting: Meeting) => {
    setSelectedMeeting(meeting)
    setIsModalOpen(true)
    setError('')
    setMyId('')
  }

  // ตรวจสอบสิทธิ์จาก ID ใน Modal
  const handleVerifyID = async () => {
    if (!selectedMeeting) return
    
    if (selectedMeeting.registration_assigned.includes(myId)) {
      // ผ่านการตรวจสอบ -> โหลดรายชื่อสมาชิก
      await loadAndGroupMembers()
      setIsModalOpen(false)
      setStep(2)
    } else {
      setError('คุณไม่มีสิทธิ์ลงทะเบียนในวาระนี้ กรุณาตรวจสอบ ID อีกครั้ง')
    }
  }

  const loadAndGroupMembers = async () => {
    const memSnap = await getDocs(collection(db, 'members'))
    const allMembers = memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member))
    
    const grouped = allMembers.reduce((acc, curr) => {
      const groupName = curr.group || 'ไม่ระบุกลุ่ม'
      if (!acc[groupName]) acc[groupName] = []
      acc[groupName].push(curr)
      return acc
    }, {} as Record<string, Member[]>)

    setMembersGrouped(grouped)
  }

  const handleCheckIn = async (memberId: string) => {
    if (!selectedMeeting) return
    const now = new Date()
    const [h, m] = selectedMeeting.start_time.split(':').map(Number)
    const startTime = new Date()
    startTime.setHours(h, m, 0)

    const diffMs = now.getTime() - startTime.getTime()
    const latenessMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)))

    try {
      const recordId = `${selectedMeeting.id}_${memberId}`
      await setDoc(doc(db, 'attendance_records', recordId), {
        meeting_id: selectedMeeting.id,
        member_id: memberId,
        status: 'ATTENDED',
        actual_checkin_time: serverTimestamp(),
        lateness_minutes: latenessMinutes,
        updated_at: serverTimestamp()
      })
      alert(`ลงทะเบียนสำเร็จ! (สาย ${latenessMinutes} นาที)`)
    } catch (e) {
      alert('บันทึกผิดพลาด')
    }
  }

  if (isLoading) return <div className="p-10 text-center">กำลังโหลดวาระวันนี้...</div>

  return (
    <div className="min-h-screen bg-slate-50 p-4 pb-20">
      <div className="max-w-md mx-auto">
        
        {/* STEP 1: แสดงลิสต์ประชุมวันนี้ */}
        {step === 1 && (
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-6 px-2">รายการประชุมวันนี้</h1>
            {meetings.length === 0 ? (
              <div className="bg-white p-10 rounded-3xl text-center text-gray-400 border border-dashed">
                ไม่มีวาระการประชุมในวันนี้
              </div>
            ) : (
              meetings.map(m => (
                <div 
                  key={m.id} 
                  onClick={() => handleSelectMeeting(m)}
                  className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 active:scale-95 transition-all cursor-pointer"
                >
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-gray-800 text-lg leading-tight">{m.title}</h3>
                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold px-2 py-1 rounded-lg">TODAY</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">เวลาเริ่ม: {m.start_time} น.</p>
                </div>
              ))
            )}
          </div>
        )}

        {/* STEP 2: หน้าลงทะเบียน (Expandable) */}
        {step === 2 && selectedMeeting && (
          <div className="space-y-4">
            <button onClick={() => setStep(1)} className="text-indigo-600 text-sm font-bold mb-2 flex items-center gap-1">
              ← กลับไปเลือกวาระ
            </button>
            <div className="bg-indigo-600 text-white p-6 rounded-3xl shadow-lg mb-6">
              <h2 className="text-lg font-bold">{selectedMeeting.title}</h2>
              <p className="text-xs opacity-80">โหมดลงทะเบียนหน้างาน (ID: {myId})</p>
            </div>

            {Object.entries(membersGrouped).map(([groupName, members]) => (
              <details key={groupName} className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <summary className="flex justify-between items-center p-4 cursor-pointer font-bold text-gray-700 list-none">
                  <span>กลุ่ม {groupName} ({members.length})</span>
                  <span className="group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-2 space-y-2 bg-gray-50">
                  {members.map(m => (
                    <div key={m.id} className="bg-white p-3 rounded-xl flex justify-between items-center shadow-sm">
                      <div>
                        <div className="font-bold text-sm text-gray-800">{m.first_name} ({m.nickname})</div>
                        <div className="text-[10px] text-gray-400">ID: {m.id}</div>
                      </div>
                      <button 
                        onClick={() => handleCheckIn(m.id)}
                        className="bg-green-500 text-white text-xs font-bold py-2.5 px-4 rounded-xl active:scale-90 transition-all"
                      >
                        ลงทะเบียน
                      </button>
                    </div>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {/* --- Verification Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">ตรวจสอบสิทธิ์</h2>
            <p className="text-sm text-gray-500 text-center mb-6">ระบุ Member ID ของคุณเพื่อทำรายการ</p>
            
            <input 
              type="text" 
              value={myId}
              onChange={e => setMyId(e.target.value)}
              className={`w-full border-2 rounded-2xl p-4 text-center text-2xl font-bold outline-none mb-2 ${error ? 'border-red-500 bg-red-50' : 'border-gray-100 focus:border-indigo-500'}`}
              placeholder="00000000"
            />
            
            {error && <p className="text-red-500 text-xs text-center mb-4">{error}</p>}
            
            <div className="flex gap-2 mt-4">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 text-gray-400 font-bold text-sm">ยกเลิก</button>
              <button onClick={handleVerifyID} className="flex-1 bg-indigo-600 text-white font-bold py-4 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}