
import React, { useState, useMemo, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from './firebase';
import { Product, AppStatus, VisualSearchMatch, ViewMode } from './types';
import { ProductCard } from './components/ProductCard';
import { CameraSearch } from './components/CameraSearch';
import { DatabaseManager } from './components/DatabaseManager';
import { ChatBot } from './components/ChatBot';
import { performVisualSearch } from './services/geminiService';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isDbManagerOpen, setIsDbManagerOpen] = useState(false);
  const [searchResult, setSearchResult] = useState<VisualSearchMatch | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('standard');

  const bgLight = "#F9F8F6";

  useEffect(() => {
    const q = query(collection(db, 'productos'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Product[];
      setProducts(productsData);
      setIsLoading(false);
    }, (error) => {
      console.error("Error al leer Firestore:", error);
      setErrorMessage("Error de conexión con la base de datos.");
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    
    if (searchResult?.matchId && !searchQuery) {
       const matchedProduct = list.find(p => p.id === searchResult.matchId);
       const others = list.filter(p => p.id !== searchResult.matchId);
       if (matchedProduct) {
         return [matchedProduct, ...others];
       }
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.productCode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    
    return list;
  }, [products, searchQuery, searchResult]);

  const handleCapture = async (base64: string) => {
    setStatus(AppStatus.SEARCHING);
    setErrorMessage(null);
    try {
      const aiResult = await performVisualSearch(base64);
      
      let matchId: string | null = null;
      let confidence = 0.95;

      // Prioridad 1: Coincidencia por código detectado
      if (aiResult.detectedCode) {
        // Quitamos espacios y normalizamos para asegurar el match
        const searchCode = aiResult.detectedCode.trim().toLowerCase();
        const found = products.find(p => 
          p.productCode.toString().toLowerCase().trim() === searchCode
        );
        
        // CORRECCIÓN: Usamos productCode como el ID de coincidencia
        if (found) matchId = found.productCode; 
      }

      // Prioridad 2: Búsqueda por palabras clave
      if (!matchId) {
        const found = products.find(p => 
          aiResult.suggestedKeywords.some(keyword => {
            const k = keyword.toLowerCase();
            return p.name.toLowerCase().includes(k) || 
                   (p.tags && p.tags.some(t => t.toLowerCase() === k));
          })
        );
        if (found) {
          matchId = found.productCode; // CORRECCIÓN
          confidence = 0.75;
        }
      }

      setSearchResult({
        matchId,
        confidence,
        detectedObject: aiResult.detectedObject,
        detectedCode: aiResult.detectedCode,
        reasoning: aiResult.reasoning
      });

      setIsCameraOpen(false);
      setStatus(AppStatus.IDLE);
      
      if (!matchId) {
        setErrorMessage(`Detectado: "${aiResult.detectedObject}". No se encontró coincidencia en los ${products.length} productos.`);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Error de procesamiento visual.");
      setStatus(AppStatus.ERROR);
      setIsCameraOpen(false);
    }
  };

  const getGridClasses = () => {
    switch (viewMode) {
      case 'compact': return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4';
      case 'xxl': return 'flex flex-col gap-12';
      default: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8';
    }
  };

  return (
    <div className={`min-h-screen pb-32 bg-[${bgLight}]`}>
      <header className="sticky top-0 z-40 glass-morphism border-b border-[#E7E5E4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 bg-[#064e3b] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#064e3b]/10`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h1 className={`text-xl font-bold tracking-tight text-[#064e3b] hidden sm:block`}>Terrua Store Catalog</h1>
            </div>

            <div className="flex-1 max-w-lg mx-8 relative">
              <input
                type="text"
                placeholder="Buscar por nombre o código..."
                className="w-full bg-[#F5F5F4] border-transparent focus:bg-white focus:ring-2 focus:ring-[#064e3b] rounded-2xl py-3 px-12 text-sm transition-all shadow-inner text-[#064e3b]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-4 top-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsDbManagerOpen(true)}
                className={`hidden md:flex items-center gap-2 text-sm font-bold text-[#064e3b] hover:text-[#064e3b]/80 transition bg-white border border-[#E7E5E4] px-4 py-2 rounded-xl`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1.5 3 3.5 3h9c2 0 3.5-1 3.5-3V7c0-2-1.5-3-3.5-3h-9C5.5 4 4 5 4 7z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7c0 1.5 1.5 2.5 3.5 2.5h9c2 0 3.5-1 3.5-2.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12c0 1.5 1.5 2.5 3.5 2.5h9c2 0 3.5-1 3.5-2.5" />
                </svg>
                Gestor DB
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="w-12 h-12 border-4 border-[#064e3b] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 font-medium">Sincronizando inventario...</p>
          </div>
        ) : (
          <>
            {searchResult && (
              <div className="mb-10 bg-white border border-[#E7E5E4] rounded-[2.5rem] p-10 relative overflow-hidden shadow-xl ring-1 ring-[#064e3b]/5">
                <div className="absolute top-0 right-0 p-8">
                  <button onClick={() => setSearchResult(null)} className="text-gray-300 hover:text-[#064e3b] transition">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                     </svg>
                  </button>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className={`w-24 h-24 rounded-[1.5rem] flex items-center justify-center flex-shrink-0 shadow-lg ${searchResult.matchId ? 'bg-green-600 text-white' : 'bg-orange-500 text-white'}`}>
                    {searchResult.matchId ? (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                       </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                      <span className="bg-[#F5F5F4] text-[#064e3b] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-[#E7E5E4]">Escaneo Finalizado</span>
                      {searchResult.detectedCode && (
                        <span className="bg-[#F1F5F2] text-green-700 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border border-green-200">ID: {searchResult.detectedCode}</span>
                      )}
                    </div>
                    <h2 className="text-3xl font-black text-[#064e3b] mb-2">
                      {searchResult.matchId ? '¡Producto Encontrado!' : 'Objeto Identificado'}
                    </h2>
                    <p className="text-gray-600 leading-relaxed italic max-w-2xl">
                      "{searchResult.reasoning}"
                    </p>
                  </div>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="mb-8 bg-red-50 border border-red-100 text-red-700 px-8 py-5 rounded-2xl flex justify-between items-center animate-in fade-in duration-300 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="font-semibold">{errorMessage}</span>
                </div>
                <button onClick={() => setErrorMessage(null)} className="text-red-400 hover:text-red-600 transition font-bold text-xs uppercase tracking-widest">Cerrar</button>
              </div>
            )}

            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="h-px w-8 bg-[#064e3b]"></span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#064e3b]">Inventario Sincronizado</span>
                </div>
                <h2 className="text-4xl md:text-5xl font-black text-[#064e3b] tracking-tight">
                  {products.length} Productos
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-400 mr-2 uppercase tracking-widest">Vista</span>
                <div className="flex bg-white shadow-sm border border-[#E7E5E4] p-1.5 rounded-2xl">
                   {(['compact', 'standard', 'xxl'] as ViewMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${viewMode === mode ? 'bg-[#064e3b] text-white shadow-md' : 'text-gray-400 hover:text-[#064e3b]'}`}
                    >
                      {mode === 'compact' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>}
                      {mode === 'standard' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>}
                      {mode === 'xxl' && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z" /></svg>}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className={getGridClasses()}>
              {filteredProducts.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  highlighted={searchResult?.matchId === product.id}
                  viewMode={viewMode}
                />
              ))}
            </div>

            {filteredProducts.length === 0 && !isLoading && (
              <div className="py-32 text-center bg-white rounded-[3rem] border border-dashed border-[#E7E5E4]">
                <div className="w-24 h-24 bg-[#F5F5F4] rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                   </svg>
                </div>
                <h3 className="text-2xl font-bold text-[#064e3b]">No hay resultados</h3>
                <p className="text-gray-500 mt-2">Prueba escaneando un código diferente o sube productos nuevos.</p>
                <button 
                  onClick={() => { setSearchQuery(''); setSearchResult(null); }}
                  className="mt-8 bg-[#064e3b] text-white px-8 py-3 rounded-2xl font-bold hover:opacity-90 transition shadow-lg"
                >
                  Restablecer
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-40 flex gap-4">
        <button 
          onClick={() => setIsCameraOpen(true)}
          className="flex items-center gap-4 bg-[#064e3b] hover:bg-[#065f46] text-white px-10 py-6 rounded-[2rem] shadow-2xl transform transition active:scale-95 group hover:-translate-y-1"
        >
          <div className="p-2 bg-white/20 rounded-xl group-hover:scale-110 transition-transform shadow-lg backdrop-blur-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase tracking-widest font-black opacity-60">IA Lens</div>
            <div className="text-xl font-black leading-none">Escanear</div>
          </div>
        </button>
      </div>

      <ChatBot products={products} />

      {isCameraOpen && (
        <CameraSearch 
          onCapture={handleCapture} 
          onClose={() => setIsCameraOpen(false)}
          status={status}
        />
      )}

      {isDbManagerOpen && (
        <DatabaseManager 
          onClose={() => setIsDbManagerOpen(false)}
        />
      )}
    </div>
  );
};

export default App;
