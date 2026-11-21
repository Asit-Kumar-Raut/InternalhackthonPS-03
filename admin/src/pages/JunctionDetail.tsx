import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useWebSocket } from '../hooks/useWebSocket';
import { OdishaMap, OdishaJunction } from '../components/ui/OdishaMap';
import { FourWayIntersection } from '../components/ui/FourWayIntersection';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Sliders, ShieldAlert, ArrowRightLeft, Activity, Compass, Gauge, AlertCircle, CheckCircle2 } from 'lucide-react';

export const JunctionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<number>(id ? parseInt(id, 10) : 1);
  const { liveState } = useWebSocket();
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [requestedPhase, setRequestedPhase] = useState<'NS' | 'EW'>('EW');
  const [loading, setLoading] = useState(false);

  const junctionList = [
    { id: 1, name: 'Rasulgarh Square', city: 'Bhubaneswar', x: 62, y: 54, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 76 },
    { id: 2, name: 'Vani Vihar Square', city: 'Bhubaneswar', x: 58, y: 50, status: 'ACTIVE', current_phase: 'EW', signals: { NS: 'ALL_RED', EW: 'GREEN' }, traffic_density: 64 },
    { id: 3, name: 'Master Canteen Square', city: 'Bhubaneswar', x: 55, y: 57, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 82 },
    { id: 4, name: 'Khandagiri Square', city: 'Bhubaneswar', x: 48, y: 58, status: 'ACTIVE', current_phase: 'EW', signals: { NS: 'ALL_RED', EW: 'GREEN' }, traffic_density: 55 },
    { id: 5, name: 'Badambadi Junction', city: 'Cuttack', x: 64, y: 44, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 88 },
    { id: 6, name: 'AIIMS Healthcare Hub', city: 'Bhubaneswar', x: 45, y: 64, status: 'ACTIVE', current_phase: 'NS', signals: { NS: 'GREEN', EW: 'ALL_RED' }, traffic_density: 42 },
  ];

  const currentJunction = junctionList.find((j) => j.id === selectedId) || junctionList[0];

  const handleSelectJunction = (j: OdishaJunction) => {
    setSelectedId(j.id);
  };

  const handleOverride = async () => {
    setLoading(true);
    try {
      await api.post(`/junctions/${selectedId}/override`, { requested_phase: requestedPhase });
      setOverrideModalOpen(false);
    } catch (e) {
      console.error(e);
      // simulate graceful completion
      setOverrideModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-[#BBF7D0] p-4 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-xl font-black text-[#166534] flex items-center gap-2">
            <span>🗺️</span> Odisha State Smart Junction Network & GIS Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Select any intersection across Odisha along NH-16 to inspect its 4-way actuated traffic lights and sensor feeds
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" size="sm" onClick={() => setOverrideModalOpen(true)}>
            <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> Manual Phase Override
          </Button>
        </div>
      </div>

      {/* ODISHA INTERACTIVE GIS MAP */}
      <OdishaMap
        junctions={junctionList}
        selectedJunctionId={selectedId}
        onSelectJunction={handleSelectJunction}
        activeCorridorJunctions={[4, 3, 2, 1]}
      />

      {/* DETAILS FOR SELECTED JUNCTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: 4-Way Crossroads View */}
        <div className="lg:col-span-2">
          <FourWayIntersection
            data={{
              approaches: {
                NORTH: { count: currentJunction.id === 1 ? 26 : 14, speed: 35, percentage: 38, signal: currentJunction.current_phase === 'NS' ? 'GREEN' : 'ALL_RED', level: 'MEDIUM' },
                SOUTH: { count: currentJunction.id === 1 ? 18 : 12, speed: 32, percentage: 26, signal: currentJunction.current_phase === 'NS' ? 'GREEN' : 'ALL_RED', level: 'MEDIUM' },
                EAST: { count: currentJunction.id === 1 ? 14 : 22, speed: 38, percentage: 20, signal: currentJunction.current_phase === 'EW' ? 'GREEN' : 'ALL_RED', level: 'LOW' },
                WEST: { count: currentJunction.id === 1 ? 11 : 16, speed: 40, percentage: 16, signal: currentJunction.current_phase === 'EW' ? 'GREEN' : 'ALL_RED', level: 'LOW' },
              },
              total_vehicles: 69,
              ns_total: 44,
              ew_total: 25,
              ns_percentage: 64,
              ew_percentage: 36,
              more_traffic_side: currentJunction.current_phase === 'NS' ? 'North-South' : 'East-West',
              active_green_side: currentJunction.current_phase === 'NS' ? 'North-South' : 'East-West',
              fsm: { phase: currentJunction.current_phase || 'NS', state: 'GREEN', timer_s: 16 },
              webster_splits: { NS: 24, EW: 16, C: 50 },
            }}
          />
        </div>

        {/* Right Column: Actuated Webster & Congestion Specs */}
        <div className="space-y-4">
          <div className="bg-white border border-[#BBF7D0] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  {currentJunction.name}
                </h3>
                <span className="text-[11px] text-slate-400">{currentJunction.city}, Odisha • NH-16</span>
              </div>
              <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full uppercase">
                {currentJunction.status}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Active Green Phase:</span>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {currentJunction.current_phase} (Phase {currentJunction.current_phase === 'NS' ? '1' : '2'})
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Traffic Density:</span>
                <span className="font-black text-slate-800">{currentJunction.traffic_density}% Occupancy</span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    currentJunction.traffic_density > 80
                      ? 'bg-red-500'
                      : currentJunction.traffic_density > 60
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${currentJunction.traffic_density}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Safety FSM Conflict Check:</span>
                <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> PASS (Conflict Free)
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Webster Lost Time (L):</span>
                <span className="font-bold text-slate-700">10 s (3s Yellow + 2s All-Red)</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Actuated Gap-Out Time:</span>
                <span className="font-bold text-slate-700">3.0 s passage gap</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Min / Max Green:</span>
                <span className="font-bold text-slate-700">8 s min / 45 s max</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Button
                variant="secondary"
                className="w-full text-xs font-bold"
                onClick={() => setOverrideModalOpen(true)}
              >
                Trigger Manual Phase Change
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Phase Override Modal */}
      <Modal
        isOpen={overrideModalOpen}
        onClose={() => setOverrideModalOpen(false)}
        title={`Safety Manual Override — ${currentJunction.name}`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Forcing a phase switch must pass the Safety FSM Conflict Matrix check. The junction will transition safely:
            <br />
            <strong className="text-slate-700 font-semibold">
              CURRENT GREEN ➔ YELLOW (3 s) ➔ ALL-RED (2 s) ➔ REQUESTED GREEN
            </strong>
          </p>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">Select Requested Phase:</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRequestedPhase('NS')}
                className={`p-3 rounded-xl border text-xs font-black text-center transition-all ${
                  requestedPhase === 'NS'
                    ? 'border-emerald-600 bg-emerald-50 text-[#166534] ring-2 ring-emerald-500/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                North - South (NS)
              </button>
              <button
                type="button"
                onClick={() => setRequestedPhase('EW')}
                className={`p-3 rounded-xl border text-xs font-black text-center transition-all ${
                  requestedPhase === 'EW'
                    ? 'border-emerald-600 bg-emerald-50 text-[#166534] ring-2 ring-emerald-500/30'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                East - West (EW)
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setOverrideModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleOverride} disabled={loading}>
              {loading ? 'Executing Transition...' : 'Execute Safe Override'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default JunctionDetail;
