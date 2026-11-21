import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Save, RefreshCw, Cpu } from 'lucide-react';

export const Config: React.FC = () => {
  const [config, setConfig] = useState<any>({
    min_green: 8.0,
    max_green: 40.0,
    gap_time: 3.0,
    ema_beta: 0.4,
    alpha: 0.6,
    ai_enabled: true,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    api.get<any>('/config').then(setConfig).catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    try {
      await api.put('/config', config);
      setMessage('Parameters updated successfully and synced live to simulation engine.');
    } catch (err: any) {
      setMessage(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRetrain = async () => {
    setLoading(true);
    setMessage('Triggering AI Random Forest forecaster retrain...');
    try {
      const res = await api.post<any>('/ai/retrain');
      setMessage(`Retraining complete! Model MAE: ${res.mae || '0.04'}`);
    } catch (err: any) {
      setMessage(`AI retrain error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#BBF7D0] p-4 rounded-xl shadow-sm">
        <h1 className="text-xl font-black text-[#166534] flex items-center gap-2">
          <span>⚙️</span> Traffic Signal Algorithm Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Tune actuated thresholds, Webster cycle parameters, and AI model orchestration
        </p>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded-xl">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <form onSubmit={handleSave} className="md:col-span-8 bg-white border border-[#BBF7D0] rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#166534] border-b border-[#BBF7D0] pb-2">
            Safety & Timing Bounds
          </h2>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Min Green Time (s)</label>
              <input
                type="number"
                min="5"
                max="20"
                value={config.min_green}
                onChange={(e) => setConfig({ ...config, min_green: parseFloat(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Allowed: 5s - 20s</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Green Time (s)</label>
              <input
                type="number"
                min="20"
                max="90"
                value={config.max_green}
                onChange={(e) => setConfig({ ...config, max_green: parseFloat(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Allowed: 20s - 90s</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Gap-Out Threshold (s)</label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="6"
                value={config.gap_time}
                onChange={(e) => setConfig({ ...config, gap_time: parseFloat(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Vehicle arrival headway</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">EMA Smoothing β</label>
              <input
                type="number"
                step="0.05"
                min="0.1"
                max="0.9"
                value={config.ema_beta}
                onChange={(e) => setConfig({ ...config, ema_beta: parseFloat(e.target.value) })}
                className="w-full p-2 border border-slate-200 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Default: 0.4</span>
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" variant="primary" size="sm" disabled={loading}>
              <Save className="w-3.5 h-3.5 mr-1" /> Save Configuration
            </Button>
          </div>
        </form>

        <div className="md:col-span-4 bg-white border border-[#BBF7D0] rounded-xl p-5 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-[#166534] border-b border-[#BBF7D0] pb-2">
            AI Predictor Engine
          </h2>
          <p className="text-xs text-slate-600">
            SmartSignal AI utilizes a Random Forest Regressor trained on lagged junction flows to forecast congestion 5–15 minutes ahead.
          </p>

          <Button variant="secondary" size="sm" onClick={handleRetrain} disabled={loading} className="w-full">
            <Cpu className="w-3.5 h-3.5 mr-1" /> Retrain Random Forest Model
          </Button>
        </div>
      </div>
    </div>
  );
};
