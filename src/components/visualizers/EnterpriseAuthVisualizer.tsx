import React, { useState } from 'react';
import { ShieldCheck, Lock, RefreshCw, ArrowRight } from 'lucide-react';
import { audioEngine } from './audio/AudioEngine';

type AuthType = 'kerberos' | 'ntlm' | 'mtls';

export const EnterpriseAuthVisualizer: React.FC = () => {
  const [authType, setAuthType] = useState<AuthType>('kerberos');
  const [currentStep, setCurrentStep] = useState(0);

  const kerberosSteps = [
    { title: '1. Authentication Service Request (AS-REQ)', desc: 'Client requests Ticket Granting Ticket (TGT) from KDC Key Distribution Center.', token: 'AS-REQ (Client ID + Timestamp)' },
    { title: '2. TGT Issue (AS-REP)', desc: 'KDC validates password hash & returns encrypted TGT + Session Key.', token: 'TGT (Encrypted with KDC secret)' },
    { title: '3. Ticket Granting Service Request (TGS-REQ)', desc: 'Client presents TGT to request Service Ticket (ST) for target service.', token: 'TGS-REQ + TGT + Authenticator' },
    { title: '4. Service Ticket Issued (TGS-REP)', desc: 'KDC issues Service Ticket encrypted with Target Service Secret Key.', token: 'Service Ticket (ST)' },
    { title: '5. Mutual Authentication (AP-REQ)', desc: 'Client presents Service Ticket to Target App Server (SPNEGO negotiated).', token: 'AP-REQ (Access Granted)' },
  ];

  const ntlmSteps = [
    { title: '1. Negotiate Message (TYPE 1)', desc: 'Client sends list of supported NTLM capabilities to server.', token: 'NTLMSSP_NEGOTIATE' },
    { title: '2. Challenge Message (TYPE 2)', desc: 'Server returns 8-byte random server challenge nonce.', token: 'NTLMSSP_CHALLENGE (Nonce: 0x8F3A...)' },
    { title: '3. Authenticate Response (TYPE 3)', desc: 'Client encrypts challenge nonce using NTLM password hash.', token: 'NTLMSSP_AUTH (Response Hash)' },
    { title: '4. Domain Controller Verification', desc: 'Server sends challenge & response to DC to verify password hash match.', token: 'NetLOGON Validation' },
  ];

  const mtlsSteps = [
    { title: '1. Client Hello & Cipher Suite', desc: 'Client initiates TLS 1.3 handshake and offers supported cryptographic cipher suites.', token: 'TLS_CLIENT_HELLO' },
    { title: '2. Server Hello + Certificate Request', desc: 'Server presents its X.509 certificate and requests Client Certificate.', token: 'SERVER_CERTIFICATE_REQUEST' },
    { title: '3. Client Certificate Presentation', desc: 'Client presents its own X.509 Certificate chain signed by internal Enterprise CA.', token: 'CLIENT_CERTIFICATE (X.509)' },
    { title: '4. Certificate Verify (Digital Signature)', desc: 'Client signs handshake transcript using its RSA/ECDSA Private Key to prove ownership.', token: 'CERTIFICATE_VERIFY (RSA Sign)' },
    { title: '5. Encrypted mTLS Tunnel Established', desc: 'Both parties verify certificates against trusted CA roots & derive symmetric session keys.', token: 'mTLS Tunnel Active (200 OK)' },
  ];

  const steps = authType === 'kerberos' ? kerberosSteps : authType === 'ntlm' ? ntlmSteps : mtlsSteps;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
      audioEngine.playNote(300 + currentStep * 50, 'sine', 0.1, 0.05);
    }
  };

  const handleReset = () => {
    setCurrentStep(0);
  };

  return (
    <div className="my-8 rounded-2xl border border-slate-800 bg-[#0f172a] p-6 shadow-2xl font-sans text-slate-100">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="text-lg font-bold flex items-center gap-2 text-white">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <span>Enterprise Authentication Protocol Simulator</span>
          </h3>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            Step through Kerberos/SPNEGO, NTLM challenge-response, and Mutual TLS (mTLS) certificate handshakes
          </p>
        </div>

        {/* Protocol Selector */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 font-mono text-xs">
          <button
            onClick={() => { setAuthType('kerberos'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              authType === 'kerberos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Kerberos / SPNEGO
          </button>
          <button
            onClick={() => { setAuthType('ntlm'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              authType === 'ntlm' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            NTLM Auth
          </button>
          <button
            onClick={() => { setAuthType('mtls'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              authType === 'mtls' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            Mutual TLS (mTLS)
          </button>
        </div>
      </div>

      {/* Step Stepper Visualizer */}
      <div className="my-6">
        <div className="flex items-center justify-between gap-2 mb-4 overflow-x-auto pb-2">
          {steps.map((s, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`flex-1 min-w-[120px] p-3 rounded-xl border text-center font-mono text-xs cursor-pointer transition-all ${
                idx === currentStep
                  ? 'bg-indigo-950/80 border-indigo-500 text-indigo-300 shadow-lg shadow-indigo-500/20 font-bold scale-105'
                  : idx < currentStep
                  ? 'bg-slate-900 border-slate-800 text-slate-400'
                  : 'bg-slate-900/50 border-slate-800/60 text-slate-600'
              }`}
            >
              Step {idx + 1}
            </div>
          ))}
        </div>

        {/* Current Active Step Box */}
        <div className="p-6 rounded-xl bg-[#090d16] border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold font-mono text-white">{steps[currentStep].title}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/30 font-mono text-[10px]">
              Payload / Token
            </span>
          </div>

          <p className="text-xs leading-relaxed text-slate-300">{steps[currentStep].desc}</p>

          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-xs text-amber-300 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>{steps[currentStep].token}</span>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleReset}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800 font-mono text-xs flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Restart Handshake</span>
        </button>

        <button
          onClick={handleNext}
          disabled={currentStep === steps.length - 1}
          className={`px-5 py-2.5 rounded-xl font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-md ${
            currentStep === steps.length - 1
              ? 'bg-slate-800 text-slate-600 border border-slate-700 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
          }`}
        >
          <span>{currentStep === steps.length - 1 ? 'Handshake Complete' : 'Next Step'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
