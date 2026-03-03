import { useState, useEffect } from 'react'
import { db, auth } from '../api/firebase'
import { collection, getDocs, query, orderBy, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore'

interface Meeting {
  id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  type: string;
  registration_assigned: string[];
}

export default function MeetingManagement() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null) // ถ้ามีค่า แปลว่ากำลัง "แก้ไข"

  // Form State
  const [title, setTitle] = useState('ประชุมพิเศษ')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('13:00')
  const [endTime, setEndTime] = useState('17:00')
  const [regAssigned, setRegAssigned] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    fetchMeetings()
  }, [])

  const fetchMeetings = async () => {
    const q = query(collection(db, 'meetings'), orderBy('date', 'desc'))
    const snapshot = await getDocs(q)
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting))
    setMeetings(list)
  }

  const openModal = (meeting?: Meeting) => {
    if (meeting) {
      // โหมดแก้ไข: โยนข้อมูลเดิมใส่ฟอร์ม
      setEditingId(meeting.id)
      setTitle(meeting.title)
      setDate(meeting.date)
      setStartTime(meeting.start_time)
      setEndTime(meeting.end_time)
      setRegAssigned(meeting.registration_assigned?.join(', ') || '')
    } else {
      // โหมดสร้างใหม่: ล้างฟอร์ม
      setEditingId(null)
      setTitle('ประชุมพิเศษ')
      setDate('')
      setStartTime('13:00')
      setEndTime('17:00')
      setRegAssigned('')
    }
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const currentUid = auth.currentUser?.uid
    if (!currentUid) return alert('กรุณาล็อกอินใหม่')
    if (!date || !title) return alert('กรุณากรอกข้อมูลให้ครบ')

    setIsLoading(true)
    try {
      const meetingData = {
        title,
        date,
        start_time: startTime,
        end_time: endTime,
        registration_assigned: regAssigned ? regAssigned.split(',').map(id => id.trim()) : [],
      }

      if (editingId) {
        // --- แก้ไขรายการเดิม ---
        await updateDoc(doc(db, 'meetings', editingId), meetingData)
        alert('อัปเดตข้อมูลสำเร็จ!')
      } else {
        // --- สร้างรายการใหม่ ---
        const formattedDate = date.replace(/-/g, '')
        const formattedTime = startTime.replace(/:/g, '')
        const customId = `MANUAL_${formattedDate}_${formattedTime}`
        
        await setDoc(doc(db, 'meetings', customId), {
          ...meetingData,
          type: 'manual',
          created_by: currentUid,
          createdAt: new Date()
        })
        alert('สร้างวาระสำเร็จ!')
      }
      
      setIsModalOpen(false)
      fetchMeetings()
    } catch (error) {
      console.error(error)
      alert('เกิดข้อผิดพลาด')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวาระการประชุมนี้?')) return
    try {
      await deleteDoc(doc(db, 'meetings', id))
      fetchMeetings()
    } catch (error) {
      alert('ลบไม่สำเร็จ')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900">จัดการวาระการประชุม</h1>
            <p className="text-gray-500 mt-1">สร้าง แก้ไข และลบวาระการประชุมทั้งหมดในระบบ</p>
          </div>
          <button 
            onClick={() => openModal()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center gap-2"
          >
            <span>+</span> สร้างรายการประชุม
          </button>
        </div>

        {/* Meeting List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">วาระ / วันที่</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">เวลา</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase">ประเภท</th>
                <th className="p-4 text-sm font-semibold text-gray-600 uppercase text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {meetings.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-gray-800">{m.title}</div>
                    <div className="text-sm text-gray-500">{m.date}</div>
                  </td>
                  <td className="p-4 text-gray-600 font-medium">
                    {m.start_time} - {m.end_time}
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${m.type === 'auto' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                      {m.type?.toUpperCase()}
                    </span>
                  </td>
                  <td className="p-4 text-right space-x-2">
                    <button onClick={() => openModal(m)} className="text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">แก้ไข</button>
                    <button onClick={() => handleDelete(m.id)} className="text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors">ลบ</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {meetings.length === 0 && <div className="p-20 text-center text-gray-400">ไม่พบวาระการประชุมในระบบ</div>}
        </div>
      </div>

      {/* --- Dialog (Modal) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">{editingId ? 'แก้ไขวาระการประชุม' : 'สร้างวาระการประชุมใหม่'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">หัวข้อประชุม</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">วันที่</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">เวลาเริ่ม</label>
                  <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">เวลาสิ้นสุด</label>
                  <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">เจ้าหน้าที่ลงทะเบียน (Member ID)</label>
                <input type="text" placeholder="ใส่ ID คั่นด้วยจุลภาค เช่น 1234, 5678" value={regAssigned} onChange={e => setRegAssigned(e.target.value)} className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none" />
                <p className="text-[10px] text-gray-400 mt-1">* ระบุ ID ของคนที่มีสิทธิ์กดลงทะเบียนหน้างานในวาระนี้</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">ยกเลิก</button>
                <button type="submit" disabled={isLoading} className="flex-1 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                  {isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}