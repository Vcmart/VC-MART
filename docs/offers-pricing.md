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
