import React from 'react';
import { Instagram, Facebook, Twitter, Music2, Send, Globe } from 'lucide-react';

interface SocialLinksProps {
  settings: any;
  className?: string;
  iconClassName?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({ 
  settings, 
  className = "flex items-center gap-6",
  iconClassName = "size-5"
}) => {
  const socialLinks = settings?.social_links;

  if (!socialLinks) return null;

  return (
    <div className={className}>
      {socialLinks.instagram && (
        <a href={socialLinks.instagram} target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">
          <Instagram className={iconClassName} />
        </a>
      )}
      {socialLinks.facebook && (
        <a href={socialLinks.facebook} target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">
          <Facebook className={iconClassName} />
        </a>
      )}
      {socialLinks.tiktok && (
        <a href={socialLinks.tiktok} target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">
          <Music2 className={iconClassName} />
        </a>
      )}
      {socialLinks.telegram && (
        <a href={socialLinks.telegram} target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">
          <Send className={iconClassName} />
        </a>
      )}
      {socialLinks.twitter && (
        <a href={socialLinks.twitter} target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">
          <Twitter className={iconClassName} />
        </a>
      )}
      {socialLinks.website && (
        <a href={socialLinks.website} target="_blank" rel="noreferrer" className="hover:opacity-100 transition-opacity">
          <Globe className={iconClassName} />
        </a>
      )}
    </div>
  );
};
