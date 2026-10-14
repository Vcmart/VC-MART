import React, { useState } from 'react';

export const OfferBannerImage: React.FC<{ imageUrl: string; offerId: string }> = ({ imageUrl, offerId }) => {
  const [failed, setFailed] = useState(!imageUrl.trim());
  return <>
    {!failed && <img src={imageUrl.trim()} alt="" className="absolute inset-0 h-full w-full object-cover object-center" onError={() => {
      setFailed(true);
      // Do not log download tokens or signed URL parameters.
      console.error('Homepage offer banner image failed to load', { offerId, field: 'imageUrl' });
    }} />}
    {failed && <span role="status" className="absolute right-4 top-4 z-20 rounded-lg bg-black/70 px-3 py-2 text-xs text-white">Banner image unavailable</span>}
  </>;
};
