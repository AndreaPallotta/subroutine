import React, { useState } from 'react';
import { Clock, Play, RotateCcw, ArrowRight, ShieldCheck } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

export const PtpClockSyncVisualizer: React.FC = () => {
  const [step, setStep] = useState(0);
  const [clockOffset, setClockOffset] = useState(14.2); // 14.2 microseconds drift
  const [networkDelay, setNetworkDelay] = useState(3.8); // 3.8 microseconds network delay
  const [t1, setT1] = useState(1000.0);
  const [t2, setT2] = useState(1018.0); // t1 + delay + offset
  const [t3, setT3] = useState(1050.0);
  const [t4, setT4] = useState(1039.6); // t3 + delay - offset

  const ptpSteps = [
    { title: '1. Master Sends Sync Message (t1)', desc: 'Master Clock records Hardware NIC timestamp t1 upon transmitting Sync packet.', packet: 'SYNC (t1 = 1000.000 µs)' },
    { title: '2. Slave Receives Sync Message (t2)', desc: 'Slave Clock NIC records Hardware timestamp t2 when packet arrives.', packet: 'SYNC Recv (t2 = 1018.000 µs)' },
    { title: '3. Master Follow_Up Packet', desc: 'Master sends exact t1 timestamp to Slave in Follow_Up message (Two-Step PTP).', packet: 'FOLLOW_UP (Contains t1)' },
    { title: '4. Slave Sends Delay_Req (t3)', desc: 'Slave transmits Delay_Req packet back to Master and records timestamp t3.', packet: 'DELAY_REQ (t3 = 1050.000 µs)' },
    { title: '5. Master Receives Delay_Req (t4)', desc: 'Master records Hardware timestamp t4 and returns it to Slave in Delay_Resp.', packet: 'DELAY_RESP (t4 = 1039.600 µs)' },
    { title: '6. Offset & Delay Calculation', desc: 'Slave calculates Network Delay δ = ((t2 - t1) + (t4 - t3)) / 2 and Clock Offset θ = ((t2 - t1) - (t4 - t3)) / 2 to adjust local clock.', packet: 'Calculated Offset θ = +14.200 µs (Clock Synchronized!)' },
  ];

  const handleNext = () => {
    if (step < ptpSteps.length - 1) {
      setStep(prev => prev + 1);
      audioEngine.playNote(350 + step * 40, 'sine', 0.1, 0.05);
      if (step === ptpSteps.length - 2) {
        setClockOffset(0.05); // Sub-microsecond sync reached!
      }
    }
  };

  const handleReset = () => {
    setStep(0);
    setClockOffset(14.2);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-amber-400" />
            <span>PTP (IEEE 1588) Hardware Timestamp Exchange</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Precision Time Protocol timestamping & sub-microsecond clock drift calculation
          </p>
        </div>

        <div className="flex items-center gap-4 font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase">Clock Drift Offset (θ)</span>
            <span className={`font-bold text-sm ${clockOffset < 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {clockOffset.toFixed(3)} µs
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <span className="text-slate-500 block text-[10px] uppercase">Network Delay (δ)</span>
            <span className="text-blue-400 font-bold text-sm">{networkDelay.toFixed(1)} µs</span>
          </div>
        </div>
      </div>

      {/* Handshake Sequence Canvas */}
      <div className="my-6 space-y-4">
        <div className="p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-white">{ptpSteps[step].title}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-500/30 font-mono text-[10px]">
              PTP Message
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-300">{ptpSteps[step].desc}</p>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-amber-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>{ptpSteps[step].packet}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-mono text-xs flex items-center gap-1.5 transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Sync Sequence</span>
        </button>

        <button
          onClick={handleNext}
          disabled={step === ptpSteps.length - 1}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
            step === ptpSteps.length - 1
              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
          }`}
        >
          <span>{step === ptpSteps.length - 1 ? 'Clocks Synchronized' : 'Step PTP Packet'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
