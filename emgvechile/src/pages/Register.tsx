import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { Camera, ChevronRight, ChevronLeft, ShieldCheck } from 'lucide-react';

export const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [vehicleNumber, setVehicleNumber] = useState('OD02AB9988');
  const [vehicleType, setVehicleType] = useState('AMBULANCE');
  const [orgName, setOrgName] = useState('KIMS Emergency Medical Care');
  const [orgType, setOrgType] = useState('HOSPITAL');
  const [orgRegNo, setOrgRegNo] = useState('OD-HOSP-2024-88');
  const [driverName, setDriverName] = useState('Alok Mishra');
  const [phone, setPhone] = useState('+91 9876500000');
  const [email, setEmail] = useState('alok@kims.org');
  const [password, setPassword] = useState('Driver@123');
  const [confirmPassword, setConfirmPassword] = useState('Driver@123');

  // File states (mock placeholders or File)
  const [vehiclePhoto, setVehiclePhoto] = useState<File | null>(null);
  const [driverPhoto, setDriverPhoto] = useState<File | null>(null);
  const [rcPhoto, setRcPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFakeFileCreate = (name: string): File => {
    // Generate 1px dummy image file for mobile demo ease
    const blob = new Blob(['dummy-image-bytes'], { type: 'image/jpeg' });
    return new File([blob], name, { type: 'image/jpeg' });
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('vehicle_number', vehicleNumber);
      formData.append('vehicle_type', vehicleType);
      formData.append('org_name', orgName);
      formData.append('org_type', orgType);
      formData.append('org_reg_no', orgRegNo);
      formData.append('driver_name', driverName);
      formData.append('phone', phone);
      formData.append('email', email);
      formData.append('password', password);

      formData.append('vehicle_photo', vehiclePhoto || handleFakeFileCreate('vehicle.jpg'));
      formData.append('driver_photo', driverPhoto || handleFakeFileCreate('driver.jpg'));
      formData.append('rc_photo', rcPhoto || handleFakeFileCreate('rc.jpg'));

      await api.postMultipart('/vehicles/register', formData);
      navigate('/status');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F0FDF4] pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto bg-white border border-[#BBF7D0] rounded-3xl p-6 shadow-md">
        {/* Header */}
        <div className="text-center mb-5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Step {step} of 5
          </span>
          <h1 className="text-xl font-black text-[#166534] mt-2">Emergency Vehicle Registration</h1>
        </div>

        {/* Stepper Progress */}
        <div className="flex gap-1.5 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#16A34A]' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl">
            {error}
          </div>
        )}

        {/* Step 1: Vehicle */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Vehicle Plate Number
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono font-bold"
                placeholder="OD02AB1234"
              />
              <span className="text-[10px] text-slate-400">Must match state transport format</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Vehicle Type
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-bold bg-white"
              >
                <option value="AMBULANCE">🚑 AMBULANCE (Priority 1)</option>
                <option value="FIRE">🚒 FIRE TRUCK (Priority 2)</option>
                <option value="POLICE">🚓 POLICE PATROL (Priority 3)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Vehicle Photo (Plate Must Be Visible)
              </label>
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/50 cursor-pointer">
                <Camera className="w-6 h-6 text-emerald-600 mb-1" />
                <span className="text-xs font-bold text-emerald-800">
                  {vehiclePhoto ? vehiclePhoto.name : 'Take or Upload Vehicle Photo'}
                </span>
                <span className="text-[10px] text-slate-400">AI model reads license plate via OCR</span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setVehiclePhoto(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 2: Organization */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Organization Name
              </label>
              <input
                type="text"
                required
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
                placeholder="AIIMS Hospital / Red Cross"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Organization Type
              </label>
              <select
                value={orgType}
                onChange={(e) => setOrgType(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm bg-white"
              >
                <option value="HOSPITAL">Hospital</option>
                <option value="AMBULANCE_SERVICE">Licensed Ambulance Service</option>
                <option value="FIRE_DEPT">Fire Department</option>
                <option value="POLICE">Police</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Govt Reg / License Number
              </label>
              <input
                type="text"
                required
                value={orgRegNo}
                onChange={(e) => setOrgRegNo(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm font-mono"
                placeholder="LIC-2024-998"
              />
            </div>
          </div>
        )}

        {/* Step 3: Driver */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Driver Full Name
              </label>
              <input
                type="text"
                required
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="p-3 border border-dashed border-emerald-300 rounded-xl text-center bg-emerald-50 cursor-pointer">
                <span className="text-[10px] font-bold text-emerald-800 block">Driver Photo</span>
                <span className="text-[9px] text-slate-500">{driverPhoto ? '✓ Selected' : 'Upload photo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setDriverPhoto(e.target.files[0])}
                />
              </label>
              <label className="p-3 border border-dashed border-emerald-300 rounded-xl text-center bg-emerald-50 cursor-pointer">
                <span className="text-[10px] font-bold text-emerald-800 block">RC Certificate</span>
                <span className="text-[9px] text-slate-500">{rcPhoto ? '✓ Selected' : 'Upload RC'}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && setRcPhoto(e.target.files[0])}
                />
              </label>
            </div>
          </div>
        )}

        {/* Step 4: Account */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Login Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>
        )}

        {/* Step 5: Review & Submit */}
        {step === 5 && (
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2 font-black text-emerald-900 text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-600" /> Review Application
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-700 pt-1">
                <div>
                  <span className="text-[10px] text-slate-400 block">Vehicle</span>
                  <strong>{vehicleNumber}</strong> ({vehicleType})
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Organization</span>
                  <strong>{orgName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Driver</span>
                  <strong>{driverName}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Phone</span>
                  <strong>{phone}</strong>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-slate-500">
              Upon submission, your application will enter PENDING review. Our AI model will perform plate OCR validation, followed by controller verification.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-100">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="py-3 px-4 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <Link to="/login" className="text-xs font-bold text-slate-500">
              Cancel
            </Link>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={() => setStep(step + 1)}
              className="py-3 px-6 bg-[#16A34A] hover:bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="py-3 px-6 bg-[#16A34A] hover:bg-[#166534] text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
