import React, { useState } from 'react';
import { useCaseStore } from '../stores';
import { mockEvidence } from '../data/mockData';
import { Shield, ShieldAlert, ShieldCheck, Upload, Trash2, FileText, CheckCircle2, AlertTriangle, FileUp } from 'lucide-react';
import { formatDate } from '../utils/helpers';
import type { Evidence } from '../types';

export const EvidencePage: React.FC = () => {
  const { cases, selectedCase, selectCase } = useCaseStore();
  const [evidenceList, setEvidenceList] = useState<Evidence[]>(mockEvidence);
  const [verifyStatus, setVerifyStatus] = useState<Record<string, 'checking' | 'verified' | 'tampered'>>({});
  
  // Upload State
  const [showUpload, setShowUpload] = useState(false);
  const [targetCase, setTargetCase] = useState(selectedCase?.id || cases[0]?.id || '');
  const [fileName, setFileName] = useState('');
  const [fileDesc, setFileDesc] = useState('');
  const [fileSize, setFileSize] = useState('42 KB');

  // Filter evidence based on selected case
  const activeEvidence = selectedCase 
    ? evidenceList.filter((e) => e.caseId === selectedCase.id)
    : evidenceList;

  const handleVerify = async (id: string, normalHash: boolean = true) => {
    setVerifyStatus((prev) => ({ ...prev, [id]: 'checking' }));
    
    // Simulate checksum verification delay
    await new Promise((r) => setTimeout(r, 1200));

    setVerifyStatus((prev) => ({
      ...prev,
      [id]: normalHash ? 'verified' : 'tampered'
    }));
  };

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName.trim()) return;

    // Simulate simple hash creation
    const characters = 'abcdef0123456789';
    let mockHash = 'sha256_';
    for (let i = 0; i < 48; i++) {
      mockHash += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const newEvidenceItem: Evidence = {
      id: `evd-${Math.random().toString(36).substr(2, 7)}`,
      caseId: targetCase,
      filename: fileName,
      fileHash: mockHash,
      fileSize: fileSize,
      uploadedBy: 'Inspector Verma',
      uploadTime: new Date().toISOString(),
      description: fileDesc,
      downloadUrl: '#',
    };

    setEvidenceList((prev) => [newEvidenceItem, ...prev]);
    setShowUpload(false);
    
    // Reset states
    setFileName('');
    setFileDesc('');
    setFileSize('42 KB');

    // Update counts in cases
    const dbCase = cases.find((c) => c.id === targetCase);
    if (dbCase) {
      dbCase.evidenceCount += 1;
    }
  };

  const handleDelete = (id: string) => {
    const item = evidenceList.find((e) => e.id === id);
    setEvidenceList((prev) => prev.filter((e) => e.id !== id));
    if (item) {
      const dbCase = cases.find((c) => c.id === item.caseId);
      if (dbCase && dbCase.evidenceCount > 0) {
        dbCase.evidenceCount -= 1;
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Evidence Locker & Integrity Vault</h2>
          <p className="text-xs text-dark-400">Upload evidence files, track forensic signatures, and verify chain of custody hashes</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)} 
          className="btn-primary flex items-center gap-2"
        >
          <Upload size={16} /> Secure Upload
        </button>
      </div>

      {/* Case Selector Filter */}
      <div className="glass-card p-4 flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield size={18} className="text-primary-400" />
          <span className="text-xs text-dark-300 font-semibold uppercase">Filter by Case File:</span>
          <select 
            value={selectedCase?.id || 'all'}
            onChange={(e) => {
              const id = e.target.value;
              if (id === 'all') selectCase(null);
              else {
                const c = cases.find((item) => item.id === id);
                if (c) selectCase(c);
              }
            }}
            className="input-field py-1.5 px-3 text-xs w-64 bg-dark-900 border-dark-700/50"
          >
            <option value="all">-- All Investigation Files --</option>
            {cases.map((c) => (
              <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
            ))}
          </select>
        </div>
        
        <div className="text-xs text-dark-400">
          Showing <span className="font-semibold text-white">{activeEvidence.length}</span> cataloged evidence items
        </div>
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeEvidence.map((ev) => {
          const caseObj = cases.find((c) => c.id === ev.caseId);
          const status = verifyStatus[ev.id];
          
          return (
            <div key={ev.id} className="glass-card p-5 flex flex-col justify-between hover:border-dark-600 transition-colors">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded bg-dark-800 flex items-center justify-center text-primary-400">
                      <FileText size={16} />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{ev.filename}</h4>
                      <p className="text-[10px] text-dark-400">{ev.fileSize} • {caseObj?.caseNumber || 'General'}</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleDelete(ev.id)}
                    className="p-1 rounded text-dark-400 hover:text-accent-red hover:bg-dark-800 transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <p className="text-xs text-dark-300 min-h-[32px] line-clamp-2">
                  {ev.description || 'No description cataloged.'}
                </p>

                {/* Audit Signatures */}
                <div className="p-3 bg-dark-900/60 rounded-lg border border-dark-800/80 space-y-1.5 text-[10px]">
                  <div>
                    <span className="text-dark-500 block uppercase">Forensic Checksum</span>
                    <code className="text-primary-400 mono block truncate">{ev.fileHash}</code>
                  </div>
                  <div className="flex justify-between text-dark-400">
                    <span>By: {ev.uploadedBy}</span>
                    <span>{formatDate(ev.uploadTime || ev.createdAt || '')}</span>
                  </div>
                </div>
              </div>

              {/* Verify Controls */}
              <div className="mt-5 pt-3 border-t border-dark-700/50 flex items-center justify-between">
                <div>
                  {status === 'checking' && (
                    <span className="text-[10px] text-dark-400 flex items-center gap-1.5">
                      <div className="w-2 h-2 border-2 border-dark-400/30 border-t-primary-400 rounded-full animate-spin" />
                      Checking checksum...
                    </span>
                  )}
                  {status === 'verified' && (
                    <span className="text-[10px] text-accent-green font-bold flex items-center gap-1">
                      <ShieldCheck size={12} /> INTEGRITY OK
                    </span>
                  )}
                  {status === 'tampered' && (
                    <span className="text-[10px] text-accent-red font-bold flex items-center gap-1">
                      <ShieldAlert size={12} /> HASH MISMATCH
                    </span>
                  )}
                  {!status && (
                    <span className="text-[10px] text-dark-500">Not verified in session</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleVerify(ev.id, true)}
                    disabled={status === 'checking'}
                    className="px-2.5 py-1 bg-dark-800 hover:bg-dark-700 text-[10px] font-semibold text-white rounded"
                  >
                    Check
                  </button>
                  <button 
                    onClick={() => handleVerify(ev.id, false)}
                    disabled={status === 'checking'}
                    className="px-2.5 py-1 bg-accent-red/10 border border-accent-red/20 text-accent-red hover:bg-accent-red/20 text-[10px] font-semibold rounded"
                    title="Simulate Tamper Check"
                  >
                    Simulate Tamper
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 animate-scale-in">
            <div className="flex items-center gap-2 mb-4 border-b border-dark-700/50 pb-3">
              <FileUp size={18} className="text-primary-400" />
              <h3 className="text-base font-semibold text-white">Catalog Evidence File</h3>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Select Case</label>
                <select 
                  value={targetCase}
                  onChange={(e) => setTargetCase(e.target.value)}
                  className="input-field py-2 text-xs bg-dark-900 border-dark-700/50"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>{c.caseNumber} - {c.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">File Name</label>
                <input 
                  type="text" required value={fileName} onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. frozen_funds_dossier.pdf"
                  className="input-field py-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">File Size</label>
                  <input 
                    type="text" value={fileSize} onChange={(e) => setFileSize(e.target.value)}
                    placeholder="e.g. 1.2 MB"
                    className="input-field py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-dark-300 mb-1">Catalog Category</label>
                  <select className="input-field py-2 text-xs">
                    <option>Investigative PDF</option>
                    <option>DEX Swap Screenshot</option>
                    <option>Court Warrant Copy</option>
                    <option>Blockchain Log CSV</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-dark-300 mb-1">Description / Notes</label>
                <textarea 
                  value={fileDesc} onChange={(e) => setFileDesc(e.target.value)}
                  placeholder="Details regarding source, relevance, and chain of custody tracking..."
                  className="w-full h-20 p-2.5 text-xs bg-dark-800/40 border border-dark-700/50 rounded-lg focus:outline-none focus:border-primary-500 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-dark-700/50">
                <button 
                  type="button" 
                  onClick={() => setShowUpload(false)}
                  className="btn-ghost py-2 text-xs px-4"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary py-2 text-xs px-4"
                >
                  Secure Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
