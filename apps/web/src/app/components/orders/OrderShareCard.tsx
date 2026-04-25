import React from 'react';
import { motion } from 'motion/react';
import { Order, OrderItem } from '@/app/types';
import { formatDate } from '@/app/utils/format';
import { Heart, Star, Sparkles, Instagram, Send, Download } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

const getFlowerImage = (name: string): string => {
    const imageMap: Record<string, string> = {
        'Red Roses': 'photo-1518709594023-6eab9bab7b23?w=800&h=1200&fit=crop',
        'White Lilies': 'photo-1602492275880-1b23c1a8e6f1?w=800&h=1200&fit=crop',
        'Tulips': 'photo-1520763185298-1b434c919102?w=800&h=1200&fit=crop',
        'Orchid': 'photo-1525310072745-f49212b5ac6d?w=800&h=1200&fit=crop',
        'Sunflowers': 'photo-1470509037663-253afd7f0f51?w=800&h=1200&fit=crop',
        'Mixed Bouquet': 'photo-1490750967868-88aa4486c946?w=800&h=1200&fit=crop',
    };
    const imageId = imageMap[Object.keys(imageMap).find(k => name.includes(k)) || ''] || 'photo-1490750967868-88aa4486c946?w=800&h=1200&fit=crop';
    return `https://images.unsplash.com/${imageId}&q=80`;
};

interface OrderShareCardProps {
    order: Order;
    storeName?: string;
    customMessage?: string;
}

export const OrderShareCard: React.FC<OrderShareCardProps> = ({ order, storeName = "FloraPOS Boutique", customMessage }) => {
    const mainItem = order.items[0];
    const message = customMessage || order.notes || "Wishing you a day as beautiful and bright as these flowers.";
    
    // Dynamic Font Scaling based on message length
    const getFontSize = (text: string) => {
        const len = text.length;
        if (len < 40) return 'text-3xl';
        if (len < 80) return 'text-2xl';
        if (len < 120) return 'text-xl';
        if (len < 160) return 'text-lg';
        return 'text-base';
    };

    return (
        <div className="relative w-[380px] h-[640px] bg-white overflow-hidden shadow-2xl flex flex-col font-sans border-[6px] border-white">
            {/* Vibrant Background Gradients - More Saturated */}
            <div className="absolute top-[-20%] right-[-20%] w-[120%] h-[120%] bg-gradient-to-br from-pink-400/30 via-orange-300/30 to-brand-primary/30" />
            <div className="absolute top-[-10%] left-[-10%] w-72 h-72 bg-pink-500 rounded-full blur-[100px] opacity-30" />
            
            {/* Main Visual - Balanced 50% split */}
            <div className="relative h-[50%] w-full overflow-hidden">
                <ImageWithFallback
                    src={mainItem?.product?.image_url || getFlowerImage(mainItem?.product_name_snapshot || 'Mixed Bouquet')}
                    alt="Gift"
                    className="w-full h-full object-cover"
                />
                {/* Crystal Clear Top, Faded Bottom */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent via-[70%] to-white" />
                
                <div className="absolute top-10 left-0 right-0 text-center">
                    <p className="text-white/90 text-[10px] font-black uppercase tracking-[0.4em] drop-shadow-md">A Gift of Nature</p>
                </div>
            </div>

            {/* Content Section - 50% Split, Balanced & Professional */}
            <div className="relative flex-1 px-10 py-8 flex flex-col justify-between -mt-10 z-10">
                <div className="space-y-10 mt-4">
                    {/* The Message - Unmistakable Center Attention with Auto-Scale */}
                    <div className="text-center space-y-6 relative">
                        <div className="flex justify-center relative z-10">
                            {/* Thin Black Line behind heart */}
                            <div className="absolute top-1/2 left-4 right-4 h-[0.5px] bg-slate-900/20 -z-10" />
                            <div className="size-10 rounded-full bg-slate-900 flex items-center justify-center shadow-2xl shadow-slate-900/20 border-4 border-white">
                                <Heart className="size-5 text-white fill-white" />
                            </div>
                        </div>
                        <div className="px-2 min-h-[120px] flex items-center justify-center">
                            <h2 className={`font-serif italic text-slate-900 leading-relaxed tracking-tight font-black transition-all duration-300 ${getFontSize(message)}`}>
                                "{message}"
                            </h2>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex flex-col items-center">
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">
                            {mainItem?.product_name_snapshot || "Floral Arrangement"}
                        </p>
                    </div>
                </div>

                {/* Footer Branding - Minimalist & Pushed to Absolute Bottom */}
                <div className="flex flex-col items-center gap-0 mt-auto pb-0.5">
                    <p className="text-[7px] font-black uppercase tracking-[0.2em] text-pink-400">Created by</p>
                    <p className="text-[9px] font-black text-slate-900 tracking-tight">{storeName}</p>
                </div>
            </div>

            {/* Static Decorations */}
            <Sparkles className="absolute top-1/2 right-10 size-6 text-yellow-400 opacity-60" />
            <Star className="absolute bottom-1/4 left-10 size-4 text-brand-primary/40" />
        </div>
    );
};
