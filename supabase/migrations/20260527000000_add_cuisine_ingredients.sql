/*
  # Add 199 Universal Cuisine Ingredients

  ## Summary
  Inserts 199 universal ingredients (user_id = NULL) spanning 9 cuisines:
  Italy, France, Japan, China, Mexico, India, Thailand, Spain, Greece, Morocco.

  Each ingredient gets one unit_conversion row mapping its preferred_unit → base_unit.
  The WHERE NOT EXISTS guard makes the migration fully idempotent — re-running it
  skips any ingredient that already exists (matched by name + user_id IS NULL).
  The CTE returns only newly-inserted rows, so unit_conversions are only added
  for freshly inserted ingredients (no orphan/duplicate conversion rows).

  ## Notes
  - tsp/tbsp conversions are intentionally omitted — global fallback rows handle those.
  - user_id = NULL means universal, visible to all authenticated users.
*/

WITH inserted AS (
  INSERT INTO public.ingredients (id, name, category, base_unit, preferred_unit, user_id)
  SELECT gen_random_uuid(), v.name, v.category, v.base_unit, v.preferred_unit, NULL
  FROM (VALUES
    -- Italy (20)
    ('Artichoke',                          'Vegetable',    'g',  'count'),
    ('Fennel Bulb',                         'Vegetable',    'g',  'count'),
    ('Radicchio',                           'Vegetable',    'g',  'head'),
    ('Arugula',                             'Vegetable',    'g',  'bag'),
    ('Endive',                              'Vegetable',    'g',  'head'),
    ('Fresh Basil',                         'Vegetable',    'g',  'bunch'),
    ('Fresh Flat-Leaf Parsley',             'Vegetable',    'g',  'bunch'),
    ('Fresh Rosemary',                      'Vegetable',    'g',  'bunch'),
    ('Fresh Sage',                          'Vegetable',    'g',  'bunch'),
    ('Capers',                              'Spice/Sauce',  'g',  'jar'),
    ('Balsamic Vinegar',                    'Spice/Sauce',  'ml', 'bottle'),
    ('White Wine Vinegar',                  'Spice/Sauce',  'ml', 'bottle'),
    ('Anchovy Paste',                       'Spice/Sauce',  'g',  'jar'),
    ('Dried Marjoram',                      'Spice/Sauce',  'g',  'jar'),
    ('Sun-Dried Tomatoes',                  'Pantry',       'g',  'jar'),
    ('Canned Whole Tomatoes',               'Pantry',       'g',  'can'),
    ('Green Olives',                        'Pantry',       'g',  'jar'),
    ('Kalamata Olives',                     'Pantry',       'g',  'jar'),
    ('Pine Nuts',                           'Pantry',       'g',  'bag'),
    ('Canned Artichoke Hearts',             'Pantry',       'g',  'can'),
    -- France (20)
    ('Haricots Verts',                      'Vegetable',    'g',  'bag'),
    ('Watercress',                          'Vegetable',    'g',  'bag'),
    ('Celeriac (Celery Root)',              'Vegetable',    'g',  'count'),
    ('Turnip',                              'Vegetable',    'g',  'count'),
    ('Rhubarb',                             'Vegetable',    'g',  'stalk'),
    ('Fresh Tarragon',                      'Vegetable',    'g',  'bunch'),
    ('Fresh Chervil',                       'Vegetable',    'g',  'bunch'),
    ('Sorrel',                              'Vegetable',    'g',  'bunch'),
    ('Herbes de Provence',                  'Spice/Sauce',  'g',  'jar'),
    ('Dried Tarragon',                      'Spice/Sauce',  'g',  'jar'),
    ('Quatre Épices',                       'Spice/Sauce',  'g',  'jar'),
    ('Red Wine Vinegar',                    'Spice/Sauce',  'ml', 'bottle'),
    ('Champagne Vinegar',                   'Spice/Sauce',  'ml', 'bottle'),
    ('Dried Lavender',                      'Spice/Sauce',  'g',  'jar'),
    ('Blood Orange',                        'Fruit',        'g',  'count'),
    ('Quince',                              'Fruit',        'g',  'count'),
    ('Black Currant',                       'Fruit',        'g',  'container'),
    ('Cornichons',                          'Pantry',       'g',  'jar'),
    ('Chestnuts',                           'Pantry',       'g',  'bag'),
    ('Truffle (Black)',                     'Pantry',       'g',  'count'),
    -- Japan (20)
    ('Shiso (Perilla Leaves)',              'Vegetable',    'g',  'bunch'),
    ('Lotus Root',                          'Vegetable',    'g',  'count'),
    ('Burdock Root (Gobo)',                 'Vegetable',    'g',  'count'),
    ('Mizuna',                              'Vegetable',    'g',  'bag'),
    ('Japanese Eggplant',                   'Vegetable',    'g',  'count'),
    ('Edamame',                             'Vegetable',    'g',  'bag'),
    ('Bamboo Shoots (Canned)',              'Vegetable',    'g',  'can'),
    ('Taro Root',                           'Vegetable',    'g',  'count'),
    ('Wakame (Dried Seaweed)',              'Pantry',       'g',  'bag'),
    ('Nori Sheets',                         'Pantry',       'g',  'pack'),
    ('Kombu',                               'Pantry',       'g',  'bag'),
    ('Dashi Powder',                        'Spice/Sauce',  'g',  'bag'),
    ('White Miso Paste',                    'Spice/Sauce',  'g',  'tub'),
    ('Red Miso Paste',                      'Spice/Sauce',  'g',  'tub'),
    ('Ponzu Sauce',                         'Spice/Sauce',  'ml', 'bottle'),
    ('Wasabi Paste',                        'Spice/Sauce',  'g',  'container'),
    ('Shichimi Togarashi',                  'Spice/Sauce',  'g',  'jar'),
    ('Sake',                                'Pantry',       'ml', 'bottle'),
    ('Sudachi',                             'Fruit',        'g',  'count'),
    ('Ume (Japanese Plum)',                 'Fruit',        'g',  'count'),
    -- China (20)
    ('Chinese Broccoli (Gai Lan)',          'Vegetable',    'g',  'bunch'),
    ('Water Chestnuts (Canned)',            'Vegetable',    'g',  'can'),
    ('Chinese Long Beans',                  'Vegetable',    'g',  'bunch'),
    ('Winter Melon',                        'Vegetable',    'g',  'count'),
    ('Snow Peas',                           'Vegetable',    'g',  'bag'),
    ('Morning Glory (Water Spinach)',       'Vegetable',    'g',  'bag'),
    ('Chrysanthemum Greens',               'Vegetable',    'g',  'bag'),
    ('Chinese Celery',                      'Vegetable',    'g',  'bunch'),
    ('Dried Wood Ear Mushroom',             'Vegetable',    'g',  'bag'),
    ('Sichuan Peppercorns',                 'Spice/Sauce',  'g',  'jar'),
    ('Doubanjiang',                         'Spice/Sauce',  'g',  'jar'),
    ('Black Bean Sauce',                    'Spice/Sauce',  'g',  'jar'),
    ('Dried Red Chilies (Chinese)',         'Spice/Sauce',  'g',  'bag'),
    ('Chinese Sesame Paste',                'Spice/Sauce',  'g',  'jar'),
    ('Preserved Mustard Greens (Zha Cai)', 'Pantry',       'g',  'can'),
    ('Snow Fungus (White Tremella)',        'Pantry',       'g',  'bag'),
    ('Fermented Black Beans',              'Pantry',       'g',  'bag'),
    ('Longan',                              'Fruit',        'g',  'bag'),
    ('Jujube (Red Dates)',                  'Fruit',        'g',  'bag'),
    ('Pomelo',                              'Fruit',        'g',  'count'),
    -- Mexico (20)
    ('Tomatillo',                           'Vegetable',    'g',  'count'),
    ('Poblano Pepper',                      'Vegetable',    'g',  'count'),
    ('Anaheim Pepper',                      'Vegetable',    'g',  'count'),
    ('Chayote',                             'Vegetable',    'g',  'count'),
    ('Nopales (Cactus Paddles)',            'Vegetable',    'g',  'count'),
    ('Fresh Epazote',                       'Vegetable',    'g',  'bunch'),
    ('Fresh Cilantro',                      'Vegetable',    'g',  'bunch'),
    ('Dried Ancho Chile',                   'Spice/Sauce',  'g',  'bag'),
    ('Dried Guajillo Chile',                'Spice/Sauce',  'g',  'bag'),
    ('Dried Pasilla Chile',                 'Spice/Sauce',  'g',  'bag'),
    ('Dried Chile de Árbol',               'Spice/Sauce',  'g',  'bag'),
    ('Dried Morita Chile',                  'Spice/Sauce',  'g',  'bag'),
    ('Dried Cascabel Chile',                'Spice/Sauce',  'g',  'bag'),
    ('Mexican Oregano (Dried)',             'Spice/Sauce',  'g',  'jar'),
    ('Achiote Paste',                       'Spice/Sauce',  'g',  'block'),
    ('Tamarind Concentrate',                'Spice/Sauce',  'g',  'jar'),
    ('Piloncillo',                          'Baking',       'g',  'count'),
    ('Mamey Sapote',                        'Fruit',        'g',  'count'),
    ('Tejocote',                            'Fruit',        'g',  'count'),
    ('Soursop (Guanábana)',                'Fruit',        'g',  'count'),
    -- India (20)
    ('Okra',                                'Vegetable',    'g',  'bag'),
    ('Bitter Melon (Karela)',               'Vegetable',    'g',  'count'),
    ('Indian Eggplant (Brinjal)',           'Vegetable',    'g',  'count'),
    ('Drumstick (Moringa Pods)',            'Vegetable',    'g',  'count'),
    ('Fresh Curry Leaves',                  'Vegetable',    'g',  'bag'),
    ('Fenugreek Seeds',                     'Spice/Sauce',  'g',  'jar'),
    ('Asafoetida (Hing)',                   'Spice/Sauce',  'g',  'jar'),
    ('Amchur (Dried Mango Powder)',         'Spice/Sauce',  'g',  'jar'),
    ('Chaat Masala',                        'Spice/Sauce',  'g',  'jar'),
    ('Kashmiri Chili Powder',               'Spice/Sauce',  'g',  'jar'),
    ('Kasuri Methi (Dried Fenugreek Leaves)', 'Spice/Sauce', 'g', 'jar'),
    ('Black Mustard Seeds',                 'Spice/Sauce',  'g',  'jar'),
    ('Black Cardamom Pods',                 'Spice/Sauce',  'g',  'jar'),
    ('Ajwain (Carom Seeds)',                'Spice/Sauce',  'g',  'jar'),
    ('Tamarind Block',                      'Spice/Sauce',  'g',  'block'),
    ('Indian Gooseberry (Amla)',            'Fruit',        'g',  'bag'),
    ('Jackfruit (Green, Canned)',           'Pantry',       'g',  'can'),
    ('Mango Pickle (Achaar)',               'Pantry',       'g',  'jar'),
    ('Dried Kashmiri Chili',               'Spice/Sauce',  'g',  'bag'),
    ('Panch Phoron',                        'Spice/Sauce',  'g',  'jar'),
    -- Thailand (20)
    ('Lemongrass',                          'Vegetable',    'g',  'stalk'),
    ('Galangal',                            'Vegetable',    'g',  'count'),
    ('Kaffir Lime Leaves (Makrut)',         'Vegetable',    'g',  'bag'),
    ('Thai Basil',                          'Vegetable',    'g',  'bunch'),
    ('Thai Bird''s Eye Chili',             'Vegetable',    'g',  'bag'),
    ('Thai Eggplant',                       'Vegetable',    'g',  'count'),
    ('Banana Blossom',                      'Vegetable',    'g',  'count'),
    ('Pandan Leaves',                       'Vegetable',    'g',  'bag'),
    ('Krachai (Fingerroot)',                'Vegetable',    'g',  'count'),
    ('Makrut Lime',                         'Fruit',        'g',  'count'),
    ('Rambutan',                            'Fruit',        'g',  'bag'),
    ('Mangosteen',                          'Fruit',        'g',  'count'),
    ('Star Fruit (Carambola)',              'Fruit',        'g',  'count'),
    ('Shrimp Paste (Kapi)',                 'Spice/Sauce',  'g',  'jar'),
    ('Nam Prik Pao (Roasted Chili Paste)', 'Spice/Sauce',  'g',  'jar'),
    ('Galangal Powder',                     'Spice/Sauce',  'g',  'jar'),
    ('Toasted Rice Powder',                 'Spice/Sauce',  'g',  'bag'),
    ('Tamarind Paste',                      'Spice/Sauce',  'g',  'jar'),
    ('Palm Sugar',                          'Pantry',       'g',  'bag'),
    ('Dried Shrimp',                        'Pantry',       'g',  'bag'),
    -- Spain (20)
    ('Padrón Peppers',                     'Vegetable',    'g',  'bag'),
    ('Heirloom Tomato',                     'Vegetable',    'g',  'count'),
    ('Fresh Mint',                          'Vegetable',    'g',  'bunch'),
    ('Fresh Marjoram',                      'Vegetable',    'g',  'bunch'),
    ('Fresh Dill',                          'Vegetable',    'g',  'bunch'),
    ('Saffron',                             'Spice/Sauce',  'g',  'jar'),
    ('Pimentón (Hot Smoked)',              'Spice/Sauce',  'g',  'jar'),
    ('Romesco Sauce',                       'Spice/Sauce',  'g',  'jar'),
    ('Sofrito Base',                        'Spice/Sauce',  'g',  'jar'),
    ('Anise Seeds',                         'Spice/Sauce',  'g',  'jar'),
    ('Dried Ñora Pepper',                  'Spice/Sauce',  'g',  'bag'),
    ('Sherry Vinegar',                      'Spice/Sauce',  'ml', 'bottle'),
    ('Caperberries',                        'Pantry',       'g',  'jar'),
    ('Piquillo Peppers (Roasted)',          'Pantry',       'g',  'can'),
    ('Raw Almonds',                         'Pantry',       'g',  'bag'),
    ('Raw Hazelnuts',                       'Pantry',       'g',  'bag'),
    ('Quince Paste (Membrillo)',            'Pantry',       'g',  'block'),
    ('Clementine',                          'Fruit',        'g',  'count'),
    ('Loquat (Níspero)',                   'Fruit',        'g',  'count'),
    ('Seville Orange (Bitter Orange)',      'Fruit',        'g',  'count'),
    -- Greece (19 — Fresh Dill already inserted under Spain)
    ('Fresh Oregano',                       'Vegetable',    'g',  'bunch'),
    ('Horta (Wild Chicory Greens)',         'Vegetable',    'g',  'bunch'),
    ('Dandelion Greens',                    'Vegetable',    'g',  'bunch'),
    ('Swiss Chard',                         'Vegetable',    'g',  'bunch'),
    ('Grape Leaves (Preserved)',            'Pantry',       'g',  'jar'),
    ('Sumac',                               'Spice/Sauce',  'g',  'jar'),
    ('Za''atar',                           'Spice/Sauce',  'g',  'jar'),
    ('Dried Mint',                          'Spice/Sauce',  'g',  'jar'),
    ('Mastic (Mastiha)',                    'Spice/Sauce',  'g',  'jar'),
    ('Mahlab (Mahleb)',                     'Spice/Sauce',  'g',  'jar'),
    ('Tahini',                              'Spice/Sauce',  'g',  'jar'),
    ('Pomegranate Molasses',                'Spice/Sauce',  'ml', 'bottle'),
    ('Rose Water',                          'Spice/Sauce',  'ml', 'bottle'),
    ('Orange Blossom Water',               'Spice/Sauce',  'ml', 'bottle'),
    ('Pistachio Nuts',                      'Pantry',       'g',  'bag'),
    ('Raw Walnuts',                         'Pantry',       'g',  'bag'),
    ('Dried Currants',                      'Fruit',        'g',  'bag'),
    ('Mulberry',                            'Fruit',        'g',  'container'),
    ('Trahana',                             'Grain',        'g',  'bag'),
    -- Morocco (20)
    ('Butternut Squash',                    'Vegetable',    'g',  'count'),
    ('Kohlrabi',                            'Vegetable',    'g',  'count'),
    ('Kabocha Squash',                      'Vegetable',    'g',  'count'),
    ('Fresh Fenugreek Leaves (Methi)',      'Vegetable',    'g',  'bunch'),
    ('Ras El Hanout',                       'Spice/Sauce',  'g',  'jar'),
    ('Chermoula Spice Blend',              'Spice/Sauce',  'g',  'jar'),
    ('Baharat',                             'Spice/Sauce',  'g',  'jar'),
    ('Caraway Seeds',                       'Spice/Sauce',  'g',  'jar'),
    ('Nigella Seeds',                       'Spice/Sauce',  'g',  'jar'),
    ('Dried Rose Petals',                   'Spice/Sauce',  'g',  'bag'),
    ('Mace (Ground)',                       'Spice/Sauce',  'g',  'jar'),
    ('Urfa Biber (Isot Pepper)',            'Spice/Sauce',  'g',  'jar'),
    ('Aleppo Pepper',                       'Spice/Sauce',  'g',  'jar'),
    ('Merguez Spice Mix',                   'Spice/Sauce',  'g',  'bag'),
    ('Carob Molasses',                      'Spice/Sauce',  'ml', 'bottle'),
    ('Preserved Lemon',                     'Pantry',       'g',  'jar'),
    ('Dried Chickpeas',                     'Pantry',       'g',  'bag'),
    ('Canned Chickpeas',                    'Pantry',       'g',  'can'),
    ('Medjool Dates',                       'Fruit',        'g',  'box'),
    ('Barberry (Zereshk)',                  'Fruit',        'g',  'bag')
  ) AS v(name, category, base_unit, preferred_unit)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ingredients i
    WHERE i.name = v.name AND i.user_id IS NULL
  )
  RETURNING id, name
)
INSERT INTO public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
-- Italy
SELECT id, 'count',     300,   'g'  FROM inserted WHERE name = 'Artichoke'
UNION ALL
SELECT id, 'count',     250,   'g'  FROM inserted WHERE name = 'Fennel Bulb'
UNION ALL
SELECT id, 'head',      300,   'g'  FROM inserted WHERE name = 'Radicchio'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Arugula'
UNION ALL
SELECT id, 'head',      120,   'g'  FROM inserted WHERE name = 'Endive'
UNION ALL
SELECT id, 'bunch',      25,   'g'  FROM inserted WHERE name = 'Fresh Basil'
UNION ALL
SELECT id, 'bunch',      30,   'g'  FROM inserted WHERE name = 'Fresh Flat-Leaf Parsley'
UNION ALL
SELECT id, 'bunch',      20,   'g'  FROM inserted WHERE name = 'Fresh Rosemary'
UNION ALL
SELECT id, 'bunch',      20,   'g'  FROM inserted WHERE name = 'Fresh Sage'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Capers'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Balsamic Vinegar'
UNION ALL
SELECT id, 'bottle',    375,   'ml' FROM inserted WHERE name = 'White Wine Vinegar'
UNION ALL
SELECT id, 'jar',        60,   'g'  FROM inserted WHERE name = 'Anchovy Paste'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Dried Marjoram'
UNION ALL
SELECT id, 'jar',       250,   'g'  FROM inserted WHERE name = 'Sun-Dried Tomatoes'
UNION ALL
SELECT id, 'can',       400,   'g'  FROM inserted WHERE name = 'Canned Whole Tomatoes'
UNION ALL
SELECT id, 'jar',       250,   'g'  FROM inserted WHERE name = 'Green Olives'
UNION ALL
SELECT id, 'jar',       250,   'g'  FROM inserted WHERE name = 'Kalamata Olives'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Pine Nuts'
UNION ALL
SELECT id, 'can',       400,   'g'  FROM inserted WHERE name = 'Canned Artichoke Hearts'
-- France
UNION ALL
SELECT id, 'bag',       300,   'g'  FROM inserted WHERE name = 'Haricots Verts'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Watercress'
UNION ALL
SELECT id, 'count',     700,   'g'  FROM inserted WHERE name = 'Celeriac (Celery Root)'
UNION ALL
SELECT id, 'count',     180,   'g'  FROM inserted WHERE name = 'Turnip'
UNION ALL
SELECT id, 'stalk',     120,   'g'  FROM inserted WHERE name = 'Rhubarb'
UNION ALL
SELECT id, 'bunch',      20,   'g'  FROM inserted WHERE name = 'Fresh Tarragon'
UNION ALL
SELECT id, 'bunch',      20,   'g'  FROM inserted WHERE name = 'Fresh Chervil'
UNION ALL
SELECT id, 'bunch',      30,   'g'  FROM inserted WHERE name = 'Sorrel'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Herbes de Provence'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Dried Tarragon'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Quatre Épices'
UNION ALL
SELECT id, 'bottle',    375,   'ml' FROM inserted WHERE name = 'Red Wine Vinegar'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Champagne Vinegar'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Dried Lavender'
UNION ALL
SELECT id, 'count',     150,   'g'  FROM inserted WHERE name = 'Blood Orange'
UNION ALL
SELECT id, 'count',     250,   'g'  FROM inserted WHERE name = 'Quince'
UNION ALL
SELECT id, 'container', 150,   'g'  FROM inserted WHERE name = 'Black Currant'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Cornichons'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Chestnuts'
UNION ALL
SELECT id, 'count',      25,   'g'  FROM inserted WHERE name = 'Truffle (Black)'
-- Japan
UNION ALL
SELECT id, 'bunch',      25,   'g'  FROM inserted WHERE name = 'Shiso (Perilla Leaves)'
UNION ALL
SELECT id, 'count',     300,   'g'  FROM inserted WHERE name = 'Lotus Root'
UNION ALL
SELECT id, 'count',     200,   'g'  FROM inserted WHERE name = 'Burdock Root (Gobo)'
UNION ALL
SELECT id, 'bag',       150,   'g'  FROM inserted WHERE name = 'Mizuna'
UNION ALL
SELECT id, 'count',     200,   'g'  FROM inserted WHERE name = 'Japanese Eggplant'
UNION ALL
SELECT id, 'bag',       300,   'g'  FROM inserted WHERE name = 'Edamame'
UNION ALL
SELECT id, 'can',       225,   'g'  FROM inserted WHERE name = 'Bamboo Shoots (Canned)'
UNION ALL
SELECT id, 'count',     400,   'g'  FROM inserted WHERE name = 'Taro Root'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Wakame (Dried Seaweed)'
UNION ALL
SELECT id, 'pack',       25,   'g'  FROM inserted WHERE name = 'Nori Sheets'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Kombu'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dashi Powder'
UNION ALL
SELECT id, 'tub',       500,   'g'  FROM inserted WHERE name = 'White Miso Paste'
UNION ALL
SELECT id, 'tub',       500,   'g'  FROM inserted WHERE name = 'Red Miso Paste'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Ponzu Sauce'
UNION ALL
SELECT id, 'container',  43,   'g'  FROM inserted WHERE name = 'Wasabi Paste'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Shichimi Togarashi'
UNION ALL
SELECT id, 'bottle',    750,   'ml' FROM inserted WHERE name = 'Sake'
UNION ALL
SELECT id, 'count',      30,   'g'  FROM inserted WHERE name = 'Sudachi'
UNION ALL
SELECT id, 'count',      20,   'g'  FROM inserted WHERE name = 'Ume (Japanese Plum)'
-- China
UNION ALL
SELECT id, 'bunch',     300,   'g'  FROM inserted WHERE name = 'Chinese Broccoli (Gai Lan)'
UNION ALL
SELECT id, 'can',       225,   'g'  FROM inserted WHERE name = 'Water Chestnuts (Canned)'
UNION ALL
SELECT id, 'bunch',     250,   'g'  FROM inserted WHERE name = 'Chinese Long Beans'
UNION ALL
SELECT id, 'count',    2000,   'g'  FROM inserted WHERE name = 'Winter Melon'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Snow Peas'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Morning Glory (Water Spinach)'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Chrysanthemum Greens'
UNION ALL
SELECT id, 'bunch',     150,   'g'  FROM inserted WHERE name = 'Chinese Celery'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Wood Ear Mushroom'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Sichuan Peppercorns'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Doubanjiang'
UNION ALL
SELECT id, 'jar',       250,   'g'  FROM inserted WHERE name = 'Black Bean Sauce'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Red Chilies (Chinese)'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Chinese Sesame Paste'
UNION ALL
SELECT id, 'can',       280,   'g'  FROM inserted WHERE name = 'Preserved Mustard Greens (Zha Cai)'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Snow Fungus (White Tremella)'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Fermented Black Beans'
UNION ALL
SELECT id, 'bag',       300,   'g'  FROM inserted WHERE name = 'Longan'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Jujube (Red Dates)'
UNION ALL
SELECT id, 'count',     500,   'g'  FROM inserted WHERE name = 'Pomelo'
-- Mexico
UNION ALL
SELECT id, 'count',      80,   'g'  FROM inserted WHERE name = 'Tomatillo'
UNION ALL
SELECT id, 'count',     150,   'g'  FROM inserted WHERE name = 'Poblano Pepper'
UNION ALL
SELECT id, 'count',     100,   'g'  FROM inserted WHERE name = 'Anaheim Pepper'
UNION ALL
SELECT id, 'count',     400,   'g'  FROM inserted WHERE name = 'Chayote'
UNION ALL
SELECT id, 'count',     200,   'g'  FROM inserted WHERE name = 'Nopales (Cactus Paddles)'
UNION ALL
SELECT id, 'bunch',      25,   'g'  FROM inserted WHERE name = 'Fresh Epazote'
UNION ALL
SELECT id, 'bunch',      30,   'g'  FROM inserted WHERE name = 'Fresh Cilantro'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Ancho Chile'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Guajillo Chile'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Pasilla Chile'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Chile de Árbol'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Morita Chile'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Cascabel Chile'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Mexican Oregano (Dried)'
UNION ALL
SELECT id, 'block',     100,   'g'  FROM inserted WHERE name = 'Achiote Paste'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Tamarind Concentrate'
UNION ALL
SELECT id, 'count',     200,   'g'  FROM inserted WHERE name = 'Piloncillo'
UNION ALL
SELECT id, 'count',     400,   'g'  FROM inserted WHERE name = 'Mamey Sapote'
UNION ALL
SELECT id, 'count',      40,   'g'  FROM inserted WHERE name = 'Tejocote'
UNION ALL
SELECT id, 'count',    1500,   'g'  FROM inserted WHERE name = 'Soursop (Guanábana)'
-- India
UNION ALL
SELECT id, 'bag',       300,   'g'  FROM inserted WHERE name = 'Okra'
UNION ALL
SELECT id, 'count',     200,   'g'  FROM inserted WHERE name = 'Bitter Melon (Karela)'
UNION ALL
SELECT id, 'count',     150,   'g'  FROM inserted WHERE name = 'Indian Eggplant (Brinjal)'
UNION ALL
SELECT id, 'count',     150,   'g'  FROM inserted WHERE name = 'Drumstick (Moringa Pods)'
UNION ALL
SELECT id, 'bag',        20,   'g'  FROM inserted WHERE name = 'Fresh Curry Leaves'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Fenugreek Seeds'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Asafoetida (Hing)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Amchur (Dried Mango Powder)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Chaat Masala'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Kashmiri Chili Powder'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Kasuri Methi (Dried Fenugreek Leaves)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Black Mustard Seeds'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Black Cardamom Pods'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Ajwain (Carom Seeds)'
UNION ALL
SELECT id, 'block',     200,   'g'  FROM inserted WHERE name = 'Tamarind Block'
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Indian Gooseberry (Amla)'
UNION ALL
SELECT id, 'can',       400,   'g'  FROM inserted WHERE name = 'Jackfruit (Green, Canned)'
UNION ALL
SELECT id, 'jar',       300,   'g'  FROM inserted WHERE name = 'Mango Pickle (Achaar)'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Kashmiri Chili'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Panch Phoron'
-- Thailand
UNION ALL
SELECT id, 'stalk',      50,   'g'  FROM inserted WHERE name = 'Lemongrass'
UNION ALL
SELECT id, 'count',     100,   'g'  FROM inserted WHERE name = 'Galangal'
UNION ALL
SELECT id, 'bag',        15,   'g'  FROM inserted WHERE name = 'Kaffir Lime Leaves (Makrut)'
UNION ALL
SELECT id, 'bunch',      25,   'g'  FROM inserted WHERE name = 'Thai Basil'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Thai Bird''s Eye Chili'
UNION ALL
SELECT id, 'count',     100,   'g'  FROM inserted WHERE name = 'Thai Eggplant'
UNION ALL
SELECT id, 'count',     500,   'g'  FROM inserted WHERE name = 'Banana Blossom'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Pandan Leaves'
UNION ALL
SELECT id, 'count',      80,   'g'  FROM inserted WHERE name = 'Krachai (Fingerroot)'
UNION ALL
SELECT id, 'count',      50,   'g'  FROM inserted WHERE name = 'Makrut Lime'
UNION ALL
SELECT id, 'bag',       300,   'g'  FROM inserted WHERE name = 'Rambutan'
UNION ALL
SELECT id, 'count',      80,   'g'  FROM inserted WHERE name = 'Mangosteen'
UNION ALL
SELECT id, 'count',     100,   'g'  FROM inserted WHERE name = 'Star Fruit (Carambola)'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Shrimp Paste (Kapi)'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Nam Prik Pao (Roasted Chili Paste)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Galangal Powder'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Toasted Rice Powder'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Tamarind Paste'
UNION ALL
SELECT id, 'bag',       500,   'g'  FROM inserted WHERE name = 'Palm Sugar'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Dried Shrimp'
-- Spain
UNION ALL
SELECT id, 'bag',       200,   'g'  FROM inserted WHERE name = 'Padrón Peppers'
UNION ALL
SELECT id, 'count',     200,   'g'  FROM inserted WHERE name = 'Heirloom Tomato'
UNION ALL
SELECT id, 'bunch',      25,   'g'  FROM inserted WHERE name = 'Fresh Mint'
UNION ALL
SELECT id, 'bunch',      20,   'g'  FROM inserted WHERE name = 'Fresh Marjoram'
UNION ALL
SELECT id, 'bunch',      25,   'g'  FROM inserted WHERE name = 'Fresh Dill'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Saffron'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Pimentón (Hot Smoked)'
UNION ALL
SELECT id, 'jar',       300,   'g'  FROM inserted WHERE name = 'Romesco Sauce'
UNION ALL
SELECT id, 'jar',       300,   'g'  FROM inserted WHERE name = 'Sofrito Base'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Anise Seeds'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Ñora Pepper'
UNION ALL
SELECT id, 'bottle',    375,   'ml' FROM inserted WHERE name = 'Sherry Vinegar'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Caperberries'
UNION ALL
SELECT id, 'can',       185,   'g'  FROM inserted WHERE name = 'Piquillo Peppers (Roasted)'
UNION ALL
SELECT id, 'bag',       150,   'g'  FROM inserted WHERE name = 'Raw Almonds'
UNION ALL
SELECT id, 'bag',       150,   'g'  FROM inserted WHERE name = 'Raw Hazelnuts'
UNION ALL
SELECT id, 'block',     200,   'g'  FROM inserted WHERE name = 'Quince Paste (Membrillo)'
UNION ALL
SELECT id, 'count',      80,   'g'  FROM inserted WHERE name = 'Clementine'
UNION ALL
SELECT id, 'count',      30,   'g'  FROM inserted WHERE name = 'Loquat (Níspero)'
UNION ALL
SELECT id, 'count',     180,   'g'  FROM inserted WHERE name = 'Seville Orange (Bitter Orange)'
-- Greece
UNION ALL
SELECT id, 'bunch',      20,   'g'  FROM inserted WHERE name = 'Fresh Oregano'
UNION ALL
SELECT id, 'bunch',     200,   'g'  FROM inserted WHERE name = 'Horta (Wild Chicory Greens)'
UNION ALL
SELECT id, 'bunch',     200,   'g'  FROM inserted WHERE name = 'Dandelion Greens'
UNION ALL
SELECT id, 'bunch',     250,   'g'  FROM inserted WHERE name = 'Swiss Chard'
UNION ALL
SELECT id, 'jar',       400,   'g'  FROM inserted WHERE name = 'Grape Leaves (Preserved)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Sumac'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Za''atar'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Dried Mint'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Mastic (Mastiha)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Mahlab (Mahleb)'
UNION ALL
SELECT id, 'jar',       200,   'g'  FROM inserted WHERE name = 'Tahini'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Pomegranate Molasses'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Rose Water'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Orange Blossom Water'
UNION ALL
SELECT id, 'bag',       150,   'g'  FROM inserted WHERE name = 'Pistachio Nuts'
UNION ALL
SELECT id, 'bag',       150,   'g'  FROM inserted WHERE name = 'Raw Walnuts'
UNION ALL
SELECT id, 'bag',       150,   'g'  FROM inserted WHERE name = 'Dried Currants'
UNION ALL
SELECT id, 'container', 150,   'g'  FROM inserted WHERE name = 'Mulberry'
UNION ALL
SELECT id, 'bag',       500,   'g'  FROM inserted WHERE name = 'Trahana'
-- Morocco
UNION ALL
SELECT id, 'count',    1000,   'g'  FROM inserted WHERE name = 'Butternut Squash'
UNION ALL
SELECT id, 'count',     300,   'g'  FROM inserted WHERE name = 'Kohlrabi'
UNION ALL
SELECT id, 'count',    1200,   'g'  FROM inserted WHERE name = 'Kabocha Squash'
UNION ALL
SELECT id, 'bunch',     100,   'g'  FROM inserted WHERE name = 'Fresh Fenugreek Leaves (Methi)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Ras El Hanout'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Chermoula Spice Blend'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Baharat'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Caraway Seeds'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Nigella Seeds'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Dried Rose Petals'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Mace (Ground)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Urfa Biber (Isot Pepper)'
UNION ALL
SELECT id, 'jar',        40,   'g'  FROM inserted WHERE name = 'Aleppo Pepper'
UNION ALL
SELECT id, 'bag',        50,   'g'  FROM inserted WHERE name = 'Merguez Spice Mix'
UNION ALL
SELECT id, 'bottle',    250,   'ml' FROM inserted WHERE name = 'Carob Molasses'
UNION ALL
SELECT id, 'jar',       400,   'g'  FROM inserted WHERE name = 'Preserved Lemon'
UNION ALL
SELECT id, 'bag',       500,   'g'  FROM inserted WHERE name = 'Dried Chickpeas'
UNION ALL
SELECT id, 'can',       400,   'g'  FROM inserted WHERE name = 'Canned Chickpeas'
UNION ALL
SELECT id, 'box',       250,   'g'  FROM inserted WHERE name = 'Medjool Dates'
UNION ALL
SELECT id, 'bag',       100,   'g'  FROM inserted WHERE name = 'Barberry (Zereshk)'
;
