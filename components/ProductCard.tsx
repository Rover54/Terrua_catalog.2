
import React, { useState } from 'react';
import { Product, ViewMode } from '../types';

interface ProductCardProps {
  product: Product;
  highlighted?: boolean;
  viewMode: ViewMode;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, highlighted, viewMode }) => {
  const [imgError, setImgError] = useState(false);
  const brandGreen = "text-[#064e3b]";
  const bgGreen = "bg-[#064e3b]";
  
  // Imagen por defecto si no hay URL o si falla la carga
  const fallbackImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(product.name)}&background=064e3b&color=fff&size=512`;
  const displayImage = !product.imageUrl || imgError ? fallbackImage : product.imageUrl;

  if (viewMode === 'xxl') {
    return (
      <div className={`group relative bg-white rounded-[2rem] overflow-hidden shadow-2xl transition-all duration-500 border-2 flex flex-col md:flex-row ${highlighted ? 'border-[#064e3b] ring-4 ring-[#064e3b]/10' : 'border-transparent hover:border-[#E7E5E4]'}`}>
        <div className="w-full md:w-3/5 aspect-square md:aspect-auto overflow-hidden bg-[#F5F5F4]">
          <img 
            src={displayImage} 
            alt={product.name} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
        </div>
        <div className="p-8 md:p-12 flex flex-col justify-center flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-bold uppercase tracking-[0.2em] ${brandGreen} px-3 py-1 bg-[#F1F5F2] rounded-full`}>{product.category}</span>
            {highlighted && <span className="text-[10px] bg-[#064e3b] text-white font-bold px-3 py-1 rounded-full uppercase">Sugerencia AI</span>}
          </div>
          <h3 className={`text-3xl md:text-5xl font-black ${brandGreen} leading-tight mb-6`}>{product.name}</h3>
          <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">{product.description}</p>
          <div className="flex items-center justify-between mt-auto">
            <span className={`text-4xl font-light ${brandGreen}`}>${product.price.toFixed(2)}</span>
            <button className={`${bgGreen} text-white px-10 py-4 rounded-2xl text-lg font-bold hover:opacity-90 transition-all hover:px-12 active:scale-95 shadow-lg`}>
              Ver Producto
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'compact') {
    return (
      <div className={`group flex gap-3 p-3 bg-white rounded-xl border-2 transition-all ${highlighted ? 'border-[#064e3b] bg-[#F1F5F2]' : 'border-transparent hover:bg-[#F5F5F4]'}`}>
        <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-[#F5F5F4]">
          <img 
            src={displayImage} 
            alt={product.name} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover" 
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className={`text-sm font-bold ${brandGreen} truncate`}>{product.name}</h3>
          <p className="text-xs text-gray-500">${product.price.toFixed(2)} • {product.category}</p>
        </div>
        <div className="flex items-center">
          <button className={`p-2 ${brandGreen} hover:bg-[#E7E5E4] rounded-lg transition`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border-2 ${highlighted ? 'border-[#064e3b] ring-2 ring-[#064e3b]/10' : 'border-transparent'}`}>
      <div className="aspect-[4/5] overflow-hidden bg-[#F5F5F4]">
        <img 
          src={displayImage} 
          alt={product.name} 
          onError={() => setImgError(true)}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-1">
          <span className={`text-xs font-semibold uppercase tracking-wider ${brandGreen}`}>{product.category}</span>
          <span className={`text-sm font-bold ${brandGreen}`}>${product.price.toFixed(2)}</span>
        </div>
        <h3 className={`text-lg font-semibold ${brandGreen} leading-tight mb-2`}>{product.name}</h3>
        <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
        
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {product.tags.map(tag => (
            <span key={tag} className="text-[10px] bg-[#E7E5E4] text-[#44403c] px-2 py-1 rounded-md">#{tag}</span>
          ))}
        </div>
        
        <button className={`mt-4 w-full ${bgGreen} text-white py-2 rounded-xl text-sm font-semibold hover:opacity-90 transition-colors active:scale-95 transform`}>
          Detalles
        </button>
      </div>

      {highlighted && (
        <div className="absolute top-3 left-3 bg-[#064e3b] text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">
          Mejor Coincidencia
        </div>
      )}
    </div>
  );
};
