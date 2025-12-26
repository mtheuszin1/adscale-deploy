
import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Table, ArrowRight, X, FileVideo, FileImage, HardDrive, Link as LinkIcon } from 'lucide-react';
import Papa from 'papaparse';

interface WizardProps {
  onProcess: (rows: any[]) => void;
  onCancel: () => void;
}

const CSVUploadWizard: React.FC<WizardProps> = ({ onProcess, onCancel }) => {
  const [step, setStep] = useState<'upload' | 'media' | 'preview'>('upload');
  const [data, setData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mediaMap, setMediaMap] = useState<Record<string, string>>({});
  const [mediaFilesCount, setMediaFilesCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const csvInputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);

  const handleCSV = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError("O arquivo deve ser um CSV válido.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: 'greedy',
      complete: (results) => {
        if (results.data.length === 0) {
          setError("O arquivo está vazio.");
          return;
        }

        let parsedData = results.data;
        let cols = Object.keys(parsedData[0] as object);

        // Heuristic: If we have only 1 column and it contains semicolons, we probably missed the delimiter
        if (cols.length === 1 && cols[0].includes(';')) {
          console.log("Delimiter detection failed (defaulted to comma). Retrying with semicolon...");
          Papa.parse(file, {
            header: true,
            delimiter: ";",
            skipEmptyLines: 'greedy',
            complete: (retryResults) => {
              if (retryResults.data.length === 0) {
                setError("O arquivo está vazio (tentativa ;).");
                return;
              }
              const retryCols = Object.keys(retryResults.data[0] as object);
              setHeaders(retryCols);
              setData(retryResults.data);
              setError(null);
              setStep('media');
            }
          });
          return;
        }

        setHeaders(cols);
        setData(parsedData);
        setError(null);
        setStep('media');
      },
      error: (err) => {
        setError("Erro ao ler CSV: " + err.message);
      }
    });
  };

  const handleMediaFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsProcessing(true);
    const newMap: Record<string, string> = { ...mediaMap };

    const loadFile = (file: File): Promise<void> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
          newMap[file.name] = event.target?.result as string;
          resolve();
        };
        reader.readAsDataURL(file);
      });
    };

    const promises = (Array.from(files) as File[]).map(file => loadFile(file));
    await Promise.all(promises);

    setMediaMap(newMap);
    setMediaFilesCount(Object.keys(newMap).length);
    setIsProcessing(false);
  };

  const handleStartProcess = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      console.log("[Wizard] mediaMap keys:", Object.keys(mediaMap));

      // 1. Motor de Match: Vincula arquivos de mídia às linhas do CSV
      const enrichedData = data.map((row) => {
        const newRow = { ...row };

        // Procurar colunas de mídia comuns + ID (muito comum o nome do arquivo ser o ID)
        const mediaKeys = Object.keys(row).filter(k =>
          k.toLowerCase().includes('url') ||
          k.toLowerCase().includes('media') ||
          k.toLowerCase().includes('link') ||
          k.toLowerCase().includes('imagem') ||
          k.toLowerCase().includes('video') ||
          k.toLowerCase().includes('file') ||
          k.toLowerCase().trim() === 'id' ||
          k.toLowerCase().includes('ad id') ||
          k.toLowerCase().includes('uuid')
        );

        // Helper para normalizar nomes de arquivo (remove extensão e caminhos)
        const normalize = (name: string) => {
          if (!name) return '';
          const n = name.toString().split('/').pop()?.split('.')[0]?.toLowerCase().trim();
          return n || '';
        };

        mediaKeys.forEach(key => {
          const rawValue = row[key];
          if (!rawValue) return;

          const strVal = rawValue.toString();
          const cleanValue = normalize(strVal);

          // 1. Tenta Match Exato ou por link completo
          if (mediaMap[strVal]) {
            newRow[key] = mediaMap[strVal];
            return;
          }

          // 2. Tenta Match Normalizado (sem extensão)
          if (cleanValue) {
            const match = Object.keys(mediaMap).find(uploadedFile => {
              const cleanUploaded = normalize(uploadedFile);
              if (!cleanUploaded) return false;
              const isMatch = cleanUploaded === cleanValue ||
                (cleanValue.length > 5 && cleanUploaded.includes(cleanValue)) ||
                (cleanUploaded.length > 5 && cleanValue.includes(cleanUploaded));
              return isMatch;
            });
            if (match) {
              newRow[key] = mediaMap[match];
            }
          }
        });

        return newRow;
      });

      // 2. SANITIZAÇÃO DE DADOS PARA O BACKEND (Fix 422 Validation Errors)
      const sanitizedData = enrichedData.map(row => {
        const clean: any = { ...row };

        // ID Obrigatório - Fallback seguro
        if (!clean.id) {
          clean.id = typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Math.random().toString(36).substring(2) + Date.now().toString(36);
        }

        // Título Default
        if (!clean.title) clean.title = "Anúncio Importado";

        // Conversão de Numéricos (CSV sempre lê como string)
        if (clean.rating !== undefined) clean.rating = parseFloat(String(clean.rating).replace(',', '.')) || 0;
        if (clean.adCount !== undefined) clean.adCount = parseInt(String(clean.adCount)) || 1;

        // JSON Fields e Objetos
        ['performance', 'siteTraffic', 'techStack', 'targeting'].forEach(field => {
          if (typeof clean[field] === 'string') {
            const val = clean[field].trim();
            if (val.startsWith('{') || val.startsWith('[')) {
              try { clean[field] = JSON.parse(val); } catch { clean[field] = {}; }
            } else {
              clean[field] = {};
            }
          } else if (!clean[field]) {
            clean[field] = {};
          }
        });

        return clean;
      });

      // Simula delay visual para feedback
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log("Enviando dados sanitizados:", sanitizedData.slice(0, 2));

      await onProcess(sanitizedData);

      setIsProcessing(false);
    } catch (e: any) {
      console.error("[Wizard] Erro no processamento:", e);
      let msg = e.message || "Erro desconhecido ao processar dados.";

      if (msg.includes('401') || msg.toLowerCase().includes('unauthorized')) {
        msg = "Sua sessão expirou. Por favor, faça login novamente.";
      } else if (msg.includes('422')) {
        // Erro detalhado de validação do backend
        msg = "Erro de validação: Verifique se o CSV tem as colunas corretas. O sistema tentou corrigir tipos automaticamente mas falhou.";
      }

      setError(msg);
      setIsProcessing(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const safeHandleStartProcess = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log("Process button clicked. Sending data...");
    if (data.length === 0) {
      setError("Nenhum dado encontrado para processar.");
      return;
    }
    handleStartProcess();
  };

  return (
    <div className="bg-[#020617] border border-slate-800 rounded-[48px] p-10 w-full max-w-4xl shadow-2xl animate-in zoom-in-95 duration-300 relative">
      <button onClick={onCancel} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-colors">
        <X size={20} />
      </button>

      {
        error && (
          <div className="mb-8 bg-rose-500/10 border border-rose-500/20 p-5 rounded-3xl flex items-center gap-4 text-rose-500 text-[11px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-2 duration-300">
            <AlertCircle size={20} />
            <div className="flex-1">
              <p>{error}</p>
              {error.includes("expirou") && (
                <button
                  onClick={() => { localStorage.clear(); window.location.reload(); }}
                  className="mt-2 text-white bg-rose-600 px-4 py-1.5 rounded-xl hover:bg-rose-500 transition-colors"
                >
                  Sair e Deslogar
                </button>
              )}
            </div>
          </div>
        )
      }

      {
        step === 'upload' && (
          <div className="space-y-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-blue-600/10 rounded-[28px] border border-blue-500/20 flex items-center justify-center mx-auto text-blue-500">
                <FileText size={32} />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">1. Importar CSV</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-md mx-auto">Selecione o arquivo de dados exportado do AdsPro.</p>
            </div>

            <div
              onClick={() => csvInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-blue-500/50 bg-slate-950/50 rounded-[40px] p-20 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input type="file" ref={csvInputRef} className="hidden" accept=".csv" onChange={(e) => e.target.files?.[0] && handleCSV(e.target.files[0])} />
              <Upload size={48} className="text-slate-800 group-hover:text-blue-500 transition-colors mb-6" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-slate-400">Clique para carregar o CSV</p>
            </div>

          </div>
        )
      }

      {
        step === 'media' && (
          <div className="space-y-10">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-[28px] border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                <HardDrive size={32} />
              </div>
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">2. Vincular Mídias</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest max-w-md mx-auto">
                Suba os arquivos MP4/JPG. O sistema fará o match automático se o nome do arquivo for igual ao link no CSV.
              </p>
            </div>

            <div
              onClick={() => mediaInputRef.current?.click()}
              className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/50 rounded-[40px] p-20 flex flex-col items-center justify-center cursor-pointer transition-all group"
            >
              <input type="file" ref={mediaInputRef} className="hidden" multiple accept="video/*,image/*" onChange={handleMediaFiles} />
              {isProcessing ? (
                <Loader2 size={48} className="text-emerald-500 animate-spin mb-6" />
              ) : (
                <div className="flex gap-4 mb-6">
                  <FileVideo size={48} className="text-slate-800 group-hover:text-emerald-500 transition-colors" />
                  <FileImage size={48} className="text-slate-800 group-hover:text-emerald-500 transition-colors" />
                </div>
              )}
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 group-hover:text-slate-400">
                {mediaFilesCount > 0 ? `${mediaFilesCount} Arquivos prontos para match` : 'Clique para subir Vídeos e Imagens'}
              </p>
              {mediaFilesCount > 0 && (
                <div className="mt-6 flex flex-wrap gap-2 justify-center max-w-lg">
                  {Object.keys(mediaMap).slice(0, 10).map(name => (
                    <span key={name} className="px-3 py-1 bg-white/5 rounded-full text-[8px] font-mono text-slate-500 border border-white/5">
                      {name}
                    </span>
                  ))}
                  {mediaFilesCount > 10 && <span className="text-[8px] text-slate-600 font-black">+{mediaFilesCount - 10} MAIS...</span>}
                </div>
              )}
              <div className="mt-4 p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10">
                <p className="text-[8px] font-black uppercase text-blue-500 tracking-widest mb-2">Colunas Detectadas no CSV:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {headers.map(h => (
                    <span key={h} className="text-[7px] font-black uppercase text-slate-400 opacity-60">{h}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('upload')}
                className="flex-1 bg-slate-900 text-slate-500 py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest italic"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep('preview')}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 italic"
              >
                Gerar Preview dos Sinais <ArrowRight size={18} />
              </button>
            </div>
          </div>
        )
      }

      {
        step === 'preview' && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center text-emerald-500">
                  <Table size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic text-white">Preview Final</h3>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{data.length} Sinais detectados no CSV</p>
                </div>
              </div>
              {(() => {
                const matchedCount = data.reduce((acc, row) => {
                  const mediaKeys = ['id', 'id ad', 'uuid', 'url criativo', 'image_url', 'media', 'link imagem', 'creative url', 'thumbnail', 'video_url', 'media_url', 'creative_url', 'link'];
                  const getVal = (possible: string[]) => {
                    const key = Object.keys(row).find(k => possible.includes(k.toLowerCase().trim()));
                    return key ? row[key] : null;
                  };
                  const val = getVal(mediaKeys);
                  if (val && val.toString().length > 3) {
                    const strVal = val.toString();
                    const filename = strVal.split('/').pop()?.split('?')[0]?.toLowerCase() || '';
                    const nameNoExt = filename.replace(/\.[^/.]+$/, "");
                    const isLinked = !!(mediaMap[strVal] || mediaMap[filename] || mediaMap[nameNoExt]) ||
                      Object.keys(mediaMap).some(n => {
                        const cn = n.split('/').pop()?.split('.')[0]?.toLowerCase() || '';
                        if (!cn) return false;
                        return cn === nameNoExt || (nameNoExt.length > 5 && cn.includes(nameNoExt)) || (cn.length > 5 && nameNoExt.includes(cn));
                      });
                    return isLinked ? acc + 1 : acc;
                  }
                  return acc;
                }, 0);

                return (
                  <div className="bg-emerald-500/10 text-emerald-500 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-500/20">
                    <LinkIcon size={14} /> {matchedCount} / {data.length} Sinais Vinculados
                  </div>
                );
              })()}
            </div>

            <div className="overflow-x-auto bg-black/40 rounded-3xl border border-slate-800 max-h-[300px] overflow-y-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-[#0B0F1A]">
                  <tr className="border-b border-slate-800">
                    <th className="px-6 py-4 text-[9px] font-black text-blue-500 uppercase tracking-widest">Status</th>
                    {headers.slice(0, 4).map(h => (
                      <th key={h} className="px-6 py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 20).map((row, i) => {
                    const mediaKeys = ['id', 'id ad', 'uuid', 'url criativo', 'image_url', 'media', 'link imagem', 'creative url', 'thumbnail', 'video_url', 'media_url', 'creative_url', 'link'];
                    const getVal = (possible: string[]) => {
                      const key = Object.keys(row).find(k => possible.includes(k.toLowerCase().trim()));
                      return key ? row[key] : null;
                    };

                    const val = getVal(mediaKeys);
                    let isLinked = false;
                    if (val && val.toString().length > 3) {
                      const strVal = val.toString();
                      const filename = strVal.split('/').pop()?.split('?')[0]?.toLowerCase() || '';
                      const nameNoExt = filename.replace(/\.[^/.]+$/, "");

                      // Direct match or normalized match
                      isLinked = !!(mediaMap[strVal] || mediaMap[filename] || mediaMap[nameNoExt]);

                      if (!isLinked) {
                        isLinked = Object.keys(mediaMap).some(loadedName => {
                          const cleanLoaded = loadedName.split('/').pop()?.split('.')[0]?.toLowerCase() || '';
                          if (!cleanLoaded) return false;
                          return cleanLoaded === nameNoExt ||
                            (nameNoExt.length > 5 && cleanLoaded.includes(nameNoExt)) ||
                            (cleanLoaded.length > 5 && nameNoExt.includes(cleanLoaded));
                        });
                      }
                    }

                    return (
                      <tr key={i} className="border-b border-slate-800/50 hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4">
                          {isLinked ? (
                            <span className="flex items-center gap-2 text-emerald-500 text-[9px] font-black italic">
                              <CheckCircle2 size={12} /> VINCULADO
                            </span>
                          ) : (
                            <span className="text-slate-700 text-[9px] font-black italic uppercase">Sem Mídia</span>
                          )}
                        </td>
                        {headers.slice(0, 4).map(h => (
                          <td key={h} className="px-6 py-4 text-[10px] text-slate-400 font-medium truncate max-w-[150px]">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep('media')}
                disabled={isProcessing}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-400 py-6 rounded-3xl font-black text-[10px] uppercase tracking-widest transition-all italic"
              >
                Ajustar Mídias
              </button>
              <button
                onClick={safeHandleStartProcess}
                disabled={isProcessing}
                className="flex-[2] bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 italic active:scale-95 disabled:opacity-50"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={18} /> : <>Persistir na Base de Dados <CheckCircle2 size={18} /></>}
              </button>
            </div>
          </div>
        )
      }
    </div >
  );
};

export default CSVUploadWizard;
