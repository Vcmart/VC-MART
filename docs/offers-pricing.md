# Homepage offers and delivery policy

The admin Homepage Offers tab stores an `offerSlides` array in the existing
`settings/homepage` Firestore document. This document already permits public
reads and admin-only writes. No collection, index, security-rule change, or
product migration is required. An absent `offerSlides` field displays the
three built-in shop slides; an empty array displays no slides.

Each slide has an ID, title, subtitle, badge, description, image URL, CTA text,
optional discount text, active flag, display order, optional start/end dates
(`YYYY-MM-DD`), destination type/value, and optional shop ID. Destination
types are product ID, category ID, one of the three shop IDs, collection
(`new-arrivals`, `featured`, `best-sellers`), minimum retail discount
percentage, or search text. Shop and category URLs use existing catalog
filters. Collection URLs use existing product flags; a collection with no
matching tagged products is empty.

Sale collections use destination type `sale` and optional `selectedProductIds`
on the same offer object in `settings/homepage.offerSlides`. The stable public
URL is `/sale/<offer-id>`; renaming the offer does not change its URL. Admins
choose real Firestore products in the Sale Products picker and can search by
name, ID or SKU. Save Offer persists the selection using a transaction that
preserves other offers. The optional shop/division filter restricts selected
products further and never substitutes for membership. Missing, deleted and
inactive products are omitted; an empty selection displays “Sale products will
be available soon”. Inactive, scheduled or expired offers cannot be browsed.

Sale membership does not override pricing. Product cards, details, cart and
checkout use the existing product pricing pipeline and canonical product
records. `discountText` is promotional text, not a price or discount rule;
configure actual selling prices in product administration. There is no
offer-specific price override in this release. Firestore rules remain unchanged:
offers are public-readable and admin-editable, and products are read through
the existing public `status == active` query before selecting sale members.

Run `node tests/saleCollections.test.cjs` for membership, empty states,
unavailable products, route stability, dates and original-price regression checks.

Retail selling price comes from `salePrice` with legacy retail field
fallbacks. `price` remains the original MRP and is never synthesized for a
discount display. The card and detail view calculate the percentage from
these values. Wholesale prices are per complete set. Retail delivery is ₹0;
wholesale delivery is ₹250 multiplied by wholesale cart quantity in sets.
The browser calculates the preview, and the Cloud Function independently
reprices products from Firestore before saving the order with
`numberOfSets`, `shippingCharge`, and `currency: "INR"`.

The browser changes require a hosting release, and the server calculation
requires a Cloud Functions release. Neither is deployed by this change.
