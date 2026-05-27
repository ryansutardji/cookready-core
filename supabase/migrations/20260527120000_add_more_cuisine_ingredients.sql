/*
  # Add ~130 Universal Cuisine Ingredients (Round 2)

  ## Summary
  Inserts ~130 universal ingredients (user_id = NULL) spanning 7 cuisines:
  Vietnam, Korea, Indonesia, Singapore, Malaysia, Taiwan, China (extra vegetables).

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
    -- Vietnam (20)
    ('Bean Sprouts',                          'Vegetable',    'g',   'bag'),
    ('Green Papaya',                          'Vegetable',    'g',   'count'),
    ('Jicama',                                'Vegetable',    'g',   'count'),
    ('Sawtooth Herb (Culantro)',              'Vegetable',    'g',   'bunch'),
    ('Vietnamese Mint (Rau Ram)',             'Vegetable',    'g',   'bunch'),
    ('Lá Lốt (Betel Leaf)',                  'Vegetable',    'g',   'bag'),
    ('Purple Yam (Ube)',                      'Vegetable',    'g',   'count'),
    ('Fresh Turmeric',                        'Vegetable',    'g',   'count'),
    ('Banana Leaves',                         'Pantry',       'g',   'pack'),
    ('Rice Paper (Bánh Tráng)',              'Pantry',       'g',   'pack'),
    ('Annatto Seeds',                         'Spice/Sauce',  'g',   'jar'),
    ('Mắm Tôm (Vietnamese Shrimp Paste)',    'Spice/Sauce',  'g',   'jar'),
    ('Dried Lotus Seeds',                     'Pantry',       'g',   'bag'),
    ('Calamansi',                             'Fruit',        'g',   'count'),
    ('Jackfruit (Ripe)',                      'Fruit',        'g',   'count'),
    ('Peanuts',                               'Pantry',       'g',   'bag'),
    ('Chinese Sausage (Lap Cheong)',          'Protein',      'g',   'pack'),
    ('Fermented Tofu (Chao)',                 'Pantry',       'g',   'jar'),
    ('Pandan Extract',                        'Baking',       'ml',  'bottle'),
    ('Mung Beans (Dried)',                    'Pantry',       'g',   'bag'),
    -- Korea (20)
    ('Korean Radish (Mu)',                    'Vegetable',    'g',   'count'),
    ('Minari (Korean Watercress)',            'Vegetable',    'g',   'bunch'),
    ('Gosari (Dried Fernbrake)',              'Vegetable',    'g',   'bag'),
    ('Doraji (Bellflower Root)',              'Vegetable',    'g',   'bag'),
    ('Ssuk (Korean Mugwort)',                 'Vegetable',    'g',   'bunch'),
    ('Soybean Sprouts',                       'Vegetable',    'g',   'bag'),
    ('Tteok (Korean Rice Cakes)',             'Pantry',       'g',   'bag'),
    ('Kimchi',                                'Pantry',       'g',   'jar'),
    ('Saeujeot (Salted Fermented Shrimp)',   'Spice/Sauce',  'g',   'jar'),
    ('Gim (Korean Dried Seaweed)',            'Pantry',       'g',   'pack'),
    ('Chunjang (Black Bean Paste)',           'Spice/Sauce',  'g',   'jar'),
    ('Makgeolli (Korean Rice Wine)',          'Pantry',       'ml',  'bottle'),
    ('Maesilcheong (Green Plum Syrup)',       'Spice/Sauce',  'g',   'jar'),
    ('Korean Fish Cake (Eomuk)',              'Pantry',       'g',   'bag'),
    ('Dried Anchovies (Myeolchi)',            'Pantry',       'g',   'bag'),
    ('Soju',                                  'Pantry',       'ml',  'bottle'),
    ('Korean Soup Soy Sauce (Ganjang)',       'Spice/Sauce',  'ml',  'bottle'),
    ('Perilla Seeds (Deulkkae)',              'Spice/Sauce',  'g',   'jar'),
    ('Nurungji (Scorched Rice)',              'Pantry',       'g',   'bag'),
    ('Korean Anchovy Broth Powder',          'Spice/Sauce',  'g',   'bag'),
    -- Indonesia (20)
    ('Kecap Manis (Sweet Soy Sauce)',         'Spice/Sauce',  'ml',  'bottle'),
    ('Terasi (Indonesian Shrimp Paste)',      'Spice/Sauce',  'g',   'block'),
    ('Kemiri (Candlenut)',                    'Pantry',       'g',   'bag'),
    ('Salam Leaf (Indonesian Bay Leaf)',      'Vegetable',    'g',   'bag'),
    ('Kluwek (Black Nut)',                    'Spice/Sauce',  'g',   'bag'),
    ('Bawang Goreng (Fried Shallots)',        'Pantry',       'g',   'bag'),
    ('Lemon Basil (Kemangi)',                 'Vegetable',    'g',   'bunch'),
    ('Bilimbi (Belimbing Wuluh)',             'Fruit',        'g',   'count'),
    ('Kencur (Kaempferia)',                   'Vegetable',    'g',   'count'),
    ('Petai (Stinky Beans)',                  'Vegetable',    'g',   'bag'),
    ('Melinjo Leaves',                        'Vegetable',    'g',   'bag'),
    ('Turmeric Leaves',                       'Vegetable',    'g',   'bag'),
    ('Coconut Cream',                         'Pantry',       'ml',  'can'),
    ('Long Pepper',                           'Spice/Sauce',  'g',   'jar'),
    ('Cassava',                               'Vegetable',    'g',   'count'),
    ('Jengkol (Dogfruit)',                    'Vegetable',    'g',   'bag'),
    ('Peanut Sauce (Bumbu Kacang)',           'Spice/Sauce',  'g',   'jar'),
    ('Coconut Sugar',                         'Baking',       'g',   'bag'),
    ('Galangal Paste',                        'Spice/Sauce',  'g',   'jar'),
    ('Rendang Paste',                         'Spice/Sauce',  'g',   'jar'),
    -- Singapore (20)
    ('Laksa Paste',                           'Spice/Sauce',  'g',   'jar'),
    ('Cincalok (Fermented Shrimp)',           'Spice/Sauce',  'g',   'jar'),
    ('Dried Lily Buds',                       'Vegetable',    'g',   'bag'),
    ('Preserved Radish (Chai Poh)',           'Pantry',       'g',   'bag'),
    ('Yu Choy (Chinese Flowering Cabbage)',   'Vegetable',    'g',   'bunch'),
    ('Pea Shoots',                            'Vegetable',    'g',   'bag'),
    ('Gai Choy (Chinese Mustard Greens)',     'Vegetable',    'g',   'bunch'),
    ('Beancurd Skin (Tofu Skin)',             'Pantry',       'g',   'bag'),
    ('Fried Tofu Puffs',                      'Pantry',       'g',   'bag'),
    ('Wonton Wrappers',                       'Pantry',       'g',   'pack'),
    ('Char Siu Sauce',                        'Spice/Sauce',  'g',   'jar'),
    ('XO Sauce',                              'Spice/Sauce',  'g',   'jar'),
    ('Plum Sauce (Chinese)',                  'Spice/Sauce',  'g',   'jar'),
    ('Fermented Bean Curd (White)',           'Pantry',       'g',   'jar'),
    ('Maltose',                               'Baking',       'g',   'jar'),
    ('Chinese Chives (Garlic Chives)',        'Vegetable',    'g',   'bunch'),
    ('Butterfly Pea Flower',                  'Vegetable',    'g',   'bag'),
    ('Nian Gao (Rice Cake)',                  'Pantry',       'g',   'pack'),
    ('Dumpling Wrappers',                     'Pantry',       'g',   'pack'),
    ('Chili Garlic Sauce',                    'Spice/Sauce',  'ml',  'bottle'),
    -- Malaysia (20)
    ('Belacan (Malaysian Shrimp Paste)',      'Spice/Sauce',  'g',   'block'),
    ('Torch Ginger Flower (Bunga Kantan)',    'Vegetable',    'g',   'count'),
    ('Asam Gelugur (Dried Tamarind Slice)',   'Spice/Sauce',  'g',   'bag'),
    ('Preserved Soy Bean (Tau Cheong)',       'Spice/Sauce',  'g',   'jar'),
    ('Dried Salted Fish (Ikan Bilis)',        'Pantry',       'g',   'bag'),
    ('Pucuk Ubi (Cassava Leaves)',            'Vegetable',    'g',   'bunch'),
    ('Young Coconut',                         'Fruit',        'g',   'count'),
    ('Jackfruit Seeds',                       'Pantry',       'g',   'bag'),
    ('Malaysian Curry Powder',               'Spice/Sauce',  'g',   'jar'),
    ('Pandan Paste',                          'Baking',       'g',   'jar'),
    ('Asam Boi (Sour Plum)',                  'Fruit',        'g',   'count'),
    ('Nutmeg Fruit',                          'Fruit',        'g',   'count'),
    ('Tapioca Pearls',                        'Pantry',       'g',   'bag'),
    ('Salted Duck Egg',                       'Protein',      'g',   'count'),
    ('Fermented Bean Paste (Taucu)',          'Spice/Sauce',  'g',   'jar'),
    ('Shrimp Floss',                          'Pantry',       'g',   'bag'),
    ('Lemongrass Paste',                      'Spice/Sauce',  'g',   'jar'),
    ('Coconut Jam (Kaya)',                    'Pantry',       'g',   'jar'),
    ('Dried Shrimp Sambal',                   'Spice/Sauce',  'g',   'jar'),
    ('Bamboo Shoot Curry Paste',              'Spice/Sauce',  'g',   'jar'),
    -- Taiwan (20)
    ('Century Egg (Pidan)',                   'Protein',      'g',   'count'),
    ('Taiwan Shacha Sauce',                   'Spice/Sauce',  'g',   'jar'),
    ('Red Yeast Rice (Hongqu)',               'Pantry',       'g',   'bag'),
    ('Dried Tofu (Dried Bean Curd)',          'Pantry',       'g',   'bag'),
    ('Bamboo Shoots (Fresh)',                 'Vegetable',    'g',   'count'),
    ('Aiyu Jelly',                            'Pantry',       'g',   'bag'),
    ('Dried Shiitake Mushroom',              'Vegetable',    'g',   'bag'),
    ('Dried Oysters',                         'Protein',      'g',   'bag'),
    ('Black Garlic',                          'Vegetable',    'g',   'head'),
    ('Dried Squid',                           'Pantry',       'g',   'bag'),
    ('Pork Floss',                            'Pantry',       'g',   'bag'),
    ('Grass Jelly (Xiancao)',                 'Pantry',       'g',   'can'),
    ('Dried Longan',                          'Pantry',       'g',   'bag'),
    ('Mochi Rice Flour (Shiratamako)',        'Baking',       'g',   'bag'),
    ('Pickled Mustard Greens (Suancai)',      'Pantry',       'g',   'jar'),
    ('Steamed Fish Soy Sauce',               'Spice/Sauce',  'ml',  'bottle'),
    ('Dried Persimmon',                       'Fruit',        'g',   'bag'),
    ('Soy Sauce Paste (Jiangye)',             'Spice/Sauce',  'g',   'jar'),
    ('Scallion Oil',                          'Oil',          'ml',  'bottle'),
    ('Taro Balls (Wu Yuan)',                  'Pantry',       'g',   'bag'),
    -- China Extra Vegetables (10)
    ('Straw Mushroom',                        'Vegetable',    'g',   'can'),
    ('Enoki Mushroom',                        'Vegetable',    'g',   'bag'),
    ('Oyster Mushroom',                       'Vegetable',    'g',   'bag'),
    ('Chinese Spinach (Amaranth Greens)',     'Vegetable',    'g',   'bunch'),
    ('Fuzzy Melon (Hairy Gourd)',             'Vegetable',    'g',   'count'),
    ('Water Caltrops (Ling Jiao)',            'Vegetable',    'g',   'bag'),
    ('Goji Berry Leaves',                     'Vegetable',    'g',   'bunch'),
    ('Toon Leaves (Xiangchun)',               'Vegetable',    'g',   'bunch'),
    ('Wild Rice Stems (Jiao Bai)',            'Vegetable',    'g',   'count'),
    ('Arrowhead Corm (Ci Gu)',               'Vegetable',    'g',   'count')
  ) AS v(name, category, base_unit, preferred_unit)
  WHERE NOT EXISTS (
    SELECT 1 FROM public.ingredients i
    WHERE i.name = v.name AND i.user_id IS NULL
  )
  RETURNING id, name
)
INSERT INTO public.unit_conversions (ingredient_id, input_unit, output_value, output_unit)
-- Vietnam
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Bean Sprouts'
UNION ALL
SELECT id, 'count',  400,  'g'   FROM inserted WHERE name = 'Green Papaya'
UNION ALL
SELECT id, 'count',  500,  'g'   FROM inserted WHERE name = 'Jicama'
UNION ALL
SELECT id, 'bunch',  20,   'g'   FROM inserted WHERE name = 'Sawtooth Herb (Culantro)'
UNION ALL
SELECT id, 'bunch',  20,   'g'   FROM inserted WHERE name = 'Vietnamese Mint (Rau Ram)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Lá Lốt (Betel Leaf)'
UNION ALL
SELECT id, 'count',  400,  'g'   FROM inserted WHERE name = 'Purple Yam (Ube)'
UNION ALL
SELECT id, 'count',  100,  'g'   FROM inserted WHERE name = 'Fresh Turmeric'
UNION ALL
SELECT id, 'pack',   200,  'g'   FROM inserted WHERE name = 'Banana Leaves'
UNION ALL
SELECT id, 'pack',   200,  'g'   FROM inserted WHERE name = 'Rice Paper (Bánh Tráng)'
UNION ALL
SELECT id, 'jar',    40,   'g'   FROM inserted WHERE name = 'Annatto Seeds'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Mắm Tôm (Vietnamese Shrimp Paste)'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Dried Lotus Seeds'
UNION ALL
SELECT id, 'count',  20,   'g'   FROM inserted WHERE name = 'Calamansi'
UNION ALL
SELECT id, 'count',  1500, 'g'   FROM inserted WHERE name = 'Jackfruit (Ripe)'
UNION ALL
SELECT id, 'bag',    150,  'g'   FROM inserted WHERE name = 'Peanuts'
UNION ALL
SELECT id, 'pack',   200,  'g'   FROM inserted WHERE name = 'Chinese Sausage (Lap Cheong)'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Fermented Tofu (Chao)'
UNION ALL
SELECT id, 'bottle', 60,   'ml'  FROM inserted WHERE name = 'Pandan Extract'
UNION ALL
SELECT id, 'bag',    500,  'g'   FROM inserted WHERE name = 'Mung Beans (Dried)'
-- Korea
UNION ALL
SELECT id, 'count',  800,  'g'   FROM inserted WHERE name = 'Korean Radish (Mu)'
UNION ALL
SELECT id, 'bunch',  150,  'g'   FROM inserted WHERE name = 'Minari (Korean Watercress)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Gosari (Dried Fernbrake)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Doraji (Bellflower Root)'
UNION ALL
SELECT id, 'bunch',  50,   'g'   FROM inserted WHERE name = 'Ssuk (Korean Mugwort)'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Soybean Sprouts'
UNION ALL
SELECT id, 'bag',    500,  'g'   FROM inserted WHERE name = 'Tteok (Korean Rice Cakes)'
UNION ALL
SELECT id, 'jar',    400,  'g'   FROM inserted WHERE name = 'Kimchi'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Saeujeot (Salted Fermented Shrimp)'
UNION ALL
SELECT id, 'pack',   25,   'g'   FROM inserted WHERE name = 'Gim (Korean Dried Seaweed)'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Chunjang (Black Bean Paste)'
UNION ALL
SELECT id, 'bottle', 750,  'ml'  FROM inserted WHERE name = 'Makgeolli (Korean Rice Wine)'
UNION ALL
SELECT id, 'jar',    500,  'g'   FROM inserted WHERE name = 'Maesilcheong (Green Plum Syrup)'
UNION ALL
SELECT id, 'bag',    250,  'g'   FROM inserted WHERE name = 'Korean Fish Cake (Eomuk)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Dried Anchovies (Myeolchi)'
UNION ALL
SELECT id, 'bottle', 375,  'ml'  FROM inserted WHERE name = 'Soju'
UNION ALL
SELECT id, 'bottle', 500,  'ml'  FROM inserted WHERE name = 'Korean Soup Soy Sauce (Ganjang)'
UNION ALL
SELECT id, 'jar',    40,   'g'   FROM inserted WHERE name = 'Perilla Seeds (Deulkkae)'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Nurungji (Scorched Rice)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Korean Anchovy Broth Powder'
-- Indonesia
UNION ALL
SELECT id, 'bottle', 250,  'ml'  FROM inserted WHERE name = 'Kecap Manis (Sweet Soy Sauce)'
UNION ALL
SELECT id, 'block',  50,   'g'   FROM inserted WHERE name = 'Terasi (Indonesian Shrimp Paste)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Kemiri (Candlenut)'
UNION ALL
SELECT id, 'bag',    10,   'g'   FROM inserted WHERE name = 'Salam Leaf (Indonesian Bay Leaf)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Kluwek (Black Nut)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Bawang Goreng (Fried Shallots)'
UNION ALL
SELECT id, 'bunch',  20,   'g'   FROM inserted WHERE name = 'Lemon Basil (Kemangi)'
UNION ALL
SELECT id, 'count',  5,    'g'   FROM inserted WHERE name = 'Bilimbi (Belimbing Wuluh)'
UNION ALL
SELECT id, 'count',  30,   'g'   FROM inserted WHERE name = 'Kencur (Kaempferia)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Petai (Stinky Beans)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Melinjo Leaves'
UNION ALL
SELECT id, 'bag',    20,   'g'   FROM inserted WHERE name = 'Turmeric Leaves'
UNION ALL
SELECT id, 'can',    400,  'ml'  FROM inserted WHERE name = 'Coconut Cream'
UNION ALL
SELECT id, 'jar',    40,   'g'   FROM inserted WHERE name = 'Long Pepper'
UNION ALL
SELECT id, 'count',  500,  'g'   FROM inserted WHERE name = 'Cassava'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Jengkol (Dogfruit)'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Peanut Sauce (Bumbu Kacang)'
UNION ALL
SELECT id, 'bag',    500,  'g'   FROM inserted WHERE name = 'Coconut Sugar'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Galangal Paste'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Rendang Paste'
-- Singapore
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Laksa Paste'
UNION ALL
SELECT id, 'jar',    100,  'g'   FROM inserted WHERE name = 'Cincalok (Fermented Shrimp)'
UNION ALL
SELECT id, 'bag',    30,   'g'   FROM inserted WHERE name = 'Dried Lily Buds'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Preserved Radish (Chai Poh)'
UNION ALL
SELECT id, 'bunch',  200,  'g'   FROM inserted WHERE name = 'Yu Choy (Chinese Flowering Cabbage)'
UNION ALL
SELECT id, 'bag',    150,  'g'   FROM inserted WHERE name = 'Pea Shoots'
UNION ALL
SELECT id, 'bunch',  250,  'g'   FROM inserted WHERE name = 'Gai Choy (Chinese Mustard Greens)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Beancurd Skin (Tofu Skin)'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Fried Tofu Puffs'
UNION ALL
SELECT id, 'pack',   300,  'g'   FROM inserted WHERE name = 'Wonton Wrappers'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Char Siu Sauce'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'XO Sauce'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Plum Sauce (Chinese)'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Fermented Bean Curd (White)'
UNION ALL
SELECT id, 'jar',    500,  'g'   FROM inserted WHERE name = 'Maltose'
UNION ALL
SELECT id, 'bunch',  100,  'g'   FROM inserted WHERE name = 'Chinese Chives (Garlic Chives)'
UNION ALL
SELECT id, 'bag',    10,   'g'   FROM inserted WHERE name = 'Butterfly Pea Flower'
UNION ALL
SELECT id, 'pack',   500,  'g'   FROM inserted WHERE name = 'Nian Gao (Rice Cake)'
UNION ALL
SELECT id, 'pack',   300,  'g'   FROM inserted WHERE name = 'Dumpling Wrappers'
UNION ALL
SELECT id, 'bottle', 250,  'ml'  FROM inserted WHERE name = 'Chili Garlic Sauce'
-- Malaysia
UNION ALL
SELECT id, 'block',  50,   'g'   FROM inserted WHERE name = 'Belacan (Malaysian Shrimp Paste)'
UNION ALL
SELECT id, 'count',  100,  'g'   FROM inserted WHERE name = 'Torch Ginger Flower (Bunga Kantan)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Asam Gelugur (Dried Tamarind Slice)'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Preserved Soy Bean (Tau Cheong)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Dried Salted Fish (Ikan Bilis)'
UNION ALL
SELECT id, 'bunch',  100,  'g'   FROM inserted WHERE name = 'Pucuk Ubi (Cassava Leaves)'
UNION ALL
SELECT id, 'count',  500,  'g'   FROM inserted WHERE name = 'Young Coconut'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Jackfruit Seeds'
UNION ALL
SELECT id, 'jar',    40,   'g'   FROM inserted WHERE name = 'Malaysian Curry Powder'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Pandan Paste'
UNION ALL
SELECT id, 'count',  10,   'g'   FROM inserted WHERE name = 'Asam Boi (Sour Plum)'
UNION ALL
SELECT id, 'count',  50,   'g'   FROM inserted WHERE name = 'Nutmeg Fruit'
UNION ALL
SELECT id, 'bag',    250,  'g'   FROM inserted WHERE name = 'Tapioca Pearls'
UNION ALL
SELECT id, 'count',  70,   'g'   FROM inserted WHERE name = 'Salted Duck Egg'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Fermented Bean Paste (Taucu)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Shrimp Floss'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Lemongrass Paste'
UNION ALL
SELECT id, 'jar',    250,  'g'   FROM inserted WHERE name = 'Coconut Jam (Kaya)'
UNION ALL
SELECT id, 'jar',    100,  'g'   FROM inserted WHERE name = 'Dried Shrimp Sambal'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Bamboo Shoot Curry Paste'
-- Taiwan
UNION ALL
SELECT id, 'count',  60,   'g'   FROM inserted WHERE name = 'Century Egg (Pidan)'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Taiwan Shacha Sauce'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Red Yeast Rice (Hongqu)'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Dried Tofu (Dried Bean Curd)'
UNION ALL
SELECT id, 'count',  500,  'g'   FROM inserted WHERE name = 'Bamboo Shoots (Fresh)'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Aiyu Jelly'
UNION ALL
SELECT id, 'bag',    50,   'g'   FROM inserted WHERE name = 'Dried Shiitake Mushroom'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Dried Oysters'
UNION ALL
SELECT id, 'head',   50,   'g'   FROM inserted WHERE name = 'Black Garlic'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Dried Squid'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Pork Floss'
UNION ALL
SELECT id, 'can',    500,  'g'   FROM inserted WHERE name = 'Grass Jelly (Xiancao)'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Dried Longan'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Mochi Rice Flour (Shiratamako)'
UNION ALL
SELECT id, 'jar',    300,  'g'   FROM inserted WHERE name = 'Pickled Mustard Greens (Suancai)'
UNION ALL
SELECT id, 'bottle', 250,  'ml'  FROM inserted WHERE name = 'Steamed Fish Soy Sauce'
UNION ALL
SELECT id, 'bag',    100,  'g'   FROM inserted WHERE name = 'Dried Persimmon'
UNION ALL
SELECT id, 'jar',    200,  'g'   FROM inserted WHERE name = 'Soy Sauce Paste (Jiangye)'
UNION ALL
SELECT id, 'bottle', 250,  'ml'  FROM inserted WHERE name = 'Scallion Oil'
UNION ALL
SELECT id, 'bag',    300,  'g'   FROM inserted WHERE name = 'Taro Balls (Wu Yuan)'
-- China Extra Vegetables
UNION ALL
SELECT id, 'can',    400,  'g'   FROM inserted WHERE name = 'Straw Mushroom'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Enoki Mushroom'
UNION ALL
SELECT id, 'bag',    150,  'g'   FROM inserted WHERE name = 'Oyster Mushroom'
UNION ALL
SELECT id, 'bunch',  200,  'g'   FROM inserted WHERE name = 'Chinese Spinach (Amaranth Greens)'
UNION ALL
SELECT id, 'count',  400,  'g'   FROM inserted WHERE name = 'Fuzzy Melon (Hairy Gourd)'
UNION ALL
SELECT id, 'bag',    200,  'g'   FROM inserted WHERE name = 'Water Caltrops (Ling Jiao)'
UNION ALL
SELECT id, 'bunch',  100,  'g'   FROM inserted WHERE name = 'Goji Berry Leaves'
UNION ALL
SELECT id, 'bunch',  50,   'g'   FROM inserted WHERE name = 'Toon Leaves (Xiangchun)'
UNION ALL
SELECT id, 'count',  200,  'g'   FROM inserted WHERE name = 'Wild Rice Stems (Jiao Bai)'
UNION ALL
SELECT id, 'count',  50,   'g'   FROM inserted WHERE name = 'Arrowhead Corm (Ci Gu)'
;
