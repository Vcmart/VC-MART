import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import ts from 'typescript';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const source = resolve(process.argv[2] || '../migration/legacy-data');
const apply = process.argv.includes('--apply');
const readJson = async (name, fallback = []) => {
  try { const contents = await readFile(resolve(source, name), 'utf8'); return contents.trim() ? JSON.parse(contents) : fallback; }
  catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
};
const [products, coupons, usages, shops, settings, branding] = await Promise.all([
  readJson('products.json'), readJson('coupons.json'), readJson('coupon_usages.json'),
  readJson('shops.json'), readJson('settings.json', {}), readJson('branding.json', {}),
]);
const legacySource = await readFile(resolve(source, 'initialData.ts'), 'utf8').catch((error) => error.code === 'ENOENT' ? '' : Promise.reject(error));
let staticProducts = [];
if (legacySource) {
  const sourceFile = ts.createSourceFile('initialData.ts', legacySource, ts.ScriptTarget.Latest, true);
  const declaration = sourceFile.statements.flatMap((statement) => statement.declarationList?.declarations || []).find((item) => item.name?.getText(sourceFile) === 'rawInitialProducts');
  if (declaration?.initializer) {
    const validateLiteral = (node) => {
      if (ts.isArrayLiteralExpression(node)) node.elements.forEach(validateLiteral);
      else if (ts.isObjectLiteralExpression(node)) node.properties.forEach((property) => {
        if (!ts.isPropertyAssignment(property)) throw new Error('Legacy product source must contain only static object data.');
        validateLiteral(property.initializer);
      });
      else if (!(ts.isStringLiteral(node) || ts.isNumericLiteral(node) || node.kind === ts.SyntaxKind.TrueKeyword || node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword)) throw new Error('Legacy product source contains executable code; import only static product data.');
    };
    validateLiteral(declaration.initializer);
    staticProducts = runInNewContext(`(${declaration.initializer.getText(sourceFile)})`, Object.create(null), { timeout: 1000 });
  }
}
const mergedProducts = [...new Map([...staticProducts, ...products].filter((product) => product?.id).map((product) => [String(product.id), product])).values()];
const projectId = process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID;

const productDocs = mergedProducts.filter((p) => p?.id && p?.shopId).map((p) => {
  const setSize = Math.max(1, Number(p.setSize ?? p.set_size ?? 12));
  const retailPrice = Number(p.retailPrice ?? p.retail_price ?? p.salePrice ?? p.price ?? 0);
  const wholesalePrice = Number(p.wholesalePrice ?? p.wholesale_price ?? 0);
  const sizes = Array.isArray(p.sizeVariants) ? p.sizeVariants : Array.isArray(p.size_variants) ? p.size_variants : [];
  const images = (Array.isArray(p.images) ? p.images : []).filter((url) => typeof url === 'string' && url.trim());
  return { ...p, sku: p.sku || p.id.toUpperCase(), name: String(p.name || ''), description: p.description || '', shortDescription: p.shortDescription || '', images, retailPrice, salePrice: retailPrice, price: retailPrice, wholesalePrice, wholesaleEnabled: Boolean(p.wholesaleEnabled ?? p.wholesale_enabled ?? false), setSize, wholesaleMinimumSets: Math.max(1, Number(p.wholesaleMinimumSets ?? p.wholesale_minimum_sets ?? 1)), sizeVariants: sizes, stock: Number(p.stock || 0), status: ['active','inactive','draft','out_of_stock'].includes(p.status) ? p.status : 'draft', createdAt: p.createdAt || new Date().toISOString(), updatedAt: p.updatedAt || new Date().toISOString() };
});
const couponDocs = coupons.filter((c) => c?.id && c?.code).map((c) => ({ ...c, code: String(c.code).trim().toUpperCase(), type: c.type || c.discount_type || 'percentage', value: Number(c.value ?? c.discount_value ?? 0), minOrder: Number(c.minOrder ?? c.minimum_order_value ?? 0), maxDiscount: Number(c.maxDiscount ?? c.maximum_discount ?? 0), startDate: c.startDate || c.start_at || null, expiryDate: c.expiryDate || c.expires_at || null, usageLimit: Number(c.usageLimit ?? c.usage_limit ?? 0), usedCount: Number(c.usedCount ?? c.usage_count ?? 0), perCustomerLimit: Number(c.perCustomerLimit ?? c.per_customer_limit ?? 1), applicableShoppingType: c.applicableShoppingType || c.applicable_shopping_type || 'both', shopId: c.shopId || c.applicable_shop || 'all', applicableProducts: c.applicableProducts || c.applicable_products || 'all', active: c.active === true }));
const usageDocs = usages.filter((u) => u?.id && u?.coupon_id && u?.order_id && !/test|demo/i.test(`${u.order_id} ${u.customer_email || ''}`));
console.log(JSON.stringify({ projectId: projectId || '(not configured)', source, mode: apply ? 'APPLY' : 'DRY RUN', products: productDocs.length, coupons: couponDocs.length, usageRecords: usageDocs.length, shops: shops.length }, null, 2));
if (!apply) { console.log('No Firestore writes performed. Add --apply to import these JSON files.'); process.exit(0); }
if (!projectId) throw new Error('Set GCLOUD_PROJECT or FIREBASE_PROJECT_ID before applying the import.');
initializeApp({ credential: applicationDefault(), projectId, storageBucket: process.env.FIREBASE_STORAGE_BUCKET });
const db = getFirestore();

async function writeCollection(name, rows) {
  for (let offset = 0; offset < rows.length; offset += 400) {
    const batch = db.batch();
    for (const row of rows.slice(offset, offset + 400)) {
      const { id, ...data } = row;
      batch.set(db.collection(name).doc(String(id)), { ...data, updatedAt: data.updatedAt || new Date().toISOString() }, { merge: true });
    }
    await batch.commit();
  }
}
await writeCollection('products', productDocs);
await writeCollection('coupons', couponDocs);
await writeCollection('shops', shops);
await db.doc('settings/store').set({ ...settings, updatedAt: new Date().toISOString() }, { merge: true });
for (const usage of usageDocs) {
  const { id, ...data } = usage;
  await db.collection('couponUsages').doc(`legacy_${id}`).set({ ...data, legacy: true, importedAt: new Date().toISOString() }, { merge: true });
}

const configuredBucket = process.env.FIREBASE_STORAGE_BUCKET;
if (configuredBucket) {
  try {
    const logoBytes = await readFile(resolve(source, 'vc_mart_official_logo.jpg'));
    const objectPath = 'branding/vc-mart-official-logo.jpg';
    const token = randomUUID();
    const file = getStorage().bucket(configuredBucket).file(objectPath);
    await file.save(logoBytes, { resumable: false, metadata: { contentType: 'image/jpeg', metadata: { firebaseStorageDownloadTokens: token } } });
    const logoUrl = `https://firebasestorage.googleapis.com/v0/b/${configuredBucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=${token}`;
    await db.doc('branding/site').set({ logoUrl, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
}
if (branding && Object.keys(branding).length) await db.doc('branding/site').set(branding, { merge: true });
console.log('Import complete. Review Firestore documents and Storage before deploying the public app.');
