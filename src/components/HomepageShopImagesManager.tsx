import React, { useEffect, useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { initialShops } from '../config/siteConfig';
import { isFirebaseConfigured } from '../lib/firebase';
import { saveHomepageShopImage, uploadBrandAsset, watchHomepageShopImages, type HomepageShopImages } from '../lib/firebaseRepository';

type PendingImage = { shopId: string; file: File; previewUrl: string };

export const HomepageShopImagesManager: React.FC = () => {
  const [images, setImages] = useState<HomepageShopImages>({});
  const [pending, setPending] = useState<PendingImage | null>(null);
  const [busyShopId, setBusyShopId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    return watchHomepageShopImages(setImages, () => setMessage('Could not load homepage images from Firebase.'));
  }, []);

  useEffect(() => () => { if (pending) URL.revokeObjectURL(pending.previewUrl); }, [pending]);

  const chooseFile = (shopId: string, file?: File) => {
    setMessage(null);
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      setMessage('Choose an image smaller than 5 MB.');
      return;
    }
    setPending({ shopId, file, previewUrl: URL.createObjectURL(file) });
  };

  const save = async (shopId: string, reset = false) => {
    if (!reset && pending?.shopId !== shopId) return;
    setBusyShopId(shopId);
    setMessage(null);
    try {
      const imageUrl = reset ? '' : await uploadBrandAsset(pending!.file);
      await saveHomepageShopImage(shopId, imageUrl);
      setPending(null);
      setMessage(reset ? 'Default image restored.' : 'Homepage image saved.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the image. Please try again.');
    } finally {
      setBusyShopId(null);
    }
  };

  return (
    <section className="mt-6 bg-white p-6 sm:p-8 rounded-3xl border border-[#E8DEC8] shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <Camera size={20} className="text-[#965215]" />
        <h3 className="text-xl font-bold font-['Marcellus'] text-stone-900">Homepage Shop Images</h3>
      </div>
      <p className="text-xs text-stone-500 mb-5">Upload a banner for each division. Changes appear on the homepage without redeploying.</p>
      {message && <p role="status" className="text-sm text-[#7A3F0E] mb-4">{message}</p>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {initialShops.map((shop) => {
          const preview = pending?.shopId === shop.id ? pending.previewUrl : images[shop.id] || shop.bannerImage;
          return (
            <div key={shop.id} className="rounded-2xl border border-stone-200 p-3 bg-[#FAF7F2]">
              <img
                src={preview}
                alt={`${shop.name} homepage banner preview`}
                className="w-full aspect-[16/10] object-cover rounded-xl bg-stone-100"
                onError={(event) => { if (event.currentTarget.src !== shop.bannerImage) event.currentTarget.src = shop.bannerImage; }}
              />
              <h4 className="text-sm font-bold mt-3 text-stone-900">{shop.name}</h4>
              <label className="block mt-3 text-xs font-semibold text-stone-700">
                Choose image
                <input type="file" accept="image/*" disabled={Boolean(busyShopId)} onChange={(event) => chooseFile(shop.id, event.target.files?.[0])} className="block w-full mt-1 text-xs text-stone-600" />
              </label>
              <div className="flex gap-2 mt-3">
                <button type="button" disabled={busyShopId !== null || pending?.shopId !== shop.id} onClick={() => void save(shop.id)} className="px-3 py-2 rounded-lg bg-[#965215] text-white text-xs font-bold disabled:opacity-50 cursor-pointer">
                  {busyShopId === shop.id ? <Loader2 size={14} className="animate-spin" /> : 'Save image'}
                </button>
                <button type="button" disabled={busyShopId !== null || !images[shop.id]} onClick={() => void save(shop.id, true)} className="px-3 py-2 rounded-lg border border-stone-300 text-stone-700 text-xs font-bold disabled:opacity-50 cursor-pointer">Reset</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
