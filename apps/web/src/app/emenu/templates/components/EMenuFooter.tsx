import React from 'react';
import { SocialLinks } from './SocialLinks';

interface EMenuFooterProps {
  store: any;
  settings: any;
  className?: string;
  iconClassName?: string;
}

export const EMenuFooter: React.FC<EMenuFooterProps> = ({ 
  store, 
  settings, 
  className = "py-20 px-8 text-center",
  iconClassName = "size-6"
}) => {
  return (
    <footer className={className}>
      <h3 className="text-xl font-black mb-2 uppercase tracking-widest">{store.name}</h3>
      {store.address && (
        <p className="opacity-50 text-xs font-bold mb-8">{store.address}</p>
      )}
      
      <div className="flex justify-center">
        <SocialLinks settings={settings} iconClassName={iconClassName} className="flex items-center gap-8 opacity-60" />
      </div>

      <div className="mt-12 text-[9px] font-black opacity-20 uppercase tracking-[0.4em]">
        Powered by FloraPos Digital E-Menu
      </div>
    </footer>
  );
};
