import { useState } from 'react'
import { db } from '../api/firebase'
import { doc, setDoc } from 'firebase/firestore'
// นำเข้าไฟล์ JSON (ถ้า TypeScript บ่นแดงๆ ที่บรรทัดนี้ ปล่อยผ่านไปก่อนได้ครับ)
import membersData from '../data/members.json' 

export default function ImportData() {
  const [status, setStatus] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleImport = async () => {
    setIsLoading(true)
    setStatus('กำลังอัปโหลด... ห้ามปิดหรือรีเฟรชหน้านี้นะครับ! ⏳')
    let count = 0

    try {
      // วนลูปอ่านข้อมูลทีละคนจากไฟล์ JSON
      for (const member of membersData) {
        // ทริคโปร: เราจะใช้ member_id เป็น "ชื่อแฟ้ม (Document ID)" ใน Firestore เลย!
        // ทำให้เวลาค้นหาข้อมูลใคร จะหาเจอไวระดับเสี้ยววินาที
        const docRef = doc(db, 'members', String(member.member_id))
        
        await setDoc(docRef, {
          ...member,          // สาดข้อมูลทุกคอลัมน์จาก JSON ลงไป
          linked_uid: null,   // เสียบฟิลด์นี้รอไว้ สำหรับให้หัวหน้ามากดผูกบัญชีทีหลัง
          importedAt: new Date()
        })
        count++
      }
      setStatus(`🎉 อัปโหลดสำเร็จสมบูรณ์! นำเข้าข้อมูลทั้งหมด ${count} รายการ`)
    } catch (error) {
      console.error('Error importing data: ', error)
      setStatus('❌ เกิดข้อผิดพลาด เปิดดูรายละเอียดใน Console (F12) ได้เลยครับ')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-lg max-w-lg w-full text-center">
        <h2 className="text-2xl font-bold text-indigo-600 mb-6">ระบบนำเข้า Master Data</h2>
        <p className="text-gray-600 mb-6">
          ตรวจสอบให้แน่ใจว่าไฟล์ <code className="bg-gray-100 px-2 py-1 rounded text-sm">src/data/members.json</code> มีข้อมูลเรียบร้อยแล้ว
        </p>
        
        <button 
          onClick={handleImport}
          disabled={isLoading}
          className={`w-full text-white font-medium py-3 px-4 rounded-lg transition-colors ${
            isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          {isLoading ? 'กำลังประมวลผล...' : '🚀 เริ่มนำเข้าข้อมูลเข้า Firestore'}
        </button>
        
        {status && (
          <div className={`mt-6 p-4 rounded-lg font-medium ${
            status.includes('สำเร็จ') ? 'bg-green-100 text-green-700' : 
            status.includes('ข้อผิดพลาด') ? 'bg-red-100 text-red-700' : 
            'bg-blue-100 text-blue-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  )
}