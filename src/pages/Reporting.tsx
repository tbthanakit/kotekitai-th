import { useState, useEffect } from 'react'
import { db } from '../api/firebase'
import { collection, getDocs, query, where, addDoc, Timestamp, orderBy } from 'firebase/firestore'

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  nickname: string;
}

interface Meeting {
  id: string;
  title: string;
  date: string;
}

export default function Reporting() {
  const [type, setType] = useState<'LEAVE' | 'LATE'>('LEAVE')
  const [members, setMembers] = useState<Member[]>([])
  const [meetings, setMeetings] = useState<Meeting[]>([])
  
  // Search & Selection State
  const [search, setSearch] = useState('')
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [selectedMeetingId, setSelectedMeetingId] = useState('')
  const [lateTime, setLateTime] = useState('13:30')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  const fetchInitialData = async () => {
    // 1. ดึงรายชื่อสมาชิกทั้งหมด (ทำ Cache ไว้ในเครื่องเพื่อใช้ทำ Autocomplete)
    const memSnap = await getDocs(collection(db, 'members'))
    const memList = memSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Member))
    setMembers(memList)

    // 2. ดึงวาระการประชุมที่ยังมาไม่ถึง (หรือของวันนี้)
    const today = new Date().toISOString().split('T')[0]
    const meetSnap = await getDocs(query(collection(db, 'meetings'), where('date', '>=', today), orderBy('date', 'asc')))
    const meetList = meetSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Meeting))
    setMeetings(meetList)
  }

  // กรองรายชื่อสมาชิกตามที่พิมพ์
  const filteredMembers = search.length > 1 
    ? members.filter(m => 
        m.id.includes(search) || 
        m.first_name.includes(search) || 
        m.last_name.includes(search) || 
        m.nickname.includes(search)
      ).slice(0, 10) // แสดงแค่ 10 รายการเพื่อความเร็ว
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedMember || !selectedMeetingId) return alert('กรุณาระบุชื่อและรายการประชุม')

    setIsSubmitting(true)
    try {
      await addDoc(collection(db, 'attendance_records'), {
        meeting_id: selectedMeetingId,
        member_id: selectedMember.id,
        status: type,
        reported_late_time: type === 'LATE' ? lateTime : null,
        created_at: Timestamp.now(),
        updated_at: Timestamp.now()
      })
      
      alert(`บันทึกการแจ้ง${type === 'LEAVE' ? 'ลา' : 'สาย'}สำเร็จ!`)
      // Reset Form
      setSearch('')
      setSelectedMember(null)
      setSelectedMeetingId('')
    } catch (error) {
      alert('เกิดข้อผิดพลาดในการบันทึก')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* Tab Switcher */}
        <div className="flex bg-gray-100 p-1 m-4 rounded-2xl">
          <button onClick={() => setType('LEAVE')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'LEAVE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>แจ้งลาประชุม</button>
          <button onClick={() => setType('LATE')} className={`flex-1 py-3 rounded-xl font-bold transition-all ${type === 'LATE' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}>แจ้งเข้าสาย</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-0 space-y-5">
          {/* Autocomplete Section */}
          <div className="relative">
            <label className="block text-sm font-bold text-gray-700 mb-1">ค้นหาสมาชิก (ชื่อ, ชื่อเล่น หรือ ID)</label>
            <input 
              type="text" 
              value={selectedMember ? `${selectedMember.first_name} ${selectedMember.last_name} (${selectedMember.nickname})` : search}
              onChange={(e) => { setSearch(e.target.value); setSelectedMember(null); }}
              placeholder="พิมพ์เพื่อค้นหา..."
              className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              readOnly={!!selectedMember}
            />
            {selectedMember && (
              <button type="button" onClick={() => {setSelectedMember(null); setSearch('');}} className="absolute right-3 top-9 text-gray-400 text-sm">แก้ไข</button>
            )}
            
            {/* Dropdown ผลลัพธ์การค้นหา */}
            {!selectedMember && filteredMembers.length > 0 && (
              <div className="absolute z-10 w-full bg-white border border-gray-100 rounded-xl shadow-2xl mt-1 max-h-60 overflow-y-auto">
                {filteredMembers.map(m => (
                  <div key={m.id} onClick={() => setSelectedMember(m)} className="p-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0">
                    <div className="font-bold text-gray-800">{m.first_name} {m.last_name} ({m.nickname})</div>
                    <div className="text-xs text-gray-400">ID: {m.id}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meeting Selection */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">เลือกรายการประชุม</label>
            <select 
              value={selectedMeetingId} 
              onChange={e => setSelectedMeetingId(e.target.value)}
              className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
              required
            >
              <option value="">-- เลือกวาระการประชุม --</option>
              {meetings.map(m => (
                <option key={m.id} value={m.id}>{m.date} - {m.title}</option>
              ))}
            </select>
          </div>

          {/* Time Picker สำหรับกรณีแจ้งสาย */}
          {type === 'LATE' && (
            <div className="animate-in slide-in-from-top duration-200">
              <label className="block text-sm font-bold text-gray-700 mb-1">ระบุเวลาที่จะมาถึง</label>
              <input 
                type="time" 
                value={lateTime} 
                onChange={e => setLateTime(e.target.value)}
                className="w-full border-gray-200 border rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                required
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`w-full text-white font-bold py-4 rounded-2xl shadow-lg transition-all ${type === 'LEAVE' ? 'bg-red-500 hover:bg-red-600 shadow-red-100' : 'bg-amber-500 hover:bg-amber-600 shadow-amber-100'}`}
          >
            {isSubmitting ? 'กำลังบันทึก...' : `ยืนยันการแจ้ง${type === 'LEAVE' ? 'ลา' : 'สาย'}`}
          </button>
        </form>
      </div>
    </div>
  )
}