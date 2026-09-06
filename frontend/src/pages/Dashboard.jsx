import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const statusClasses = {
  present: 'bg-green-100 text-green-700',
  late: 'bg-yellow-100 text-yellow-700',
  absent: 'bg-red-100 text-red-700',
  leave: 'bg-blue-100 text-blue-700',
  half_day: 'bg-orange-100 text-orange-700'
};

function Card({ title, value, subtitle }) {
  return <div className="bg-white border rounded-2xl p-5 shadow-sm"><p className="text-sm text-gray-500">{title}</p><p className="text-3xl font-bold mt-2">{value}</p>{subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}</div>;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const isHr = user?.role === 'hr';
  const [data, setData] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const response = isHr ? await api.get(`/attendance/hr-dashboard?date=${date}`) : await api.get('/attendance/my-attendance');
      setData(response.data.data);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not load dashboard');
    }
  }

  useEffect(() => { load(); }, [isHr, date]);

  async function check(action) {
    setSaving(true); setMessage('');
    try {
      const response = await api.post('/attendance/self', { action });
      setMessage(response.data.message);
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Attendance update failed');
    } finally { setSaving(false); }
  }

  async function updateEmployee(userId, status) {
    setSaving(true); setMessage('');
    try {
      await api.put(`/attendance/employee/${userId}`, { date, status });
      setMessage('Attendance status updated');
      await load();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  }

  const todayRecord = !isHr ? data?.todayRecord : null;
  const stats = isHr ? data?.summary : data?.statistics;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div><h1 className="text-xl font-bold">Attendance Management System</h1><p className="text-sm text-gray-500">{isHr ? 'HR Dashboard' : 'Employee Dashboard'}</p></div>
          <div className="flex items-center gap-4"><span className="text-sm text-gray-600">{user?.name}</span><button onClick={() => { logout(); window.location.href = '/login'; }} className="px-4 py-2 border rounded-lg">Logout</button></div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {message && <div className="bg-blue-50 border border-blue-200 text-blue-700 rounded-lg p-3">{message}</div>}

        {!isHr && data && (
          <>
            <div><h2 className="text-3xl font-bold">Welcome, {user.name}</h2><p className="text-gray-500 mt-1">Manage your attendance, working hours and leave deductions.</p></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card title="Attendance %" value={`${stats.attendancePercentage}%`} />
              <Card title="Total Work Hours" value={stats.totalWorkHours} subtitle="Hours recorded" />
              <Card title="Leave Days" value={stats.leaveDays} />
              <Card title="Leave Deduction" value={`${stats.leaveDeductionDays} day(s)`} subtitle="Deducted from attendance days" />
            </div>
            <div className="bg-white border rounded-2xl p-6">
              <h3 className="text-xl font-semibold">Today's Attendance</h3>
              <div className="mt-5 flex flex-wrap gap-3">
                <button disabled={saving || todayRecord?.checkInTime} onClick={() => check('check-in')} className="px-5 py-3 bg-green-600 text-white rounded-lg disabled:opacity-50">Check In</button>
                <button disabled={saving || !todayRecord?.checkInTime || todayRecord?.checkOutTime} onClick={() => check('check-out')} className="px-5 py-3 bg-red-600 text-white rounded-lg disabled:opacity-50">Check Out</button>
              </div>
              <div className="grid md:grid-cols-4 gap-4 mt-6">
                <Card title="Status" value={todayRecord?.status?.replace('_', ' ') || 'Not marked'} />
                <Card title="Check In" value={todayRecord?.checkInTime || '--'} />
                <Card title="Check Out" value={todayRecord?.checkOutTime || '--'} />
                <Card title="Working Hours" value={todayRecord?.workHours || 0} />
              </div>
            </div>
            <div className="bg-white border rounded-2xl overflow-hidden">
              <div className="p-5 border-b"><h3 className="text-xl font-semibold">Attendance Status Tracking</h3></div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Date</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Check In</th><th className="p-3 text-left">Check Out</th><th className="p-3 text-left">Work Hours</th></tr></thead><tbody>{data.attendance.map(r => <tr key={r.id} className="border-t"><td className="p-3">{r.date}</td><td className="p-3"><span className={`px-2 py-1 rounded-full text-xs ${statusClasses[r.status] || 'bg-gray-100'}`}>{r.status}</span></td><td className="p-3">{r.checkInTime || '--'}</td><td className="p-3">{r.checkOutTime || '--'}</td><td className="p-3">{r.workHours || 0}</td></tr>)}</tbody></table></div>
            </div>
          </>
        )}

        {isHr && data && (
          <>
            <div><h2 className="text-3xl font-bold">HR Dashboard</h2><p className="text-gray-500 mt-1">Monitor employee attendance, working hours and leave deductions.</p></div>
            <div className="flex items-center gap-4 bg-white border rounded-2xl p-5"><label className="font-medium">Attendance date</label><input type="date" value={date} onChange={e => setDate(e.target.value)} className="border rounded-lg p-2" /></div>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <Card title="Employees" value={stats.totalEmployees} /><Card title="Present" value={stats.present} /><Card title="Late" value={stats.late} /><Card title="Absent" value={stats.absent} /><Card title="Leave" value={stats.leave} /><Card title="Work Hours" value={stats.totalWorkHours} />
            </div>
            <div className="bg-white border rounded-2xl overflow-hidden">
              <div className="p-5 border-b"><h3 className="text-xl font-semibold">Attendance Status Tracking</h3></div>
              <div className="overflow-x-auto"><table className="w-full"><thead className="bg-gray-50"><tr><th className="p-3 text-left">Employee</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Check In</th><th className="p-3 text-left">Check Out</th><th className="p-3 text-left">Work Hours</th><th className="p-3 text-left">Leave Deduction</th></tr></thead><tbody>{data.rows.map(row => <tr key={row.employee.id} className="border-t"><td className="p-3"><div className="font-medium">{row.employee.name}</div><div className="text-xs text-gray-500">{row.employee.email}</div></td><td className="p-3"><select value={row.status} disabled={saving} onChange={e => updateEmployee(row.employee.id, e.target.value)} className={`px-3 py-2 rounded-lg text-sm ${statusClasses[row.status] || ''}`}><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="leave">Leave</option><option value="half_day">Half Day</option></select></td><td className="p-3">{row.attendance?.checkInTime || '--'}</td><td className="p-3">{row.attendance?.checkOutTime || '--'}</td><td className="p-3">{row.workHours || 0}</td><td className="p-3">{row.status === 'leave' ? '1 day' : '0 day'}</td></tr>)}</tbody></table></div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
