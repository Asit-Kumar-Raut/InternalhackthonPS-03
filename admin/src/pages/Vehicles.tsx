import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Vehicle } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { ShieldCheck, CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'>('PENDING');
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchVehicles = async () => {
    try {
      const data = await api.get<Vehicle[]>('/vehicles');
      setVehicles(data);
      if (selectedVehicle) {
        const updated = data.find((v) => v.id === selectedVehicle.id);
        if (updated) setSelectedVehicle(updated);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleApprove = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/vehicles/${id}/approve`);
      await fetchVehicles();
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedVehicle || !rejectReason.trim()) return;
    setLoading(true);
    try {
      await api.post(`/vehicles/${selectedVehicle.id}/reject`, { reason: rejectReason });
      setRejectModalOpen(false);
      setRejectReason('');
      await fetchVehicles();
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/vehicles/${id}/suspend`);
      await fetchVehicles();
    } finally {
      setLoading(false);
    }
  };

  const handleReinstate = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/vehicles/${id}/reinstate`);
      await fetchVehicles();
    } finally {
      setLoading(false);
    }
  };

  const handleReverify = async (id: number) => {
    setLoading(true);
    try {
      await api.post(`/vehicles/${id}/reverify`);
      await fetchVehicles();
    } finally {
      setLoading(false);
    }
  };

  const filtered = vehicles.filter((v) => v.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#BBF7D0] p-4 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#166534] flex items-center gap-2">
            <span>🛡️</span> Emergency Vehicle Verification & Approvals
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multi-layer fake emergency protection: Document validation, AI Plate OCR match & Controller authorization
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchVehicles} disabled={loading}>
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#BBF7D0] bg-white rounded-t-xl px-4 pt-2">
        {(['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const).map((tab) => {
          const count = vehicles.filter((v) => v.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedVehicle(null);
              }}
              className={`py-3 px-5 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#16A34A] text-[#166534] bg-emerald-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{tab}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid: Table on Left, Detail Viewer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#BBF7D0] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F0FDF4] border-b border-[#BBF7D0] text-slate-700 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3">Vehicle</th>
                  <th className="p-3">Organization</th>
                  <th className="p-3">Driver</th>
                  <th className="p-3">Trust Score</th>
                  <th className="p-3">AI Match</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-slate-400">
                      No vehicles found in {activeTab} status
                    </td>
                  </tr>
                ) : (
                  filtered.map((v) => {
                    const isSelected = selectedVehicle?.id === v.id;
                    return (
                      <tr
                        key={v.id}
                        onClick={() => setSelectedVehicle(v)}
                        className={`cursor-pointer hover:bg-emerald-50/50 transition-colors ${
                          isSelected ? 'bg-emerald-50' : ''
                        }`}
                      >
                        <td className="p-3 font-bold text-slate-800">
                          {v.vehicle_number}
                          <div className="text-[10px] text-slate-500 font-normal">{v.vehicle_type}</div>
                        </td>
                        <td className="p-3 text-slate-700">{v.org_name}</td>
                        <td className="p-3 text-slate-700">{v.driver_name}</td>
                        <td className="p-3">
                          <span
                            className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                              v.trust_score >= 70
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.trust_score >= 50
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {v.trust_score}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              v.ai_plate_match
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {v.ai_plate_match ? '✓ Matched' : '⚠ Check'}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" variant="secondary" onClick={() => setSelectedVehicle(v)}>
                            Review
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Drawer: Review Details & AI Suggestions */}
        <div className="lg:col-span-5 bg-white border border-[#BBF7D0] rounded-xl p-5 shadow-sm">
          {selectedVehicle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#BBF7D0] pb-3">
                <div>
                  <h2 className="text-base font-black text-[#166534]">
                    {selectedVehicle.vehicle_number}
                  </h2>
                  <p className="text-xs text-slate-500">{selectedVehicle.org_name}</p>
                </div>
                <Badge variant={selectedVehicle.status}>{selectedVehicle.status}</Badge>
              </div>

              {/* AI Verification Box */}
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> AI Photo & Plate Verification
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Detected Class</span>
                    <span className="font-bold text-slate-800">
                      {selectedVehicle.ai_vehicle_class || 'AMBULANCE'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Class Confidence</span>
                    <span className="font-bold text-slate-800">
                      {((selectedVehicle.ai_confidence || 0.95) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">OCR Plate Read</span>
                    <span className="font-bold text-slate-800 font-mono">
                      {selectedVehicle.ai_plate_text || selectedVehicle.vehicle_number}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Match Status</span>
                    <span className="font-bold text-emerald-700">
                      {selectedVehicle.ai_plate_match ? 'Validated' : 'Requires Review'}
                    </span>
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 italic">
                  * Note: AI results are decision suggestions. Official authorization requires human controller review.
                </div>
              </div>

              {/* Driver and Registration Details */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 block">Driver Name</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle.driver_name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle.phone}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Org Reg Number</span>
                  <span className="font-semibold text-slate-800">{selectedVehicle.org_reg_no || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">Trust Score</span>
                  <span className="font-bold text-emerald-700">{selectedVehicle.trust_score} / 100</span>
                </div>
              </div>

              {/* Photos Gallery */}
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">Uploaded Verification Proofs</span>
                <div className="grid grid-cols-3 gap-2">
                  <div className="border border-slate-200 rounded-lg p-1 text-center bg-slate-50">
                    <div className="h-16 bg-emerald-100 rounded flex items-center justify-center text-xs font-bold text-emerald-700">
                      🚑 Plate Photo
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Vehicle Photo</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-1 text-center bg-slate-50">
                    <div className="h-16 bg-blue-100 rounded flex items-center justify-center text-xs font-bold text-blue-700">
                      👤 Driver
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">Driver Photo</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-1 text-center bg-slate-50">
                    <div className="h-16 bg-amber-100 rounded flex items-center justify-center text-xs font-bold text-amber-700">
                      📄 RC Cert
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">RC Proof</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                {selectedVehicle.status === 'PENDING' && (
                  <>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleApprove(selectedVehicle.id)}
                      disabled={loading}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setRejectModalOpen(true)}
                      disabled={loading}
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {selectedVehicle.status === 'APPROVED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleSuspend(selectedVehicle.id)}
                    disabled={loading}
                  >
                    <AlertCircle className="w-3.5 h-3.5 mr-1" /> Suspend
                  </Button>
                )}
                {(selectedVehicle.status === 'REJECTED' || selectedVehicle.status === 'SUSPENDED') && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleReinstate(selectedVehicle.id)}
                    disabled={loading}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Reinstate
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleReverify(selectedVehicle.id)}
                  disabled={loading}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1" /> Re-run AI Check
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400 text-xs">
              Select a vehicle to inspect documents and AI verification details
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Vehicle Registration"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Please provide a specific rejection reason for vehicle{' '}
            <strong>{selectedVehicle?.vehicle_number}</strong>. This will be sent to the driver.
          </p>
          <textarea
            required
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full p-2.5 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
            placeholder="e.g. Unreadable RC certificate photo or license plate mismatch."
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleReject} disabled={!rejectReason.trim()}>
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
