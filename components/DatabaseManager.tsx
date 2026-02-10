
import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';

interface DatabaseManagerProps {
  onClose: () => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadCount, setUploadCount] = useState<number | null>(null);

  const handleFile = (file: File) => {
    setIsUploading(true);
    setError(null);
    setUploadCount(null);
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        let rawData: any[];
        
        if (file.name.endsWith('.json')) {
          rawData = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          rawData = lines.slice(1).filter(l => l.trim()).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((header, i) => {
              const key = header === 'sku' || header === 'code' ? 'productCode' : header;
              obj[key] = values[i]?.trim();
            });
            return obj;
          });
        } else {
          throw new Error("Formato no soportado. Usa JSON o CSV.");
        }

        // Mapear y guardar en Firestore uno por uno
        let count = 0;
        const productsCol = collection(db, 'productos');
        
        for (const item of rawData) {
          const productData = {
            productCode: item.productCode || item.sku || item.code || 'S/N',
            name: item.name || 'Producto sin nombre',
            category: item.category || 'General',
            price: parseFloat(item.price) || 0,
            description: item.description || '',
            imageUrl: item.imageUrl || item.image || '',
            tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(/[;,]/)) : []
          };
          
          await addDoc(productsCol, productData);
          count++;
        }

        setUploadCount(count);
        setIsUploading(false);
        setTimeout(onClose, 2000);
      } catch (err: any) {
        setError("Error al procesar el archivo: " + err.message);
        setIsUploading(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#064e3b]/20 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-[#E7E5E4]">
        <div className="p-8 border-b border-[#F5F5F4] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-[#064e3b]">Portal de Inventario Cloud</h2>
            <p className="text-sm text-gray-500">Sincroniza tus productos con Cloud Firestore</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#F5F5F4] rounded-full transition text-[#064e3b]">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8">
          <div 
            className={`border-4 border-dashed rounded-3xl p-10 text-center transition-all ${dragActive ? 'border-[#064e3b] bg-[#F1F5F2]' : 'border-[#E7E5E4] bg-[#F9F8F6]'}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
            }}
          >
            {isUploading ? (
              <div className="py-6">
                 <div className="w-12 h-12 border-4 border-[#064e3b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                 <p className="font-bold text-[#064e3b]">Subiendo a la nube...</p>
              </div>
            ) : uploadCount !== null ? (
              <div className="py-6 text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="font-bold">¡Éxito! {uploadCount} productos guardados.</p>
              </div>
            ) : (
              <>
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-[#064e3b] mb-4 border border-[#E7E5E4]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                </div>
                <p className="text-lg font-bold text-[#064e3b]">Arrastra CSV o JSON</p>
                <p className="text-xs text-gray-400 mt-1 mb-6">Los productos se guardarán permanentemente en Cloud Firestore.</p>
                
                <label className="bg-[#064e3b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#065f46] transition cursor-pointer shadow-lg active:scale-95 inline-block">
                  Seleccionar Archivo
                  <input 
                    type="file" 
                    className="hidden" 
                    accept=".csv,.json"
                    disabled={isUploading}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="mt-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#064e3b] mb-4">Formato sugerido:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-60">
              <div className="p-4 bg-[#F9F8F6] rounded-2xl border border-[#E7E5E4]">
                <p className="text-[10px] uppercase font-black text-[#064e3b]/50 mb-2">CSV Cloud Sync</p>
                <div className="bg-white p-2 rounded-lg border border-[#E7E5E4] overflow-x-auto">
                  <pre className="text-[9px] text-gray-500 font-mono">
                    productCode,name,price...
                  </pre>
                </div>
              </div>
              <div className="p-4 bg-[#F9F8F6] rounded-2xl border border-[#E7E5E4]">
                <p className="text-[10px] uppercase font-black text-[#064e3b]/50 mb-2">JSON Cloud Sync</p>
                <div className="bg-white p-2 rounded-lg border border-[#E7E5E4] overflow-x-auto">
                  <pre className="text-[9px] text-gray-500 font-mono">
                    [ {"{"} "name": "...", "price": 0 {"}"} ]
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
