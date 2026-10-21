// Catalog for the seed script. Prices are whole dollars here; seed.mjs converts to cents.
// Structure: category -> groups -> products. A group's `tag` becomes the hashtag on its products
// (shown as #accent-chair and used for the filter pills and pages inside a category); `query` is the
// Unsplash search used for that group's photos. A null tag means the category has no hashtags.
// sizes: [label, price delta in dollars]. Variants are colors x sizes x designs.
// (Merged from 20 categories into 9 on 2026-10-21; see scripts/migrate-categories.mjs.)

export const categories = [
  {
    "slug": "beds",
    "title": "Beds",
    "description": "Solid wood bed frames with clean lines and a lived-in warmth.",
    "groups": [
      {
        "tag": null,
        "query": "farmhouse bedroom wooden bed",
        "products": [
          {
            "name": "Aspen Slatted Bed",
            "description": "A solid oak frame with a tall slatted headboard. Sturdy enough for years of use, simple enough to suit any bedroom.",
            "material": "Solid oak",
            "base": 1099,
            "colors": [
              "Natural Oak",
              "Weathered Gray"
            ],
            "sizes": [
              [
                "Queen",
                0
              ],
              [
                "King",
                200
              ]
            ],
            "designs": [
              "Slatted headboard",
              "Paneled headboard"
            ],
            "featured": true
          },
          {
            "name": "Hartwell Panel Bed",
            "description": "Raised-panel headboard and footboard with a softly distressed finish.",
            "material": "Pine and oak veneer",
            "base": 949,
            "colors": [
              "Warm White",
              "Walnut"
            ],
            "sizes": [
              [
                "Queen",
                0
              ],
              [
                "King",
                180
              ]
            ],
            "designs": []
          },
          {
            "name": "Willow Upholstered Bed",
            "description": "A linen-upholstered headboard framed in natural wood, for a softer take on farmhouse.",
            "material": "Linen and ash wood",
            "base": 1249,
            "colors": [
              "Oatmeal",
              "Stone"
            ],
            "sizes": [
              [
                "Queen",
                0
              ],
              [
                "King",
                220
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "dining-tables",
    "title": "Dining Tables",
    "description": "Gather-around tables built to host long dinners.",
    "groups": [
      {
        "tag": null,
        "query": "farmhouse dining table wood",
        "products": [
          {
            "name": "Harvest Trestle Table",
            "description": "A classic trestle base with a thick plank top that seats six comfortably.",
            "material": "Reclaimed pine",
            "base": 1399,
            "colors": [
              "Natural Pine",
              "Espresso"
            ],
            "sizes": [
              [
                "72 in",
                0
              ],
              [
                "84 in",
                250
              ]
            ],
            "designs": [
              "Trestle base",
              "Turned legs"
            ],
            "featured": true
          },
          {
            "name": "Orchard Round Table",
            "description": "A round pedestal table that keeps conversation flowing, with a matte oak top.",
            "material": "Solid oak",
            "base": 1099,
            "colors": [
              "Natural Oak",
              "Black"
            ],
            "sizes": [
              [
                "48 in",
                0
              ],
              [
                "60 in",
                220
              ]
            ],
            "designs": []
          },
          {
            "name": "Meadow Extension Table",
            "description": "Seats four daily and extends to eight for holidays, with a hidden leaf.",
            "material": "Acacia wood",
            "base": 1299,
            "colors": [
              "Honey",
              "Gray Wash"
            ],
            "sizes": [
              [
                "60-80 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "sofas",
    "title": "Sofas",
    "description": "Couches and matching sofa sets in washable, textured fabrics.",
    "groups": [
      {
        "tag": "couch",
        "query": "modern farmhouse couch living room",
        "products": [
          {
            "name": "Cedar Slipcover Couch",
            "description": "Deep seats and a removable slipcover that goes straight into the wash.",
            "material": "Cotton-linen slipcover, kiln-dried hardwood frame",
            "base": 1599,
            "colors": [
              "Ivory",
              "Flax"
            ],
            "sizes": [
              [
                "84 in",
                0
              ],
              [
                "96 in",
                200
              ]
            ],
            "designs": [],
            "featured": true
          },
          {
            "name": "Birch Track-Arm Couch",
            "description": "Slim track arms and a firm back cushion for a tailored, modern look.",
            "material": "Performance weave, hardwood frame",
            "base": 1399,
            "colors": [
              "Charcoal",
              "Sand"
            ],
            "sizes": [
              [
                "80 in",
                0
              ],
              [
                "92 in",
                180
              ]
            ],
            "designs": []
          },
          {
            "name": "Linden Leather Couch",
            "description": "Top-grain leather that softens and darkens beautifully with age.",
            "material": "Top-grain leather",
            "base": 2199,
            "colors": [
              "Cognac",
              "Espresso"
            ],
            "sizes": [
              [
                "86 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "sofa-set",
        "query": "living room sofa set cozy",
        "products": [
          {
            "name": "Homestead 3-Piece Set",
            "description": "Sofa, loveseat and armchair in a coordinated textured weave.",
            "material": "Woven polyester, hardwood frame",
            "base": 2799,
            "colors": [
              "Oatmeal",
              "Slate"
            ],
            "sizes": [
              [
                "3-piece",
                0
              ],
              [
                "4-piece",
                700
              ]
            ],
            "designs": [],
            "featured": true
          },
          {
            "name": "Prairie Sectional Set",
            "description": "An L-shaped sectional with a matching ottoman, made for movie nights.",
            "material": "Performance linen blend",
            "base": 2499,
            "colors": [
              "Cream",
              "Taupe"
            ],
            "sizes": [
              [
                "Left-facing",
                0
              ],
              [
                "Right-facing",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Sawyer Roll-Arm Set",
            "description": "Rolled arms and tufted backs bring a touch of tradition to a modern room.",
            "material": "Cotton blend, solid wood frame",
            "base": 2999,
            "colors": [
              "Stone",
              "Navy"
            ],
            "sizes": [
              [
                "2-piece",
                0
              ],
              [
                "3-piece",
                600
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "chairs",
    "title": "Chairs",
    "description": "Dining, accent and counter seating with honest craftsmanship.",
    "groups": [
      {
        "tag": "dining-chair",
        "query": "wooden dining chair farmhouse",
        "products": [
          {
            "name": "Cottage Spindle Chair",
            "description": "A spindle-back dining chair that is lighter than it looks and very comfortable.",
            "material": "Solid beech",
            "base": 189,
            "colors": [
              "Natural",
              "Black"
            ],
            "sizes": [
              [
                "Standard",
                0
              ]
            ],
            "designs": [
              "Spindle back",
              "Cross back"
            ],
            "featured": true
          }
        ]
      },
      {
        "tag": "accent-chair",
        "query": "accent chair armchair living room",
        "products": [
          {
            "name": "Barn Linen Accent Chair",
            "description": "A relaxed accent chair with a linen seat and a rounded back.",
            "material": "Linen and ash wood",
            "base": 449,
            "colors": [
              "Natural Linen",
              "Sage"
            ],
            "sizes": [
              [
                "Standard",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Hartley Wingback Chair",
            "description": "A classic wingback with a high back for cozy reading, in a soft textured weave.",
            "material": "Woven fabric, solid beech frame",
            "base": 599,
            "colors": [
              "Oatmeal",
              "Sage"
            ],
            "sizes": [
              [
                "Standard",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Marlow Barrel Accent Chair",
            "description": "A rounded barrel back and a deep seat that invite you to curl up with a book.",
            "material": "Boucle, hardwood frame",
            "base": 549,
            "colors": [
              "Cream",
              "Charcoal"
            ],
            "sizes": [
              [
                "Standard",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "counter-stool",
        "query": "bar stool kitchen counter",
        "products": [
          {
            "name": "Ridge Counter Stool",
            "description": "A swivel stool with a wood seat and an iron footrest, for kitchen islands.",
            "material": "Oak and iron",
            "base": 219,
            "colors": [
              "Natural Oak",
              "Walnut"
            ],
            "sizes": [
              [
                "Counter 24 in",
                0
              ],
              [
                "Bar 30 in",
                20
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "rocking-chair",
        "query": "wooden rocking chair",
        "products": [
          {
            "name": "Juniper Rocking Chair",
            "description": "A solid wood rocker with a gentle motion and a woven seat, made for porches and nurseries.",
            "material": "Solid ash",
            "base": 429,
            "colors": [
              "Natural Ash",
              "Black"
            ],
            "sizes": [
              [
                "Standard",
                0
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "consoles-storage",
    "title": "Consoles & Storage",
    "description": "TV stands, console tables and drawer chests for media, entryways and bedrooms.",
    "groups": [
      {
        "tag": "tv-stand",
        "query": "tv stand console living room wood",
        "products": [
          {
            "name": "Ranch Media Console",
            "description": "A low, wide console with sliding barn doors and cable pass-throughs.",
            "material": "Pine and iron",
            "base": 899,
            "colors": [
              "Natural Pine",
              "Gray Wash"
            ],
            "sizes": [
              [
                "60 in",
                0
              ],
              [
                "72 in",
                120
              ]
            ],
            "designs": [
              "Barn doors",
              "Open shelves"
            ]
          },
          {
            "name": "Timber Slat TV Stand",
            "description": "A slatted front and tapered legs, with room for a soundbar.",
            "material": "Acacia",
            "base": 749,
            "colors": [
              "Honey",
              "Walnut"
            ],
            "sizes": [
              [
                "58 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Farmhouse Corner TV Table",
            "description": "Fits snugly into a corner and holds screens up to 50 inches.",
            "material": "Engineered wood and iron",
            "base": 549,
            "colors": [
              "White",
              "Black"
            ],
            "sizes": [
              [
                "44 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "console-table",
        "query": "console table entryway",
        "products": [
          {
            "name": "Gatherer Entry Console",
            "description": "A narrow console with a lower shelf for baskets and shoes.",
            "material": "Reclaimed pine",
            "base": 429,
            "colors": [
              "Natural Pine",
              "Black"
            ],
            "sizes": [
              [
                "48 in",
                0
              ],
              [
                "60 in",
                70
              ]
            ],
            "designs": []
          },
          {
            "name": "Brook Sofa Table",
            "description": "Sits behind a sofa and provides a surface for lamps and books.",
            "material": "Oak veneer",
            "base": 399,
            "colors": [
              "White Oak",
              "Walnut"
            ],
            "sizes": [
              [
                "52 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Crossbuck Console",
            "description": "Crossed legs and a worn finish add farmhouse charm to any hallway.",
            "material": "Solid pine",
            "base": 479,
            "colors": [
              "Weathered Gray",
              "Cream"
            ],
            "sizes": [
              [
                "54 in",
                0
              ],
              [
                "66 in",
                80
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "drawer-chest",
        "query": "wooden dresser chest of drawers",
        "products": [
          {
            "name": "Heritage 5-Drawer Chest",
            "description": "A tall chest with dovetailed drawers and a worn-in finish.",
            "material": "Solid pine",
            "base": 899,
            "colors": [
              "Natural Pine",
              "Weathered Gray"
            ],
            "sizes": [
              [
                "5-drawer",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Orchard 3-Drawer Chest",
            "description": "A compact chest that suits a small bedroom or an entryway.",
            "material": "Oak veneer",
            "base": 649,
            "colors": [
              "White Oak",
              "Espresso"
            ],
            "sizes": [
              [
                "3-drawer",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Cottage Six-Drawer Dresser",
            "description": "A wide dresser with six drawers and a generous top surface.",
            "material": "Pine and oak",
            "base": 1099,
            "colors": [
              "Cream",
              "Walnut"
            ],
            "sizes": [
              [
                "60 in",
                0
              ],
              [
                "72 in",
                150
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "accent-tables",
    "title": "Accent Tables",
    "description": "Coffee tables, side tables and night stands in solid wood and iron.",
    "groups": [
      {
        "tag": "coffee-table",
        "query": "coffee table living room wood",
        "products": [
          {
            "name": "Hollis Lift-Top Coffee Table",
            "description": "A lift-top surface that doubles as a desk, with hidden storage underneath.",
            "material": "Reclaimed pine",
            "base": 449,
            "colors": [
              "Natural Pine",
              "Espresso"
            ],
            "sizes": [
              [
                "42 in",
                0
              ],
              [
                "48 in",
                60
              ]
            ],
            "designs": []
          },
          {
            "name": "Ember Round Coffee Table",
            "description": "A round oak top on a black iron base that is easy to walk around.",
            "material": "Oak and iron",
            "base": 379,
            "colors": [
              "White Oak",
              "Black"
            ],
            "sizes": [
              [
                "36 in",
                0
              ],
              [
                "42 in",
                50
              ]
            ],
            "designs": []
          },
          {
            "name": "Cobble Nesting Coffee Set",
            "description": "Two nesting tables in different heights that pull apart when you need more surface.",
            "material": "Solid acacia",
            "base": 329,
            "colors": [
              "Honey",
              "Walnut"
            ],
            "sizes": [
              [
                "Set of 2",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "side-table",
        "query": "side table bedside wooden",
        "products": [
          {
            "name": "Birch Round Side Table",
            "description": "A slim round table with a pale wood top that fits beside any sofa.",
            "material": "Birch",
            "base": 199,
            "colors": [
              "Natural",
              "Black"
            ],
            "sizes": [
              [
                "18 in",
                0
              ],
              [
                "22 in",
                25
              ]
            ],
            "designs": []
          },
          {
            "name": "Tripod Accent Side Table",
            "description": "Splayed wooden legs and a round top, for a light and airy look.",
            "material": "Ash wood",
            "base": 169,
            "colors": [
              "Natural Ash",
              "Gray Wash"
            ],
            "sizes": [
              [
                "20 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Barnyard Drawer Side Table",
            "description": "A square side table with a single drawer and a lower shelf.",
            "material": "Pine and iron",
            "base": 229,
            "colors": [
              "Weathered Gray",
              "Cream"
            ],
            "sizes": [
              [
                "22 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "night-stand",
        "query": "nightstand bedroom wooden",
        "products": [
          {
            "name": "Sparrow Two-Drawer Nightstand",
            "description": "Two roomy drawers with iron pulls and a top wide enough for a lamp and a book.",
            "material": "Solid oak",
            "base": 349,
            "colors": [
              "Natural Oak",
              "White"
            ],
            "sizes": [
              [
                "24 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Cedar Open-Shelf Nightstand",
            "description": "A drawer on top and an open shelf below for baskets and books.",
            "material": "Cedar and pine",
            "base": 299,
            "colors": [
              "Honey",
              "Black"
            ],
            "sizes": [
              [
                "22 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Willow Floating Nightstand",
            "description": "Wall-mounted for a clean floor and a modern look, with a soft-close drawer.",
            "material": "Walnut veneer",
            "base": 189,
            "colors": [
              "Walnut",
              "White Oak"
            ],
            "sizes": [
              [
                "18 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "lighting",
    "title": "Lighting",
    "description": "Table and floor lamps and statement chandeliers in black iron, wood and warm brass.",
    "groups": [
      {
        "tag": "lamp",
        "query": "table lamp bedside",
        "products": [
          {
            "name": "Silo Table Lamp",
            "description": "A ceramic base with a pleated linen shade and a warm glow.",
            "material": "Ceramic and linen",
            "base": 119,
            "colors": [
              "Cream",
              "Sage"
            ],
            "sizes": [
              [
                "24 in",
                0
              ],
              [
                "28 in",
                20
              ]
            ],
            "designs": [],
            "featured": true
          },
          {
            "name": "Farmstead Floor Lamp",
            "description": "A tripod floor lamp in wood and iron with a drum shade.",
            "material": "Wood and iron",
            "base": 179,
            "colors": [
              "Natural",
              "Black"
            ],
            "sizes": [
              [
                "60 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Lantern Table Lamp",
            "description": "A lantern-style lamp with a clear glass body and an exposed bulb.",
            "material": "Glass and iron",
            "base": 99,
            "colors": [
              "Black",
              "Brass"
            ],
            "sizes": [
              [
                "22 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "chandelier",
        "query": "chandelier rustic lighting",
        "products": [
          {
            "name": "Barnwood Beam Chandelier",
            "description": "A reclaimed-look wood beam with six candle-style lights on black iron arms.",
            "material": "Wood and black iron",
            "base": 429,
            "colors": [
              "Natural Wood",
              "Black"
            ],
            "sizes": [
              [
                "36 in",
                0
              ],
              [
                "48 in",
                90
              ]
            ],
            "designs": [],
            "featured": true
          },
          {
            "name": "Iron Ring Chandelier",
            "description": "A hand-forged iron ring that adds an industrial edge over a dining table.",
            "material": "Forged iron",
            "base": 349,
            "colors": [
              "Matte Black",
              "Aged Bronze"
            ],
            "sizes": [
              [
                "28 in",
                0
              ],
              [
                "36 in",
                70
              ]
            ],
            "designs": []
          },
          {
            "name": "Orchard Orb Chandelier",
            "description": "Open metal orbs with a soft brass finish that glow warmly.",
            "material": "Brass-finish steel",
            "base": 499,
            "colors": [
              "Antique Brass",
              "Black"
            ],
            "sizes": [
              [
                "5-light",
                0
              ],
              [
                "8-light",
                120
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "soft-furnishings",
    "title": "Soft Furnishings",
    "description": "Cushions, rugs and curtains in linen, wool and cotton.",
    "groups": [
      {
        "tag": "cushion",
        "query": "decorative throw pillows sofa",
        "products": [
          {
            "name": "Heritage Linen Cushion",
            "description": "A stonewashed linen cushion that gets softer with every wash.",
            "material": "100% linen",
            "base": 39,
            "colors": [
              "Natural",
              "Sage"
            ],
            "sizes": [
              [
                "18 x 18 in",
                0
              ],
              [
                "20 x 20 in",
                6
              ]
            ],
            "designs": []
          },
          {
            "name": "Fireside Wool Throw Cushion",
            "description": "A chunky knit wool cushion for cozy evenings.",
            "material": "Wool blend",
            "base": 49,
            "colors": [
              "Cream",
              "Charcoal"
            ],
            "sizes": [
              [
                "18 x 18 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Gingham Check Cushion",
            "description": "A classic cotton gingham check with a hidden zip.",
            "material": "Cotton",
            "base": 35,
            "colors": [
              "Black and White",
              "Sage and White"
            ],
            "sizes": [
              [
                "18 x 18 in",
                0
              ],
              [
                "22 x 22 in",
                8
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "rug",
        "query": "area rug living room neutral",
        "products": [
          {
            "name": "Meadow Jute Rug",
            "description": "A hand-woven jute rug with a natural, earthy texture.",
            "material": "Jute",
            "base": 299,
            "colors": [
              "Natural",
              "Bleached"
            ],
            "sizes": [
              [
                "5 x 8 ft",
                0
              ],
              [
                "8 x 10 ft",
                220
              ]
            ],
            "designs": [],
            "featured": true
          },
          {
            "name": "Heirloom Vintage-Style Rug",
            "description": "A faded, vintage-inspired pattern that hides foot traffic and spills.",
            "material": "Polyester, machine washable",
            "base": 349,
            "colors": [
              "Faded Blue",
              "Rust"
            ],
            "sizes": [
              [
                "5 x 8 ft",
                0
              ],
              [
                "8 x 10 ft",
                240
              ]
            ],
            "designs": []
          },
          {
            "name": "Hearth Wool Runner",
            "description": "A flat-weave wool runner that is perfect in hallways and kitchens.",
            "material": "Wool",
            "base": 199,
            "colors": [
              "Ivory and Charcoal",
              "Cream and Tan"
            ],
            "sizes": [
              [
                "2.5 x 8 ft",
                0
              ],
              [
                "2.5 x 10 ft",
                40
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "curtain",
        "query": "linen curtains window",
        "products": [
          {
            "name": "Heirloom Linen Curtain Panel",
            "description": "A single panel of lightly textured linen that filters daylight beautifully.",
            "material": "100% linen",
            "base": 79,
            "colors": [
              "Natural",
              "Sage"
            ],
            "sizes": [
              [
                "84 in",
                0
              ],
              [
                "96 in",
                10
              ]
            ],
            "designs": []
          },
          {
            "name": "Farmstead Blackout Curtain",
            "description": "A heavy cotton blend that blocks light and keeps the room cool.",
            "material": "Cotton blend, blackout lining",
            "base": 99,
            "colors": [
              "Oatmeal",
              "Charcoal"
            ],
            "sizes": [
              [
                "84 in",
                0
              ],
              [
                "96 in",
                12
              ]
            ],
            "designs": []
          },
          {
            "name": "Meadow Sheer Voile Curtain",
            "description": "A light, airy panel that adds privacy without losing the sunshine.",
            "material": "Cotton voile",
            "base": 59,
            "colors": [
              "White",
              "Ivory"
            ],
            "sizes": [
              [
                "84 in",
                0
              ],
              [
                "96 in",
                8
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  },
  {
    "slug": "decor",
    "title": "Decor",
    "description": "Mirrors, vases and candles that finish a room.",
    "groups": [
      {
        "tag": "mirror",
        "query": "round mirror wall decor",
        "products": [
          {
            "name": "Round Wood-Frame Mirror",
            "description": "A round mirror in a slim wooden frame, lovely over a console or a sink.",
            "material": "Wood frame, glass",
            "base": 149,
            "colors": [
              "Natural",
              "Black"
            ],
            "sizes": [
              [
                "24 in",
                0
              ],
              [
                "30 in",
                40
              ],
              [
                "36 in",
                90
              ]
            ],
            "designs": []
          },
          {
            "name": "Arched Floor Mirror",
            "description": "A tall arched mirror that leans against the wall, with an iron frame.",
            "material": "Iron frame, glass",
            "base": 299,
            "colors": [
              "Matte Black",
              "Aged Brass"
            ],
            "sizes": [
              [
                "65 in",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Window-Pane Wall Mirror",
            "description": "A paned mirror that looks like a farmhouse window and makes a room feel bigger.",
            "material": "Wood frame, glass",
            "base": 219,
            "colors": [
              "White",
              "Weathered Gray"
            ],
            "sizes": [
              [
                "36 x 48 in",
                0
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "vase",
        "query": "ceramic vase flowers",
        "products": [
          {
            "name": "Terracotta Pitcher Vase",
            "description": "A hand-thrown terracotta pitcher with a matte finish, lovely with wildflowers.",
            "material": "Terracotta",
            "base": 48,
            "colors": [
              "Natural Clay",
              "Chalk White"
            ],
            "sizes": [
              [
                "Small",
                0
              ],
              [
                "Large",
                22
              ]
            ],
            "designs": []
          },
          {
            "name": "Stoneware Bud Vase Set",
            "description": "Three small stoneware vases in graduated heights for single stems.",
            "material": "Glazed stoneware",
            "base": 54,
            "colors": [
              "Cream",
              "Sage"
            ],
            "sizes": [
              [
                "Set of 3",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Galvanized Farmhouse Vase",
            "description": "A weathered galvanized metal vase with a vintage look that holds up outdoors too.",
            "material": "Galvanized steel",
            "base": 39,
            "colors": [
              "Zinc",
              "Black"
            ],
            "sizes": [
              [
                "Small",
                0
              ],
              [
                "Medium",
                14
              ],
              [
                "Large",
                28
              ]
            ],
            "designs": []
          }
        ]
      },
      {
        "tag": "candle",
        "query": "candles home decor",
        "products": [
          {
            "name": "Hearth Soy Candle",
            "description": "A hand-poured soy candle with a cotton wick and a 50-hour burn time.",
            "material": "Soy wax, glass jar",
            "base": 28,
            "colors": [
              "Cedar and Smoke",
              "Linen and Lavender"
            ],
            "sizes": [
              [
                "8 oz",
                0
              ],
              [
                "14 oz",
                12
              ]
            ],
            "designs": []
          },
          {
            "name": "Pillar Candle Trio",
            "description": "Three unscented pillar candles in graduated heights.",
            "material": "Paraffin-free wax",
            "base": 34,
            "colors": [
              "Ivory",
              "Black"
            ],
            "sizes": [
              [
                "Set of 3",
                0
              ]
            ],
            "designs": []
          },
          {
            "name": "Iron Candle Holder",
            "description": "A hand-forged candle holder for pillars, with a soft matte finish.",
            "material": "Forged iron",
            "base": 42,
            "colors": [
              "Black",
              "Aged Bronze"
            ],
            "sizes": [
              [
                "Small",
                0
              ],
              [
                "Large",
                14
              ]
            ],
            "designs": []
          }
        ]
      }
    ]
  }
];
