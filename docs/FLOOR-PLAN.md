# Apartment floor plan

![Scale floor plan with rooms, furniture, openings, and ruler](floor-plan.svg)

The one-bedroom apartment has **815 sq ft of indoor floor area (75.76 m²)**. The balcony adds 84 sq ft, bringing the playable footprint to **900 sq ft** when rounded after adding both areas. North is at the top. Game coordinates measure metres, with **x** east, **z** south, and **y** up. The drawing uses a 1 m grid.

| Zone | Footprint | Connections |
| --- | --- | --- |
| Living room | 4.60 × 4.55 m | Dining, entry, balcony |
| Dining room | 2.80 × 3.10 m | Living, kitchen, entry |
| Kitchen | 2.95 × 4.55 m | Dining, entry |
| Entry | 2.80 × 1.45 m | Living, dining, kitchen, private hall |
| Private hall | 3.70 × 1.22 m | Entry, bedroom, bath |
| Bedroom | 4.75 × 3.78 m | Private hall |
| Bathroom | 2.45 × 2.53 m | Private hall |
| Balcony | 4.60 × 1.70 m | Living |

Short partitions frame the dining openings. The private hall begins at the entry and turns toward the bedroom and bathroom, blocking direct views from the living room. The full bathroom fits a 1.64 m tub, vanity, toilet, and linen cabinet in about 67 sq ft.

The gate tests 0.90 m clear routes from the living room and kitchen into dining, and from the private hall into the bathroom. Player eye level is 1.63 m and collision radius is 0.24 m.

The [layout table](../app/game/layout.js) holds the rooms, openings, furniture, Bobo spots, and Roomba route. Regenerate the floor plan with `node scripts/floor-plan.mjs` after a layout change.
