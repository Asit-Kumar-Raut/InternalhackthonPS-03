import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { History, Download } from 'lucide-react';

export const Events: React.FC = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('');

  const fetchEvents = async () => {
    try {
      const url = filterType ? `/events?type=${filterType}` : '/events';
      const data = await api.get<any[]>(url);
      setEvents(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [filterType]);

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      ['ID,Timestamp,Type,Actor,Payload']
        .concat(
          events.map(
            (e) =>
              `${e.id},"${e.created_at}","${e.type}","${e.actor}","${JSON.stringify(e.payload).replace(/"/g, '""')}"`
          )
        )
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `smartsignal_events_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#BBF7D0] p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#166534] flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-600" /> Event & Audit Log Trail
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable system state changes, safety transitions, emergency priority events & controller actions
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download className="w-3.5 h-3.5 mr-1" /> Export CSV
        </Button>
      </div>

      <div className="bg-white border border-[#BBF7D0] rounded-xl overflow-hidden shadow-sm">
        <div className="p-3 border-b border-[#BBF7D0] bg-[#F0FDF4] flex items-center gap-3">
          <span className="text-xs font-bold text-slate-700">Filter Event Type:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs p-1.5 border border-slate-200 rounded bg-white"
          >
            <option value="">All Events</option>
            <option value="SIGNAL_PHASE_CHANGED">SIGNAL_PHASE_CHANGED</option>
            <option value="PRIORITY_REQUESTED">PRIORITY_REQUESTED</option>
            <option value="PRIORITY_GRANTED">PRIORITY_GRANTED</option>
            <option value="PRIORITY_RELEASED">PRIORITY_RELEASED</option>
            <option value="CONGESTION_LEVEL_CHANGED">CONGESTION_LEVEL_CHANGED</option>
            <option value="VEHICLE_APPROVED">VEHICLE_APPROVED</option>
            <option value="VEHICLE_REJECTED">VEHICLE_REJECTED</option>
            <option value="FALSE_ALARM_STRIKE">FALSE_ALARM_STRIKE</option>
          </select>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-[#F0FDF4] border-b border-[#BBF7D0] text-slate-700 uppercase font-bold text-[10px]">
            <tr>
              <th className="p-3">Time</th>
              <th className="p-3">Event Type</th>
              <th className="p-3">Actor</th>
              <th className="p-3">Payload Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-8 text-slate-400">
                  No events logged matching filter
                </td>
              </tr>
            ) : (
              events.map((e) => (
                <tr key={e.id} className="hover:bg-slate-50">
                  <td className="p-3 text-slate-500 font-mono text-[11px]">
                    {new Date(e.created_at).toLocaleTimeString()}
                  </td>
                  <td className="p-3 font-bold text-emerald-800">{e.type}</td>
                  <td className="p-3 text-slate-600">{e.actor}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-700">
                    {typeof e.payload === 'object' ? JSON.stringify(e.payload) : e.payload}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
