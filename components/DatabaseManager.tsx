
import React, { useState } from 'react';
import { Product } from '../types';

interface DatabaseManagerProps {
  onUpload: (products: Product[]) => void;
  onClose: () => void;
}

export const DatabaseManager: React.FC<DatabaseManagerProps> = ({ onUpload, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        let data: any[];
        
        if (file.name.endsWith('.json')) {
          data = JSON.parse(content);
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split('\n');
          const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
          data = lines.slice(1).filter(l => l.trim()).map(line => {
            const values = line.split(',');
            const obj: any = {};
            headers.forEach((header, i) => {
              // Mapeo flexible de nombres de columnas
              const key = header === 'sku' || header === 'code' ? 'productCode' : header;
              obj[key] = values[i]?.trim();
            });
            return obj;
          });
        } else {
          throw new Error("Formato no soportado. Usa JSON o CSV.");
        }

        const products: Product[] = data.map((item, idx) => ({
          id: item.id || `up-${Date.now()}-${idx}`,
          productCode: item.productCode || item.sku || item.code || 'S/N',
          name: item.name || 'Producto sin nombre',
          category: item.category || 'General',
          price: parseFloat(item.price) || 0,
          description: item.description || '',
          imageUrl: item.imageUrl || item.image || '',
          tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(/[;,]/)) : []
        }));

        onUpload(products);
      } catch (err: any) {
        setError("Error al procesar el archivo: " + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-[#064e3b]/20 backdrop-blur-sm">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-300 border border-[#E7E5E4]">
        <div className="p-8 border-b border-[#F5F5F4] flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-black text-[#064e3b]">Portal de Inventario</h2>
            <p className="text-sm text-gray-500">Sincroniza tus productos y precios</p>
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
            <div className="w-16 h-16 bg-white rounded-2xl shadow-sm mx-auto flex items-center justify-center text-[#064e3b] mb-4 border border-[#E7E5E4]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <p className="text-lg font-bold text-[#064e3b]">Arrastra tu CSV o JSON aquí</p>
            <p className="text-xs text-gray-400 mt-1 mb-6">Subir un nuevo archivo reemplazará el catálogo actual y actualizará los precios.</p>
            
            <label className="bg-[#064e3b] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#065f46] transition cursor-pointer shadow-lg active:scale-95 inline-block">
              Seleccionar Archivo
              <input 
                type="file" 
                className="hidden" 
                accept=".csv,.json"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-xl text-xs font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="mt-8">
            <h4 className="text-xs font-black uppercase tracking-widest text-[#064e3b] mb-4">Estructura requerida:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F9F8F6] rounded-2xl border border-[#E7E5E4]">
                <p className="text-[10px] uppercase font-black text-[#064e3b]/50 mb-2">Ejemplo CSV</p>
                <div className="bg-white p-2 rounded-lg border border-[#E7E5E4] overflow-x-auto">
                  <pre className="text-[9px] text-gray-500 font-mono">
                    productCode,name,price,category...{"\n"}
                    SKU-101,Silla Terra,150.00,Muebles...
                  </pre>
                </div>
              </div>
              <div className="p-4 bg-[#F9F8F6] rounded-2xl border border-[#E7E5E4]">
                <p className="text-[10px] uppercase font-black text-[#064e3b]/50 mb-2">Ejemplo JSON</p>
                <div className="bg-white p-2 rounded-lg border border-[#E7E5E4] overflow-x-auto">
                  <pre className="text-[9px] text-gray-500 font-mono">
                    [{"\n"}
                    {"  "}{"{"} "productCode": "...", "price": 0 {"}"}{"\n"}
                    ]
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
