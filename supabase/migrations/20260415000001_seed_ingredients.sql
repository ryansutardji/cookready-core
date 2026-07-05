/*
  # Seed universal ingredient catalog and unit conversions

  Populates the tables created by 20260415000000 with the ingredient data
  that existed in production but was never captured in a migration.

  ## Scope
  - 782 universal ingredients (user_id IS NULL) via INSERT...ON CONFLICT DO NOTHING
  - 5 global unit_conversions (ingredient_id IS NULL)
  - ~840 ingredient-specific unit_conversions via SELECT subqueries

  ## Excluded (managed by later migrations)
  - 25 bean/legume ingredients → added by 20260601000002
    (that migration uses INSERT...RETURNING without ON CONFLICT, so these names
    must NOT exist in the table when it runs)
  - 3 Japanese pantry ingredients → added by 20260608000000 with ON CONFLICT DO NOTHING

  ## Idempotency
  All INSERTs use ON CONFLICT DO NOTHING.  Unit conversion INSERTs for ingredients
  not yet in the table silently produce zero rows (subquery returns nothing).
*/


-- ── Ingredients ──────────────────────────────────────────────────────────────

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('2% Milk', 'Dairy', 'ml', 'carton'),
  ('A1 Steak Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Achiote Paste', 'Spice/Sauce', 'g', 'block'),
  ('Acini di Pepe', 'Grain', 'g', 'box'),
  ('Active Dry Yeast', 'Baking', 'g', 'pack'),
  ('Aiyu Jelly', 'Pantry', 'g', 'bag'),
  ('Ajwain (Carom Seeds)', 'Spice/Sauce', 'g', 'jar'),
  ('Aleppo Pepper', 'Spice/Sauce', 'g', 'jar'),
  ('All-Purpose Flour', 'Baking', 'g', 'bag'),
  ('Allspice (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Almond Extract', 'Baking', 'ml', 'bottle'),
  ('Almond Flour', 'Baking', 'g', 'bag'),
  ('Almond Milk', 'Dairy', 'ml', 'carton'),
  ('Almond Oil', 'Oil', 'ml', 'bottle'),
  ('Amaranth', 'Grain', 'g', 'bag'),
  ('Amchur (Dried Mango Powder)', 'Spice/Sauce', 'g', 'jar'),
  ('Anaheim Pepper', 'Vegetable', 'g', 'count'),
  ('Anchovy Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Angel Hair', 'Grain', 'g', 'box'),
  ('Anise Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Annatto Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Apricot', 'Fruit', 'g', 'count'),
  ('Arborio Rice', 'Grain', 'g', 'bag'),
  ('Argan Oil (Culinary)', 'Oil', 'ml', 'bottle'),
  ('Arrowhead Corm (Ci Gu)', 'Vegetable', 'g', 'count'),
  ('Artichoke', 'Vegetable', 'g', 'count'),
  ('Arugula', 'Vegetable', 'g', 'bag'),
  ('Asafoetida (Hing)', 'Spice/Sauce', 'g', 'jar'),
  ('Asam Boi (Sour Plum)', 'Fruit', 'g', 'count'),
  ('Asam Gelugur (Dried Tamarind Slice)', 'Spice/Sauce', 'g', 'bag'),
  ('Asian Pear', 'Fruit', 'g', 'count'),
  ('Asparagus', 'Vegetable', 'g', 'bunch'),
  ('Avocado (Haas)', 'Fruit', 'g', 'count'),
  ('Avocado Oil', 'Oil', 'ml', 'bottle'),
  ('Baby Back Ribs', 'Protein', 'g', 'lb'),
  ('Baby Bok Choy', 'Vegetable', 'g', 'head'),
  ('Bacon', 'Protein', 'g', 'lb'),
  ('Bacon Grease', 'Fat', 'g', 'jar'),
  ('Baharat', 'Spice/Sauce', 'g', 'jar'),
  ('Baking Powder', 'Baking', 'g', 'container'),
  ('Baking Soda', 'Baking', 'g', 'box'),
  ('Balsamic Glaze', 'Spice/Sauce', 'ml', 'bottle'),
  ('Balsamic Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Bamboo Shoot Curry Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Bamboo Shoots (Canned)', 'Vegetable', 'g', 'can'),
  ('Bamboo Shoots (Fresh)', 'Vegetable', 'g', 'count'),
  ('Banana', 'Fruit', 'g', 'count'),
  ('Banana Blossom', 'Vegetable', 'g', 'count'),
  ('Banana Leaves', 'Pantry', 'g', 'pack'),
  ('Barberry (Zereshk)', 'Fruit', 'g', 'bag')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Barley (Pearl)', 'Grain', 'g', 'bag'),
  ('Bartlett Pear', 'Fruit', 'g', 'count'),
  ('Basil Infused Oil', 'Oil', 'ml', 'bottle'),
  ('Basmati Rice', 'Grain', 'g', 'bag'),
  ('Bawang Goreng (Fried Shallots)', 'Pantry', 'g', 'bag'),
  ('BBQ Sauce (Carolina)', 'Spice/Sauce', 'ml', 'bottle'),
  ('BBQ Sauce (Sweet)', 'Spice/Sauce', 'ml', 'bottle'),
  ('Bean Sprouts', 'Vegetable', 'g', 'bag'),
  ('Beancurd Skin (Tofu Skin)', 'Pantry', 'g', 'bag'),
  ('Beef Base (Better Than Bouillon)', 'Spice/Sauce', 'g', 'jar'),
  ('Beef Brisket', 'Protein', 'g', 'lb'),
  ('Beef Short Ribs', 'Protein', 'g', 'lb'),
  ('Beef Stew Meat', 'Protein', 'g', 'lb'),
  ('Beef Tallow', 'Fat', 'g', 'tub'),
  ('Beefsteak Tomato', 'Vegetable', 'g', 'count'),
  ('Beets', 'Vegetable', 'g', 'count'),
  ('Belacan (Malaysian Shrimp Paste)', 'Spice/Sauce', 'g', 'block'),
  ('Bell Pepper (Green)', 'Vegetable', 'g', 'count'),
  ('Bell Pepper (Red)', 'Vegetable', 'g', 'count'),
  ('Bell Pepper (Yellow)', 'Vegetable', 'g', 'count'),
  ('Bilimbi (Belimbing Wuluh)', 'Fruit', 'g', 'count'),
  ('Bitter Melon (Karela)', 'Vegetable', 'g', 'count'),
  ('Bittersweet Chocolate Bar', 'Baking', 'g', 'count'),
  ('Black Bean Sauce', 'Spice/Sauce', 'g', 'jar'),
  ('Black Cardamom Pods', 'Spice/Sauce', 'g', 'jar'),
  ('Black Currant', 'Fruit', 'g', 'container'),
  ('Black Garlic', 'Vegetable', 'g', 'head'),
  ('Black Mustard Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Black Pepper (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Black Peppercorns', 'Spice/Sauce', 'g', 'jar'),
  ('Black Rice (Forbidden)', 'Grain', 'g', 'bag'),
  ('Blackberry', 'Fruit', 'g', 'container'),
  ('Blood Orange', 'Fruit', 'g', 'count'),
  ('Blue Cheese', 'Dairy', 'g', 'wedge'),
  ('Blueberry', 'Fruit', 'g', 'container'),
  ('Bok Choy', 'Vegetable', 'g', 'head'),
  ('Bonito Flakes (Katsuobushi)', 'Spice/Sauce', 'g', 'bag'),
  ('Bread Flour', 'Baking', 'g', 'bag'),
  ('Breadcrumbs (Panko)', 'Baking', 'g', 'bag'),
  ('Breakfast Sausage', 'Protein', 'g', 'lb'),
  ('Brie', 'Dairy', 'g', 'wheel'),
  ('Broccoli', 'Vegetable', 'g', 'head'),
  ('Broccolini', 'Vegetable', 'g', 'bunch'),
  ('Brussels Sprouts', 'Vegetable', 'g', 'bag'),
  ('Buckwheat Flour', 'Baking', 'g', 'bag'),
  ('Buckwheat Groats', 'Grain', 'g', 'bag'),
  ('Buffalo Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Bulgur Wheat', 'Grain', 'g', 'bag'),
  ('Burdock Root (Gobo)', 'Vegetable', 'g', 'count'),
  ('Burrata', 'Dairy', 'g', 'count')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Butterfly Pea Flower', 'Vegetable', 'g', 'bag'),
  ('Buttermilk', 'Dairy', 'ml', 'carton'),
  ('Butternut Squash', 'Vegetable', 'g', 'count'),
  ('Caesar Dressing', 'Spice/Sauce', 'ml', 'bottle'),
  ('Cake Flour', 'Baking', 'g', 'box'),
  ('Calamansi', 'Fruit', 'g', 'count'),
  ('Camembert', 'Dairy', 'g', 'wheel'),
  ('Canned Artichoke Hearts', 'Pantry', 'g', 'can'),
  ('Canned Chickpeas', 'Pantry', 'g', 'can'),
  ('Canned Tuna', 'Protein', 'g', 'lb'),
  ('Canned Whole Tomatoes', 'Pantry', 'g', 'can'),
  ('Canola Oil', 'Oil', 'ml', 'bottle'),
  ('Cantaloupe', 'Fruit', 'g', 'count'),
  ('Caperberries', 'Pantry', 'g', 'jar'),
  ('Capers', 'Spice/Sauce', 'g', 'jar'),
  ('Caraway Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Cardamom (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Cardamom Pods', 'Spice/Sauce', 'g', 'jar'),
  ('Carob Molasses', 'Spice/Sauce', 'ml', 'bottle'),
  ('Carrots', 'Vegetable', 'g', 'count'),
  ('Cashew Milk', 'Dairy', 'ml', 'carton'),
  ('Cashew Oil', 'Oil', 'ml', 'bottle'),
  ('Cassava', 'Vegetable', 'g', 'count'),
  ('Cauliflower', 'Vegetable', 'g', 'head'),
  ('Cayenne Pepper', 'Spice/Sauce', 'g', 'jar'),
  ('Celeriac (Celery Root)', 'Vegetable', 'g', 'count'),
  ('Celery', 'Vegetable', 'g', 'stalk'),
  ('Celery Salt', 'Spice/Sauce', 'g', 'jar'),
  ('Century Egg (Pidan)', 'Protein', 'g', 'count'),
  ('Chaat Masala', 'Spice/Sauce', 'g', 'jar'),
  ('Champagne Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Char Siu Sauce', 'Spice/Sauce', 'g', 'jar'),
  ('Chayote', 'Vegetable', 'g', 'count'),
  ('Cheddar (Mild)', 'Dairy', 'g', 'block'),
  ('Cheddar (Sharp)', 'Dairy', 'g', 'block'),
  ('Chermoula Spice Blend', 'Spice/Sauce', 'g', 'jar'),
  ('Cherry', 'Fruit', 'g', 'bag'),
  ('Cherry Tomato', 'Vegetable', 'g', 'pint'),
  ('Chestnuts', 'Pantry', 'g', 'bag'),
  ('Chicken Base (Better Than Bouillon)', 'Spice/Sauce', 'g', 'jar'),
  ('Chicken Breast', 'Protein', 'g', 'lb'),
  ('Chicken Drumsticks', 'Protein', 'g', 'lb'),
  ('Chicken Quarters', 'Protein', 'g', 'lb'),
  ('Chicken Thighs', 'Protein', 'g', 'lb'),
  ('Chicken Wings', 'Protein', 'g', 'lb'),
  ('Chili Garlic Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Chili Oil (Pure)', 'Oil', 'ml', 'bottle'),
  ('Chili Oil (with Flakes)', 'Oil', 'ml', 'jar'),
  ('Chili Powder (Standard)', 'Spice/Sauce', 'g', 'jar'),
  ('Chinese Broccoli (Gai Lan)', 'Vegetable', 'g', 'bunch')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Chinese Celery', 'Vegetable', 'g', 'bunch'),
  ('Chinese Chives (Garlic Chives)', 'Vegetable', 'g', 'bunch'),
  ('Chinese Five Spice', 'Spice/Sauce', 'g', 'jar'),
  ('Chinese Long Beans', 'Vegetable', 'g', 'bunch'),
  ('Chinese Sausage (Lap Cheong)', 'Protein', 'g', 'pack'),
  ('Chinese Sesame Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Chinese Spinach (Amaranth Greens)', 'Vegetable', 'g', 'bunch'),
  ('Chinkaing Black Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Chipotle in Adobo', 'Spice/Sauce', 'g', 'can'),
  ('Chives', 'Vegetable', 'g', 'bunch'),
  ('Cholula', 'Spice/Sauce', 'ml', 'bottle'),
  ('Chopped Walnuts', 'Baking', 'g', 'bag'),
  ('Chrysanthemum Greens', 'Vegetable', 'g', 'bag'),
  ('Chuck Roast', 'Protein', 'g', 'lb'),
  ('Chunjang (Black Bean Paste)', 'Spice/Sauce', 'g', 'jar'),
  ('Cincalok (Fermented Shrimp)', 'Spice/Sauce', 'g', 'jar'),
  ('Cinnamon (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Cinnamon Sticks', 'Spice/Sauce', 'g', 'jar'),
  ('Clams', 'Protein', 'g', 'lb'),
  ('Clementine', 'Fruit', 'g', 'count'),
  ('Cloves (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Coconut', 'Fruit', 'g', 'count'),
  ('Coconut Cream', 'Pantry', 'ml', 'can'),
  ('Coconut Flour', 'Baking', 'g', 'bag'),
  ('Coconut Jam (Kaya)', 'Pantry', 'g', 'jar'),
  ('Coconut Milk (Canned)', 'Spice/Sauce', 'ml', 'can'),
  ('Coconut Milk (Refrigerated)', 'Dairy', 'ml', 'carton'),
  ('Coconut Oil (Refined)', 'Oil', 'ml', 'jar'),
  ('Coconut Oil (Virgin)', 'Oil', 'ml', 'jar'),
  ('Coconut Sugar', 'Baking', 'g', 'bag'),
  ('Cod Fillet', 'Protein', 'g', 'lb'),
  ('Condensed Milk', 'Dairy', 'g', 'can'),
  ('Coriander (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Coriander Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Corn', 'Vegetable', 'g', 'count'),
  ('Corn Oil', 'Oil', 'ml', 'bottle'),
  ('Corn Syrup', 'Baking', 'ml', 'bottle'),
  ('Cornichons', 'Pantry', 'g', 'jar'),
  ('Cornish Hen', 'Protein', 'g', 'lb'),
  ('Cornmeal', 'Grain', 'g', 'bag'),
  ('Cornstarch', 'Baking', 'g', 'container'),
  ('Cottage Cheese', 'Dairy', 'g', 'tub'),
  ('Cottonseed Oil', 'Oil', 'ml', 'bottle'),
  ('Couscous', 'Grain', 'g', 'box'),
  ('Crab Meat', 'Protein', 'g', 'lb'),
  ('Cranberry', 'Fruit', 'g', 'bag'),
  ('Cream Cheese', 'Dairy', 'g', 'block'),
  ('Cream of Tartar', 'Baking', 'g', 'jar'),
  ('Crème Fraîche', 'Dairy', 'g', 'tub'),
  ('Cremini Mushroom', 'Vegetable', 'g', 'container')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Crushed Red Pepper Flakes', 'Spice/Sauce', 'g', 'jar'),
  ('Cucumber (English)', 'Vegetable', 'g', 'count'),
  ('Cucumber (Persian)', 'Vegetable', 'g', 'count'),
  ('Cumin (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Cumin Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Curry Paste (Green)', 'Spice/Sauce', 'g', 'jar'),
  ('Curry Paste (Red)', 'Spice/Sauce', 'g', 'jar'),
  ('Curry Powder (Mild)', 'Spice/Sauce', 'g', 'jar'),
  ('Daikon Radish', 'Vegetable', 'g', 'count'),
  ('Dandelion Greens', 'Vegetable', 'g', 'bunch'),
  ('Dangmyeon (Sweet Potato Starch)', 'Grain', 'g', 'bag'),
  ('Dark Brown Sugar', 'Baking', 'g', 'box'),
  ('Dark Chocolate Chips', 'Baking', 'g', 'bag'),
  ('Dashi Powder', 'Spice/Sauce', 'g', 'bag'),
  ('Dates', 'Fruit', 'g', 'box'),
  ('Dijon Mustard', 'Spice/Sauce', 'ml', 'jar'),
  ('Doenjang', 'Spice/Sauce', 'g', 'tub'),
  ('Doraji (Bellflower Root)', 'Vegetable', 'g', 'bag'),
  ('Doubanjiang', 'Spice/Sauce', 'g', 'jar'),
  ('Dragon Fruit', 'Fruit', 'g', 'count'),
  ('Dried Ancho Chile', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Anchovies (Myeolchi)', 'Pantry', 'g', 'bag'),
  ('Dried Apricots', 'Fruit', 'g', 'bag'),
  ('Dried Basil', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Bay Leaves', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Cascabel Chile', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Chickpeas', 'Pantry', 'g', 'bag'),
  ('Dried Chile de Árbol', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Currants', 'Fruit', 'g', 'bag'),
  ('Dried Dill Weed', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Guajillo Chile', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Kashmiri Chili', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Lavender', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Lily Buds', 'Vegetable', 'g', 'bag'),
  ('Dried Longan', 'Pantry', 'g', 'bag'),
  ('Dried Lotus Seeds', 'Pantry', 'g', 'bag'),
  ('Dried Marjoram', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Mint', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Morita Chile', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Ñora Pepper', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Oregano', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Oysters', 'Protein', 'g', 'bag'),
  ('Dried Parsley', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Pasilla Chile', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Persimmon', 'Fruit', 'g', 'bag'),
  ('Dried Red Chilies (Chinese)', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Rose Petals', 'Spice/Sauce', 'g', 'bag'),
  ('Dried Rosemary', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Sage', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Salted Fish (Ikan Bilis)', 'Pantry', 'g', 'bag')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Dried Shiitake Mushroom', 'Vegetable', 'g', 'bag'),
  ('Dried Shrimp', 'Pantry', 'g', 'bag'),
  ('Dried Shrimp Sambal', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Squid', 'Pantry', 'g', 'bag'),
  ('Dried Tarragon', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Thyme', 'Spice/Sauce', 'g', 'jar'),
  ('Dried Tofu (Dried Bean Curd)', 'Pantry', 'g', 'bag'),
  ('Dried Wood Ear Mushroom', 'Vegetable', 'g', 'bag'),
  ('Drumstick (Moringa Pods)', 'Vegetable', 'g', 'count'),
  ('Duck Breast', 'Protein', 'g', 'lb'),
  ('Duck Fat', 'Fat', 'g', 'jar'),
  ('Dumpling Wrappers', 'Pantry', 'g', 'pack'),
  ('Edamame', 'Vegetable', 'g', 'bag'),
  ('Egg (Brown)', 'Protein', 'dozen', 'count'),
  ('Egg (White)', 'Protein', 'dozen', 'count'),
  ('Eggplant', 'Vegetable', 'g', 'count'),
  ('Endive', 'Vegetable', 'g', 'head'),
  ('Enoki Mushroom', 'Vegetable', 'g', 'bag'),
  ('Evaporated Milk', 'Dairy', 'ml', 'can'),
  ('Everything Bagel Seasoning', 'Spice/Sauce', 'g', 'jar'),
  ('Extra Virgin Olive Oil', 'Oil', 'ml', 'bottle'),
  ('Farfalle (Bow Tie)', 'Grain', 'g', 'box'),
  ('Farro', 'Grain', 'g', 'bag'),
  ('Fennel Bulb', 'Vegetable', 'g', 'count'),
  ('Fennel Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Fenugreek Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Fermented Bean Curd (White)', 'Pantry', 'g', 'jar'),
  ('Fermented Bean Paste (Taucu)', 'Spice/Sauce', 'g', 'jar'),
  ('Fermented Black Beans', 'Pantry', 'g', 'bag'),
  ('Fermented Tofu (Chao)', 'Pantry', 'g', 'jar'),
  ('Feta', 'Dairy', 'g', 'container'),
  ('Fettuccine', 'Grain', 'g', 'box'),
  ('Fig', 'Fruit', 'g', 'container'),
  ('Filet Mignon', 'Protein', 'g', 'lb'),
  ('Fish Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Flank Steak', 'Protein', 'g', 'lb'),
  ('Flaxseed Oil', 'Oil', 'ml', 'bottle'),
  ('Frank''s RedHot', 'Spice/Sauce', 'ml', 'bottle'),
  ('Freekeh', 'Grain', 'g', 'bag'),
  ('Fresh Basil', 'Vegetable', 'g', 'bunch'),
  ('Fresh Chervil', 'Vegetable', 'g', 'bunch'),
  ('Fresh Cilantro', 'Vegetable', 'g', 'bunch'),
  ('Fresh Curry Leaves', 'Vegetable', 'g', 'bag'),
  ('Fresh Dill', 'Vegetable', 'g', 'bunch'),
  ('Fresh Epazote', 'Vegetable', 'g', 'bunch'),
  ('Fresh Fenugreek Leaves (Methi)', 'Vegetable', 'g', 'bunch'),
  ('Fresh Flat-Leaf Parsley', 'Vegetable', 'g', 'bunch'),
  ('Fresh Marjoram', 'Vegetable', 'g', 'bunch'),
  ('Fresh Mint', 'Vegetable', 'g', 'bunch'),
  ('Fresh Oregano', 'Vegetable', 'g', 'bunch')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Fresh Rosemary', 'Vegetable', 'g', 'bunch'),
  ('Fresh Sage', 'Vegetable', 'g', 'bunch'),
  ('Fresh Tarragon', 'Vegetable', 'g', 'bunch'),
  ('Fresh Turmeric', 'Vegetable', 'g', 'count'),
  ('Fried Tofu Puffs', 'Pantry', 'g', 'bag'),
  ('Fuji Apple', 'Fruit', 'g', 'count'),
  ('Fusilli', 'Grain', 'g', 'box'),
  ('Fuzzy Melon (Hairy Gourd)', 'Vegetable', 'g', 'count'),
  ('Gai Choy (Chinese Mustard Greens)', 'Vegetable', 'g', 'bunch'),
  ('Gala Apple', 'Fruit', 'g', 'count'),
  ('Galangal', 'Vegetable', 'g', 'count'),
  ('Galangal Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Galangal Powder', 'Spice/Sauce', 'g', 'jar'),
  ('Garam Masala', 'Spice/Sauce', 'g', 'jar'),
  ('Garlic', 'Vegetable', 'count', 'clove'),
  ('Garlic Oil', 'Oil', 'ml', 'bottle'),
  ('Garlic Powder', 'Spice/Sauce', 'g', 'jar'),
  ('Ghee (Clarified Butter)', 'Fat', 'g', 'jar'),
  ('Gim (Korean Dried Seaweed)', 'Pantry', 'g', 'pack'),
  ('Ginger', 'Vegetable', 'g', 'count'),
  ('Ginger (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Glass Noodles (Mung Bean)', 'Grain', 'g', 'bag'),
  ('Glutinous Rice Flour', 'Baking', 'g', 'bag'),
  ('Goat Cheese (Chèvre)', 'Dairy', 'g', 'oz'),
  ('Gochugaru (Korean Chili Flakes)', 'Spice/Sauce', 'g', 'bag'),
  ('Gochujang', 'Spice/Sauce', 'g', 'tub'),
  ('Goji Berries', 'Fruit', 'g', 'bag'),
  ('Goji Berry Leaves', 'Vegetable', 'g', 'bunch'),
  ('Gosari (Dried Fernbrake)', 'Vegetable', 'g', 'bag'),
  ('Gouda', 'Dairy', 'g', 'wheel'),
  ('Graham Cracker Crumbs', 'Baking', 'g', 'box'),
  ('Granny Smith Apple', 'Fruit', 'g', 'count'),
  ('Granulated Sugar', 'Baking', 'g', 'bag'),
  ('Grape Leaves (Preserved)', 'Pantry', 'g', 'jar'),
  ('Grapefruit', 'Fruit', 'g', 'count'),
  ('Grapeseed Oil', 'Oil', 'ml', 'bottle'),
  ('Grass Jelly (Xiancao)', 'Pantry', 'g', 'can'),
  ('Greek Yogurt (Plain)', 'Dairy', 'g', 'tub'),
  ('Greek Yogurt (Vanilla)', 'Dairy', 'g', 'tub'),
  ('Green Beans', 'Vegetable', 'g', 'bag'),
  ('Green Cabbage', 'Vegetable', 'g', 'head'),
  ('Green Grapes', 'Fruit', 'g', 'bag'),
  ('Green Olives', 'Pantry', 'g', 'jar'),
  ('Green Onions', 'Vegetable', 'count', 'bunch'),
  ('Green Papaya', 'Vegetable', 'g', 'count'),
  ('Ground Beef', 'Protein', 'g', 'lb'),
  ('Ground Lamb', 'Protein', 'g', 'lb'),
  ('Ground Pork', 'Protein', 'g', 'lb'),
  ('Ground Turkey', 'Protein', 'g', 'lb'),
  ('Gruyère', 'Dairy', 'g', 'block')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Guava', 'Fruit', 'g', 'count'),
  ('Half and Half', 'Dairy', 'ml', 'carton'),
  ('Halibut', 'Protein', 'g', 'lb'),
  ('Ham Steak', 'Protein', 'g', 'lb'),
  ('Haricots Verts', 'Vegetable', 'g', 'bag'),
  ('Harissa', 'Spice/Sauce', 'g', 'jar'),
  ('Hazelnut Oil', 'Oil', 'ml', 'bottle'),
  ('Heavy Whipping Cream', 'Dairy', 'ml', 'carton'),
  ('Heirloom Tomato', 'Vegetable', 'g', 'count'),
  ('Hemp Seed Oil', 'Oil', 'ml', 'bottle'),
  ('Herbes de Provence', 'Spice/Sauce', 'g', 'jar'),
  ('Hoisin Sauce', 'Spice/Sauce', 'g', 'bottle'),
  ('Hominy (Dried)', 'Grain', 'g', 'bag'),
  ('Honey', 'Baking', 'g', 'jar'),
  ('Honeycrisp Apple', 'Fruit', 'g', 'count'),
  ('Honeydew', 'Fruit', 'g', 'count'),
  ('Horta (Wild Chicory Greens)', 'Vegetable', 'g', 'bunch'),
  ('HP Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Indian Eggplant (Brinjal)', 'Vegetable', 'g', 'count'),
  ('Indian Gooseberry (Amla)', 'Fruit', 'g', 'bag'),
  ('Instant Yeast', 'Baking', 'g', 'jar'),
  ('Israeli Couscous', 'Grain', 'g', 'box'),
  ('Italian Dressing', 'Spice/Sauce', 'ml', 'bottle'),
  ('Italian Sausage', 'Protein', 'g', 'lb'),
  ('Italian Seasoning', 'Spice/Sauce', 'g', 'jar'),
  ('Jackfruit (Green, Canned)', 'Pantry', 'g', 'can'),
  ('Jackfruit (Ripe)', 'Fruit', 'g', 'count'),
  ('Jackfruit Seeds', 'Pantry', 'g', 'bag'),
  ('Jalapeño', 'Vegetable', 'g', 'count'),
  ('Japanese Eggplant', 'Vegetable', 'g', 'count'),
  ('Jasmine Rice', 'Grain', 'g', 'bag'),
  ('Jengkol (Dogfruit)', 'Vegetable', 'g', 'bag'),
  ('Jicama', 'Vegetable', 'g', 'count'),
  ('Jujube (Red Dates)', 'Fruit', 'g', 'bag'),
  ('Kabocha Squash', 'Vegetable', 'g', 'count'),
  ('Kaffir Lime Leaves (Makrut)', 'Vegetable', 'g', 'bag'),
  ('Kalamata Olives', 'Pantry', 'g', 'jar'),
  ('Kale', 'Vegetable', 'g', 'bunch'),
  ('Kamut', 'Grain', 'g', 'bag'),
  ('Kashmiri Chili Powder', 'Spice/Sauce', 'g', 'jar'),
  ('Kasuri Methi (Dried Fenugreek Leaves)', 'Spice/Sauce', 'g', 'jar'),
  ('Kecap Manis (Sweet Soy Sauce)', 'Spice/Sauce', 'ml', 'bottle'),
  ('Kefir', 'Dairy', 'ml', 'bottle'),
  ('Kemiri (Candlenut)', 'Pantry', 'g', 'bag'),
  ('Kencur (Kaempferia)', 'Vegetable', 'g', 'count'),
  ('Ketchup', 'Spice/Sauce', 'ml', 'bottle'),
  ('Kewpie Mayo', 'Spice/Sauce', 'g', 'bottle'),
  ('Kimchi', 'Pantry', 'g', 'jar'),
  ('King Oyster Mushroom', 'Vegetable', 'g', 'bag'),
  ('Kiwi', 'Fruit', 'g', 'count')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Kluwek (Black Nut)', 'Spice/Sauce', 'g', 'bag'),
  ('Kohlrabi', 'Vegetable', 'g', 'count'),
  ('Kombu', 'Pantry', 'g', 'bag'),
  ('Korean Anchovy Broth Powder', 'Spice/Sauce', 'g', 'bag'),
  ('Korean Fish Cake (Eomuk)', 'Pantry', 'g', 'bag'),
  ('Korean Radish (Mu)', 'Vegetable', 'g', 'count'),
  ('Korean Soup Soy Sauce (Ganjang)', 'Spice/Sauce', 'ml', 'bottle'),
  ('Kosher Salt', 'Spice/Sauce', 'g', 'box'),
  ('Krachai (Fingerroot)', 'Vegetable', 'g', 'count'),
  ('Kumquat', 'Fruit', 'g', 'bag'),
  ('Lá Lốt (Betel Leaf)', 'Vegetable', 'g', 'bag'),
  ('Labneh', 'Dairy', 'g', 'tub'),
  ('Laksa Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Lamb Chops', 'Protein', 'g', 'lb'),
  ('Lamb Shank', 'Protein', 'g', 'lb'),
  ('Lao Gan Ma (Chili Crisp)', 'Spice/Sauce', 'g', 'jar'),
  ('Lard', 'Fat', 'g', 'block'),
  ('Lasagna Sheets', 'Grain', 'g', 'box'),
  ('Leeks', 'Vegetable', 'g', 'stalk'),
  ('Lemon', 'Fruit', 'g', 'count'),
  ('Lemon Basil (Kemangi)', 'Vegetable', 'g', 'bunch'),
  ('Lemon Infused Oil', 'Oil', 'ml', 'bottle'),
  ('Lemon Pepper', 'Spice/Sauce', 'g', 'jar'),
  ('Lemongrass', 'Vegetable', 'g', 'stalk'),
  ('Lemongrass Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Light Brown Sugar', 'Baking', 'g', 'box'),
  ('Light Olive Oil', 'Oil', 'ml', 'bottle'),
  ('Lime', 'Fruit', 'g', 'count'),
  ('Linguine', 'Grain', 'g', 'box'),
  ('Liquid Aminos', 'Spice/Sauce', 'ml', 'bottle'),
  ('Liquid Smoke', 'Spice/Sauce', 'ml', 'bottle'),
  ('Lo Mein Noodles', 'Grain', 'g', 'pack'),
  ('Lobster Tail', 'Protein', 'g', 'lb'),
  ('Long Pepper', 'Spice/Sauce', 'g', 'jar'),
  ('Longan', 'Fruit', 'g', 'bag'),
  ('Loquat (Níspero)', 'Fruit', 'g', 'count'),
  ('Lotus Root', 'Vegetable', 'g', 'count'),
  ('Lychee', 'Fruit', 'g', 'bag'),
  ('Macadamia Nut Oil', 'Oil', 'ml', 'bottle'),
  ('Macaroni (Elbow)', 'Grain', 'g', 'box'),
  ('Mace (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Maesilcheong (Green Plum Syrup)', 'Spice/Sauce', 'g', 'jar'),
  ('Mahlab (Mahleb)', 'Spice/Sauce', 'g', 'jar'),
  ('Makgeolli (Korean Rice Wine)', 'Pantry', 'ml', 'bottle'),
  ('Makrut Lime', 'Fruit', 'g', 'count'),
  ('Malaysian Curry Powder', 'Spice/Sauce', 'g', 'jar'),
  ('Maltose', 'Baking', 'g', 'jar'),
  ('Mắm Tôm (Vietnamese Shrimp Paste)', 'Spice/Sauce', 'g', 'jar'),
  ('Mamey Sapote', 'Fruit', 'g', 'count'),
  ('Manchego', 'Dairy', 'g', 'wedge')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Mandarin Orange', 'Fruit', 'g', 'count'),
  ('Mango (Ataulfo)', 'Fruit', 'g', 'count'),
  ('Mango (Kent)', 'Fruit', 'g', 'count'),
  ('Mango Pickle (Achaar)', 'Pantry', 'g', 'jar'),
  ('Mangosteen', 'Fruit', 'g', 'count'),
  ('Maple Syrup', 'Baking', 'ml', 'bottle'),
  ('Margarine', 'Dairy', 'g', 'tub'),
  ('Marinara Sauce', 'Spice/Sauce', 'g', 'jar'),
  ('Mascarpone', 'Dairy', 'g', 'tub'),
  ('Mastic (Mastiha)', 'Spice/Sauce', 'g', 'jar'),
  ('Mayonnaise', 'Spice/Sauce', 'ml', 'jar'),
  ('Medium Grain Brown Rice', 'Grain', 'g', 'bag'),
  ('Medjool Dates', 'Fruit', 'g', 'box'),
  ('Melinjo Leaves', 'Vegetable', 'g', 'bag'),
  ('Merguez Spice Mix', 'Spice/Sauce', 'g', 'bag'),
  ('Mexican Oregano (Dried)', 'Spice/Sauce', 'g', 'jar'),
  ('Millet', 'Grain', 'g', 'bag'),
  ('Minari (Korean Watercress)', 'Vegetable', 'g', 'bunch'),
  ('Mirin', 'Spice/Sauce', 'ml', 'bottle'),
  ('Mizuna', 'Vegetable', 'g', 'bag'),
  ('Mochi Rice Flour (Shiratamako)', 'Baking', 'g', 'bag'),
  ('Molasses', 'Baking', 'g', 'jar'),
  ('Monterey Jack', 'Dairy', 'g', 'block'),
  ('Morning Glory (Water Spinach)', 'Vegetable', 'g', 'bag'),
  ('Mozzarella (Fresh)', 'Dairy', 'g', 'count'),
  ('Mozzarella (Shredded)', 'Dairy', 'g', 'bag'),
  ('Mulberry', 'Fruit', 'g', 'container'),
  ('Mussels', 'Protein', 'g', 'lb'),
  ('Mung Beans (Dried)', 'Pantry', 'g', 'bag'),
  ('Mustard Oil', 'Oil', 'ml', 'bottle'),
  ('Mustard Powder', 'Spice/Sauce', 'g', 'jar'),
  ('Mustard Seeds (Yellow)', 'Spice/Sauce', 'g', 'jar'),
  ('Nam Prik Pao (Roasted Chili Paste)', 'Spice/Sauce', 'g', 'jar'),
  ('Napa Cabbage', 'Vegetable', 'g', 'head'),
  ('Navel Orange', 'Fruit', 'g', 'count'),
  ('Nectarine', 'Fruit', 'g', 'count'),
  ('New York Strip', 'Protein', 'g', 'lb'),
  ('Nian Gao (Rice Cake)', 'Pantry', 'g', 'pack'),
  ('Nigella Seeds', 'Spice/Sauce', 'g', 'jar'),
  ('Non-Fat Milk', 'Dairy', 'ml', 'carton'),
  ('Nopales (Cactus Paddles)', 'Vegetable', 'g', 'count'),
  ('Nori Sheets', 'Pantry', 'g', 'pack'),
  ('Nurungji (Scorched Rice)', 'Pantry', 'g', 'bag'),
  ('Nutmeg (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Nutmeg Fruit', 'Fruit', 'g', 'count'),
  ('Oat Flour', 'Baking', 'g', 'bag'),
  ('Oat Milk', 'Dairy', 'ml', 'carton'),
  ('Okra', 'Vegetable', 'g', 'bag'),
  ('Old Bay Seasoning', 'Spice/Sauce', 'g', 'container'),
  ('Olive Pomace Oil', 'Oil', 'ml', 'bottle'),
  ('Onion Powder', 'Spice/Sauce', 'g', 'jar')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Orange Blossom Water', 'Spice/Sauce', 'ml', 'bottle'),
  ('Orzo', 'Grain', 'g', 'box'),
  ('Oyster Mushroom', 'Vegetable', 'g', 'bag'),
  ('Oyster Sauce', 'Spice/Sauce', 'g', 'bottle'),
  ('Padrón Peppers', 'Vegetable', 'g', 'bag'),
  ('Palm Oil', 'Oil', 'ml', 'bottle'),
  ('Palm Sugar', 'Pantry', 'g', 'bag'),
  ('Panch Phoron', 'Spice/Sauce', 'g', 'jar'),
  ('Pandan Extract', 'Baking', 'ml', 'bottle'),
  ('Pandan Leaves', 'Vegetable', 'g', 'bag'),
  ('Pandan Paste', 'Baking', 'g', 'jar'),
  ('Papaya', 'Fruit', 'g', 'count'),
  ('Paprika', 'Spice/Sauce', 'g', 'jar'),
  ('Parmesan', 'Dairy', 'g', 'wedge'),
  ('Parsnips', 'Vegetable', 'g', 'count'),
  ('Passion Fruit', 'Fruit', 'g', 'count'),
  ('Pea Shoots', 'Vegetable', 'g', 'bag'),
  ('Peanut Oil', 'Oil', 'ml', 'bottle'),
  ('Peanut Sauce (Bumbu Kacang)', 'Spice/Sauce', 'g', 'jar'),
  ('Peanuts', 'Pantry', 'g', 'bag'),
  ('Pecan Oil', 'Oil', 'ml', 'bottle'),
  ('Pecans', 'Baking', 'g', 'bag'),
  ('Pecorino Romano', 'Dairy', 'g', 'wedge'),
  ('Penne', 'Grain', 'g', 'box'),
  ('Pepper Jack', 'Dairy', 'g', 'block'),
  ('Perilla Oil', 'Oil', 'ml', 'bottle'),
  ('Perilla Seeds (Deulkkae)', 'Spice/Sauce', 'g', 'jar'),
  ('Persimmon (Fuyu)', 'Fruit', 'g', 'count'),
  ('Pesto', 'Spice/Sauce', 'g', 'jar'),
  ('Petai (Stinky Beans)', 'Vegetable', 'g', 'bag'),
  ('Phyllo Dough', 'Baking', 'g', 'box'),
  ('Pickled Mustard Greens (Suancai)', 'Pantry', 'g', 'jar'),
  ('Pie Crust', 'Baking', 'g', 'box'),
  ('Piloncillo', 'Baking', 'g', 'count'),
  ('Pimentón (Hot Smoked)', 'Spice/Sauce', 'g', 'jar'),
  ('Pine Nut Oil', 'Oil', 'ml', 'bottle'),
  ('Pine Nuts', 'Pantry', 'g', 'bag'),
  ('Pineapple', 'Fruit', 'g', 'count'),
  ('Pink Peppercorns', 'Spice/Sauce', 'g', 'jar'),
  ('Piquillo Peppers (Roasted)', 'Pantry', 'g', 'can'),
  ('Pistachio Nuts', 'Pantry', 'g', 'bag'),
  ('Pistachio Oil', 'Oil', 'ml', 'bottle'),
  ('Plantain', 'Fruit', 'g', 'count'),
  ('Plum', 'Fruit', 'g', 'count'),
  ('Plum Sauce (Chinese)', 'Spice/Sauce', 'g', 'jar'),
  ('Poblano Pepper', 'Vegetable', 'g', 'count'),
  ('Polenta', 'Grain', 'g', 'bag'),
  ('Pomegranate', 'Fruit', 'g', 'count'),
  ('Pomegranate Molasses', 'Spice/Sauce', 'ml', 'bottle'),
  ('Pomelo', 'Fruit', 'g', 'count')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Ponzu Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Pork Belly', 'Protein', 'g', 'lb'),
  ('Pork Chops', 'Protein', 'g', 'lb'),
  ('Pork Floss', 'Pantry', 'g', 'bag'),
  ('Pork Shoulder', 'Protein', 'g', 'lb'),
  ('Pork Tenderloin', 'Protein', 'g', 'lb'),
  ('Potato Starch', 'Baking', 'g', 'bag'),
  ('Powdered Sugar', 'Baking', 'g', 'bag'),
  ('Preserved Lemon', 'Pantry', 'g', 'jar'),
  ('Preserved Mustard Greens (Zha Cai)', 'Pantry', 'g', 'can'),
  ('Preserved Radish (Chai Poh)', 'Pantry', 'g', 'bag'),
  ('Preserved Soy Bean (Tau Cheong)', 'Spice/Sauce', 'g', 'jar'),
  ('Provolone', 'Dairy', 'g', 'pack'),
  ('Pucuk Ubi (Cassava Leaves)', 'Vegetable', 'g', 'bunch'),
  ('Puff Pastry', 'Baking', 'g', 'box'),
  ('Pumpkin Puree', 'Baking', 'g', 'can'),
  ('Pumpkin Seed Oil', 'Oil', 'ml', 'bottle'),
  ('Pumpkin Seeds', 'Baking', 'g', 'bag'),
  ('Purple Yam (Ube)', 'Vegetable', 'g', 'count'),
  ('Quail Eggs', 'Dairy', 'count', 'carton'),
  ('Quatre Épices', 'Spice/Sauce', 'g', 'jar'),
  ('Quince', 'Fruit', 'g', 'count'),
  ('Quince Paste (Membrillo)', 'Pantry', 'g', 'block'),
  ('Quinoa (Red)', 'Grain', 'g', 'bag'),
  ('Quinoa (White)', 'Grain', 'g', 'bag'),
  ('Radicchio', 'Vegetable', 'g', 'head'),
  ('Raisins', 'Fruit', 'g', 'box'),
  ('Rambutan', 'Fruit', 'g', 'bag'),
  ('Ramen Noodles (Dried)', 'Grain', 'g', 'pack'),
  ('Ranch Dressing', 'Spice/Sauce', 'ml', 'bottle'),
  ('Ras El Hanout', 'Spice/Sauce', 'g', 'jar'),
  ('Raspberry', 'Fruit', 'g', 'container'),
  ('Raw Almonds', 'Pantry', 'g', 'bag'),
  ('Raw Hazelnuts', 'Pantry', 'g', 'bag'),
  ('Raw Walnuts', 'Pantry', 'g', 'bag'),
  ('Red Cabbage', 'Vegetable', 'g', 'head'),
  ('Red Grapes', 'Fruit', 'g', 'bag'),
  ('Red Miso Paste', 'Spice/Sauce', 'g', 'tub'),
  ('Red Onion', 'Vegetable', 'g', 'count'),
  ('Red Palm Oil', 'Oil', 'ml', 'bottle'),
  ('Red Potato', 'Vegetable', 'g', 'count'),
  ('Red Radish', 'Vegetable', 'g', 'bunch'),
  ('Red Wine Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Red Yeast Rice (Hongqu)', 'Pantry', 'g', 'bag'),
  ('Rendang Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Rhubarb', 'Vegetable', 'g', 'stalk'),
  ('Ribeye Steak', 'Protein', 'g', 'lb'),
  ('Rice Bran Oil', 'Oil', 'ml', 'bottle'),
  ('Rice Flour', 'Baking', 'g', 'bag'),
  ('Rice Paper (Bánh Tráng)', 'Pantry', 'g', 'pack')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Rice Vermicelli', 'Grain', 'g', 'pack'),
  ('Rice Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Ricotta', 'Dairy', 'g', 'tub'),
  ('Rigatoni', 'Grain', 'g', 'box'),
  ('Rolled Oats', 'Grain', 'g', 'container'),
  ('Roma Tomato', 'Vegetable', 'g', 'count'),
  ('Romesco Sauce', 'Spice/Sauce', 'g', 'jar'),
  ('Rose Water', 'Spice/Sauce', 'ml', 'bottle'),
  ('Rosemary Oil', 'Oil', 'ml', 'bottle'),
  ('Russet Potato', 'Vegetable', 'g', 'count'),
  ('Rye Berries', 'Grain', 'g', 'bag'),
  ('Rye Flour', 'Baking', 'g', 'bag'),
  ('Saeujeot (Salted Fermented Shrimp)', 'Spice/Sauce', 'g', 'jar'),
  ('Safflower Oil', 'Oil', 'ml', 'bottle'),
  ('Saffron', 'Spice/Sauce', 'g', 'jar'),
  ('Sake', 'Pantry', 'ml', 'bottle'),
  ('Salam Leaf (Indonesian Bay Leaf)', 'Vegetable', 'g', 'bag'),
  ('Salmon Fillet', 'Protein', 'g', 'lb'),
  ('Salt', 'Spice/Sauce', 'g', 'container'),
  ('Salted Butter', 'Dairy', 'g', 'stick'),
  ('Salted Duck Egg', 'Protein', 'g', 'count'),
  ('Sambal Oelek', 'Spice/Sauce', 'g', 'jar'),
  ('Sawtooth Herb (Culantro)', 'Vegetable', 'g', 'bunch'),
  ('Scallion Oil', 'Oil', 'ml', 'bottle'),
  ('Scallops', 'Protein', 'g', 'lb'),
  ('Schmaltz (Chicken Fat)', 'Fat', 'g', 'jar'),
  ('Sea Salt (Fine)', 'Spice/Sauce', 'g', 'jar'),
  ('Sea Salt (Flaky/Maldon)', 'Spice/Sauce', 'g', 'box'),
  ('Seitan', 'Protein', 'g', 'lb'),
  ('Self-Rising Flour', 'Baking', 'g', 'bag'),
  ('Semi-Sweet Chocolate Chips', 'Baking', 'g', 'bag'),
  ('Semolina Flour', 'Baking', 'g', 'bag'),
  ('Serrano Pepper', 'Vegetable', 'g', 'count'),
  ('Sesame Seeds (Black)', 'Spice/Sauce', 'g', 'jar'),
  ('Sesame Seeds (White)', 'Spice/Sauce', 'g', 'jar'),
  ('Seville Orange (Bitter Orange)', 'Fruit', 'g', 'count'),
  ('Shallot Oil', 'Oil', 'ml', 'bottle'),
  ('Shallots', 'Vegetable', 'g', 'count'),
  ('Shaoxing Rice Wine', 'Spice/Sauce', 'ml', 'bottle'),
  ('Sherry Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Shichimi Togarashi', 'Spice/Sauce', 'g', 'jar'),
  ('Shiitake Mushroom', 'Vegetable', 'g', 'container'),
  ('Shiso (Perilla Leaves)', 'Vegetable', 'g', 'bunch'),
  ('Short Grain White Rice', 'Grain', 'g', 'bag'),
  ('Shredded Coconut', 'Baking', 'g', 'bag'),
  ('Shrimp', 'Protein', 'g', 'lb'),
  ('Shrimp Floss', 'Pantry', 'g', 'bag'),
  ('Shrimp Paste (Kapi)', 'Spice/Sauce', 'g', 'jar'),
  ('Sichuan Peppercorn Oil', 'Oil', 'ml', 'bottle'),
  ('Sichuan Peppercorns', 'Spice/Sauce', 'g', 'jar')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Sirloin Steak', 'Protein', 'g', 'lb'),
  ('Skirt Steak', 'Protein', 'g', 'lb'),
  ('Slivered Almonds', 'Baking', 'g', 'bag'),
  ('Smoked Paprika', 'Spice/Sauce', 'g', 'jar'),
  ('Snap Peas', 'Vegetable', 'g', 'bag'),
  ('Snow Fungus (White Tremella)', 'Pantry', 'g', 'bag'),
  ('Snow Peas', 'Vegetable', 'g', 'bag'),
  ('Soba Noodles', 'Grain', 'g', 'pack'),
  ('Sofrito Base', 'Spice/Sauce', 'g', 'jar'),
  ('Soju', 'Pantry', 'ml', 'bottle'),
  ('Sorghum', 'Grain', 'g', 'bag'),
  ('Sorrel', 'Vegetable', 'g', 'bunch'),
  ('Sour Cream', 'Dairy', 'g', 'tub'),
  ('Soursop (Guanábana)', 'Fruit', 'g', 'count'),
  ('Soy Milk', 'Dairy', 'ml', 'carton'),
  ('Soy Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Soy Sauce (Dark)', 'Spice/Sauce', 'ml', 'bottle'),
  ('Soy Sauce Paste (Jiangye)', 'Spice/Sauce', 'g', 'jar'),
  ('Soybean Oil', 'Oil', 'ml', 'bottle'),
  ('Soybean Sprouts', 'Vegetable', 'g', 'bag'),
  ('Spaghetti', 'Grain', 'g', 'box'),
  ('Spelt Berries', 'Grain', 'g', 'bag'),
  ('Spelt Flour', 'Baking', 'g', 'bag'),
  ('Spinach', 'Vegetable', 'g', 'bag'),
  ('Sriracha', 'Spice/Sauce', 'ml', 'bottle'),
  ('Ssamjang', 'Spice/Sauce', 'g', 'tub'),
  ('Ssuk (Korean Mugwort)', 'Vegetable', 'g', 'bunch'),
  ('Star Anise (Whole)', 'Spice/Sauce', 'g', 'jar'),
  ('Star Fruit (Carambola)', 'Fruit', 'g', 'count'),
  ('Steamed Fish Soy Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Steel Cut Oats', 'Grain', 'g', 'container'),
  ('Sticky Rice (Glutinous)', 'Grain', 'g', 'bag'),
  ('Straw Mushroom', 'Vegetable', 'g', 'can'),
  ('Strawberry', 'Fruit', 'g', 'container'),
  ('Sudachi', 'Fruit', 'g', 'count'),
  ('Sumac', 'Spice/Sauce', 'g', 'jar'),
  ('Sun-Dried Tomatoes', 'Pantry', 'g', 'jar'),
  ('Sunflower Oil', 'Oil', 'ml', 'bottle'),
  ('Sweet Chili Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Sweet Potato', 'Vegetable', 'g', 'count'),
  ('Swiss Chard', 'Vegetable', 'g', 'bunch'),
  ('Swiss Cheese', 'Dairy', 'g', 'pack'),
  ('Swordfish', 'Protein', 'g', 'lb'),
  ('Tabasco', 'Spice/Sauce', 'ml', 'bottle'),
  ('Taco Seasoning', 'Spice/Sauce', 'g', 'pack'),
  ('Tahini', 'Spice/Sauce', 'g', 'jar'),
  ('Taiwan Shacha Sauce', 'Spice/Sauce', 'g', 'jar'),
  ('Tamari', 'Spice/Sauce', 'ml', 'bottle'),
  ('Tamarind Block', 'Spice/Sauce', 'g', 'block'),
  ('Tamarind Concentrate', 'Spice/Sauce', 'g', 'jar')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Tamarind Paste', 'Spice/Sauce', 'g', 'jar'),
  ('Tapioca Pearls', 'Pantry', 'g', 'bag'),
  ('Tapioca Starch', 'Baking', 'g', 'bag'),
  ('Taro Balls (Wu Yuan)', 'Pantry', 'g', 'bag'),
  ('Taro Root', 'Vegetable', 'g', 'count'),
  ('Teff', 'Grain', 'g', 'bag'),
  ('Tejocote', 'Fruit', 'g', 'count'),
  ('Tempeh', 'Protein', 'g', 'lb'),
  ('Terasi (Indonesian Shrimp Paste)', 'Spice/Sauce', 'g', 'block'),
  ('Teriyaki Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('Thai Basil', 'Vegetable', 'g', 'bunch'),
  ('Thai Bird''s Eye Chili', 'Vegetable', 'g', 'bag'),
  ('Thai Eggplant', 'Vegetable', 'g', 'count'),
  ('Tilapia', 'Protein', 'g', 'lb'),
  ('Toasted Rice Powder', 'Spice/Sauce', 'g', 'bag'),
  ('Toasted Sesame Oil', 'Oil', 'ml', 'bottle'),
  ('Tofu', 'Protein', 'g', 'lb'),
  ('Tomatillo', 'Vegetable', 'g', 'count'),
  ('Tomato Paste', 'Spice/Sauce', 'g', 'can'),
  ('Tomato Sauce', 'Spice/Sauce', 'g', 'can'),
  ('Toon Leaves (Xiangchun)', 'Vegetable', 'g', 'bunch'),
  ('Torch Ginger Flower (Bunga Kantan)', 'Vegetable', 'g', 'count'),
  ('Trahana', 'Grain', 'g', 'bag'),
  ('Truffle (Black)', 'Pantry', 'g', 'count'),
  ('Truffle Oil (Black)', 'Oil', 'ml', 'bottle'),
  ('Truffle Oil (White)', 'Oil', 'ml', 'bottle'),
  ('Tteok (Korean Rice Cakes)', 'Pantry', 'g', 'bag'),
  ('Turkey Breast', 'Protein', 'g', 'lb'),
  ('Turmeric (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('Turmeric Leaves', 'Vegetable', 'g', 'bag'),
  ('Turnip', 'Vegetable', 'g', 'count'),
  ('Udon Noodles (Fresh)', 'Grain', 'g', 'pack'),
  ('Ume (Japanese Plum)', 'Fruit', 'g', 'count'),
  ('Unsalted Butter', 'Dairy', 'g', 'stick'),
  ('Unsweetened Cocoa Powder', 'Baking', 'g', 'container'),
  ('Urfa Biber (Isot Pepper)', 'Spice/Sauce', 'g', 'jar'),
  ('Valencia Orange', 'Fruit', 'g', 'count'),
  ('Vanilla Bean Paste', 'Baking', 'g', 'jar'),
  ('Vanilla Extract', 'Baking', 'ml', 'bottle'),
  ('Veal Cutlets', 'Protein', 'g', 'lb'),
  ('Vegan Butter', 'Dairy', 'g', 'tub'),
  ('Vegan Shredded Cheese', 'Dairy', 'g', 'bag'),
  ('Vegetable Base (Better Than Bouillon)', 'Spice/Sauce', 'g', 'jar'),
  ('Vegetable Oil', 'Oil', 'ml', 'bottle'),
  ('Vietnamese Mint (Rau Ram)', 'Vegetable', 'g', 'bunch'),
  ('Virgin Olive Oil', 'Oil', 'ml', 'bottle'),
  ('Wakame (Dried Seaweed)', 'Pantry', 'g', 'bag'),
  ('Walnut Oil', 'Oil', 'ml', 'bottle'),
  ('Wasabi Paste', 'Spice/Sauce', 'g', 'container'),
  ('Water Caltrops (Ling Jiao)', 'Vegetable', 'g', 'bag')
ON CONFLICT (name) DO NOTHING;

INSERT INTO ingredients (name, category, base_unit, preferred_unit) VALUES
  ('Water Chestnuts (Canned)', 'Vegetable', 'g', 'can'),
  ('Watercress', 'Vegetable', 'g', 'bag'),
  ('Watermelon', 'Fruit', 'g', 'count'),
  ('Wheat Berries', 'Grain', 'g', 'bag'),
  ('White Button Mushroom', 'Vegetable', 'g', 'container'),
  ('White Miso Paste', 'Spice/Sauce', 'g', 'tub'),
  ('White Onion', 'Vegetable', 'g', 'count'),
  ('White Peach', 'Fruit', 'g', 'count'),
  ('White Pepper (Ground)', 'Spice/Sauce', 'g', 'jar'),
  ('White Wine Vinegar', 'Spice/Sauce', 'ml', 'bottle'),
  ('Whole Chicken', 'Protein', 'g', 'lb'),
  ('Whole Cloves', 'Spice/Sauce', 'g', 'jar'),
  ('Whole Grain Mustard', 'Spice/Sauce', 'ml', 'jar'),
  ('Whole Milk', 'Dairy', 'ml', 'carton'),
  ('Whole Wheat Flour', 'Baking', 'g', 'bag'),
  ('Wide Rice Noodles (Ho Fun)', 'Grain', 'g', 'pack'),
  ('Wild Rice', 'Grain', 'g', 'bag'),
  ('Wild Rice Stems (Jiao Bai)', 'Vegetable', 'g', 'count'),
  ('Winter Melon', 'Vegetable', 'g', 'count'),
  ('Wonton Wrappers', 'Pantry', 'g', 'pack'),
  ('Worcestershire Sauce', 'Spice/Sauce', 'ml', 'bottle'),
  ('XO Sauce', 'Spice/Sauce', 'g', 'jar'),
  ('Yellow Mustard', 'Spice/Sauce', 'ml', 'bottle'),
  ('Yellow Onion', 'Vegetable', 'g', 'count'),
  ('Yellow Peach', 'Fruit', 'g', 'count'),
  ('Young Coconut', 'Fruit', 'g', 'count'),
  ('Yu Choy (Chinese Flowering Cabbage)', 'Vegetable', 'g', 'bunch'),
  ('Yukon Gold Potato', 'Vegetable', 'g', 'count'),
  ('Yuzu', 'Fruit', 'g', 'count'),
  ('Za''atar', 'Spice/Sauce', 'g', 'jar'),
  ('Zucchini', 'Vegetable', 'g', 'count')
ON CONFLICT (name) DO NOTHING;


-- ── Global unit conversions (ingredient_id IS NULL) ─────────────────────────

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit) VALUES
  (NULL, 'cup', 240, 'ml'),
  (NULL, 'lb', 453, 'g'),
  (NULL, 'oz', 28, 'g'),
  (NULL, 'tbsp', 15, 'ml'),
  (NULL, 'tsp', 5, 'ml')
ON CONFLICT DO NOTHING;


-- ── Ingredient-specific unit conversions ─────────────────────────────────────

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'carton', 1890::numeric, 'ml' FROM ingredients WHERE name = '2% Milk' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 280::numeric, 'ml' FROM ingredients WHERE name = 'A1 Steak Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'block', 100::numeric, 'g' FROM ingredients WHERE name = 'Achiote Paste' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Acini di Pepe' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Acini di Pepe' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 7::numeric, 'g' FROM ingredients WHERE name = 'Active Dry Yeast' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Adzuki Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Aiyu Jelly' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Ajwain (Carom Seeds)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Aleppo Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 2267::numeric, 'g' FROM ingredients WHERE name = 'All-Purpose Flour' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 120::numeric, 'g' FROM ingredients WHERE name = 'All-Purpose Flour' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Allspice (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 59::numeric, 'ml' FROM ingredients WHERE name = 'Almond Extract' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Almond Flour' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 96::numeric, 'g' FROM ingredients WHERE name = 'Almond Flour' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 1890::numeric, 'ml' FROM ingredients WHERE name = 'Almond Milk' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Almond Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Amaranth' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 190::numeric, 'g' FROM ingredients WHERE name = 'Amaranth' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Amchur (Dried Mango Powder)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Anaheim Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 60::numeric, 'g' FROM ingredients WHERE name = 'Anchovy Paste' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Angel Hair' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Angel Hair' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Anise Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Annatto Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'count', 35::numeric, 'g' FROM ingredients WHERE name = 'Apricot' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Arborio Rice' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Arborio Rice' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Argan Oil (Culinary)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 50::numeric, 'g' FROM ingredients WHERE name = 'Arrowhead Corm (Ci Gu)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 300::numeric, 'g' FROM ingredients WHERE name = 'Artichoke' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Arugula' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Asafoetida (Hing)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 10::numeric, 'g' FROM ingredients WHERE name = 'Asam Boi (Sour Plum)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Asam Gelugur (Dried Tamarind Slice)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 250::numeric, 'g' FROM ingredients WHERE name = 'Asian Pear' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 450::numeric, 'g' FROM ingredients WHERE name = 'Asparagus' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Avocado (Haas)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Avocado Oil' LIMIT 1)
UNION ALL
(SELECT id, 'head', 150::numeric, 'g' FROM ingredients WHERE name = 'Baby Bok Choy' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 340::numeric, 'g' FROM ingredients WHERE name = 'Bacon Grease' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Baharat' LIMIT 1)
UNION ALL
(SELECT id, 'container', 230::numeric, 'g' FROM ingredients WHERE name = 'Baking Powder' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 4.8::numeric, 'g' FROM ingredients WHERE name = 'Baking Powder' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Baking Soda' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 6.0::numeric, 'g' FROM ingredients WHERE name = 'Baking Soda' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Balsamic Glaze' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Balsamic Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Bamboo Shoot Curry Paste' LIMIT 1)
UNION ALL
(SELECT id, 'can', 225::numeric, 'g' FROM ingredients WHERE name = 'Bamboo Shoots (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Bamboo Shoots (Fresh)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 120::numeric, 'g' FROM ingredients WHERE name = 'Banana' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Banana Blossom' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 200::numeric, 'g' FROM ingredients WHERE name = 'Banana Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Barberry (Zereshk)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Barley (Pearl)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Barley (Pearl)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 170::numeric, 'g' FROM ingredients WHERE name = 'Bartlett Pear' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Basil Infused Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 4535::numeric, 'g' FROM ingredients WHERE name = 'Basmati Rice' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 185::numeric, 'g' FROM ingredients WHERE name = 'Basmati Rice' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Bawang Goreng (Fried Shallots)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 510::numeric, 'ml' FROM ingredients WHERE name = 'BBQ Sauce (Carolina)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 510::numeric, 'ml' FROM ingredients WHERE name = 'BBQ Sauce (Sweet)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Bean Sprouts' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Beancurd Skin (Tofu Skin)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 227::numeric, 'g' FROM ingredients WHERE name = 'Beef Base (Better Than Bouillon)' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 1000::numeric, 'g' FROM ingredients WHERE name = 'Beef Tallow' LIMIT 1)
UNION ALL
(SELECT id, 'count', 350::numeric, 'g' FROM ingredients WHERE name = 'Beefsteak Tomato' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Beets' LIMIT 1)
UNION ALL
(SELECT id, 'block', 50::numeric, 'g' FROM ingredients WHERE name = 'Belacan (Malaysian Shrimp Paste)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Bell Pepper (Green)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Bell Pepper (Red)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Bell Pepper (Yellow)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 5::numeric, 'g' FROM ingredients WHERE name = 'Bilimbi (Belimbing Wuluh)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Bitter Melon (Karela)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Bittersweet Chocolate Bar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 250::numeric, 'g' FROM ingredients WHERE name = 'Black Bean Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Black Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Black Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Black Cardamom Pods' LIMIT 1)
UNION ALL
(SELECT id, 'container', 150::numeric, 'g' FROM ingredients WHERE name = 'Black Currant' LIMIT 1)
UNION ALL
(SELECT id, 'head', 50::numeric, 'g' FROM ingredients WHERE name = 'Black Garlic' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Black Mustard Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Black Pepper (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 2.3::numeric, 'g' FROM ingredients WHERE name = 'Black Pepper (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 60::numeric, 'g' FROM ingredients WHERE name = 'Black Peppercorns' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Black Rice (Forbidden)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 190::numeric, 'g' FROM ingredients WHERE name = 'Black Rice (Forbidden)' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Black-Eyed Peas (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Black-Eyed Peas (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'container', 170::numeric, 'g' FROM ingredients WHERE name = 'Blackberry' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Blood Orange' LIMIT 1)
UNION ALL
(SELECT id, 'wedge', 113::numeric, 'g' FROM ingredients WHERE name = 'Blue Cheese' LIMIT 1)
UNION ALL
(SELECT id, 'container', 170::numeric, 'g' FROM ingredients WHERE name = 'Blueberry' LIMIT 1)
UNION ALL
(SELECT id, 'head', 400::numeric, 'g' FROM ingredients WHERE name = 'Bok Choy' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 40::numeric, 'g' FROM ingredients WHERE name = 'Bonito Flakes (Katsuobushi)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 2267::numeric, 'g' FROM ingredients WHERE name = 'Bread Flour' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'cup', 127::numeric, 'g' FROM ingredients WHERE name = 'Bread Flour' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Breadcrumbs (Panko)' LIMIT 1)
UNION ALL
(SELECT id, 'wheel', 225::numeric, 'g' FROM ingredients WHERE name = 'Brie' LIMIT 1)
UNION ALL
(SELECT id, 'head', 450::numeric, 'g' FROM ingredients WHERE name = 'Broccoli' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 170::numeric, 'g' FROM ingredients WHERE name = 'Broccolini' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Brussels Sprouts' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Buckwheat Flour' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Buckwheat Groats' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 170::numeric, 'g' FROM ingredients WHERE name = 'Buckwheat Groats' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 354::numeric, 'ml' FROM ingredients WHERE name = 'Buffalo Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Bulgur Wheat' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 150::numeric, 'g' FROM ingredients WHERE name = 'Bulgur Wheat' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Burdock Root (Gobo)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 113::numeric, 'g' FROM ingredients WHERE name = 'Burrata' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 10::numeric, 'g' FROM ingredients WHERE name = 'Butterfly Pea Flower' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 946::numeric, 'ml' FROM ingredients WHERE name = 'Buttermilk' LIMIT 1)
UNION ALL
(SELECT id, 'count', 1000::numeric, 'g' FROM ingredients WHERE name = 'Butternut Squash' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 473::numeric, 'ml' FROM ingredients WHERE name = 'Caesar Dressing' LIMIT 1)
UNION ALL
(SELECT id, 'box', 907::numeric, 'g' FROM ingredients WHERE name = 'Cake Flour' LIMIT 1)
UNION ALL
(SELECT id, 'count', 20::numeric, 'g' FROM ingredients WHERE name = 'Calamansi' LIMIT 1)
UNION ALL
(SELECT id, 'wheel', 250::numeric, 'g' FROM ingredients WHERE name = 'Camembert' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Canned Artichoke Hearts' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Canned Chickpeas' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Canned Whole Tomatoes' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Cannellini Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Cannellini Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 946::numeric, 'ml' FROM ingredients WHERE name = 'Canola Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 1200::numeric, 'g' FROM ingredients WHERE name = 'Cantaloupe' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Caperberries' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Capers' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Caraway Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 45::numeric, 'g' FROM ingredients WHERE name = 'Cardamom (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 35::numeric, 'g' FROM ingredients WHERE name = 'Cardamom Pods' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Carob Molasses' LIMIT 1)
UNION ALL
(SELECT id, 'count', 120::numeric, 'g' FROM ingredients WHERE name = 'Carrots' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 946::numeric, 'ml' FROM ingredients WHERE name = 'Cashew Milk' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Cashew Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Cassava' LIMIT 1)
UNION ALL
(SELECT id, 'head', 600::numeric, 'g' FROM ingredients WHERE name = 'Cauliflower' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Cayenne Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'count', 700::numeric, 'g' FROM ingredients WHERE name = 'Celeriac (Celery Root)' LIMIT 1)
UNION ALL
(SELECT id, 'stalk', 50::numeric, 'g' FROM ingredients WHERE name = 'Celery' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 120::numeric, 'g' FROM ingredients WHERE name = 'Celery Salt' LIMIT 1)
UNION ALL
(SELECT id, 'count', 60::numeric, 'g' FROM ingredients WHERE name = 'Century Egg (Pidan)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Chaat Masala' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Champagne Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Char Siu Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Chayote' LIMIT 1)
UNION ALL
(SELECT id, 'block', 227::numeric, 'g' FROM ingredients WHERE name = 'Cheddar (Mild)' LIMIT 1)
UNION ALL
(SELECT id, 'block', 227::numeric, 'g' FROM ingredients WHERE name = 'Cheddar (Sharp)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Chermoula Spice Blend' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Cherry' LIMIT 1)
UNION ALL
(SELECT id, 'pint', 300::numeric, 'g' FROM ingredients WHERE name = 'Cherry Tomato' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Chestnuts' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 227::numeric, 'g' FROM ingredients WHERE name = 'Chicken Base (Better Than Bouillon)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Chili Garlic Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 150::numeric, 'ml' FROM ingredients WHERE name = 'Chili Oil (Pure)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 210::numeric, 'ml' FROM ingredients WHERE name = 'Chili Oil (with Flakes)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 70::numeric, 'g' FROM ingredients WHERE name = 'Chili Powder (Standard)' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 300::numeric, 'g' FROM ingredients WHERE name = 'Chinese Broccoli (Gai Lan)' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 150::numeric, 'g' FROM ingredients WHERE name = 'Chinese Celery' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 100::numeric, 'g' FROM ingredients WHERE name = 'Chinese Chives (Garlic Chives)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Chinese Five Spice' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 250::numeric, 'g' FROM ingredients WHERE name = 'Chinese Long Beans' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 200::numeric, 'g' FROM ingredients WHERE name = 'Chinese Sausage (Lap Cheong)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Chinese Sesame Paste' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 200::numeric, 'g' FROM ingredients WHERE name = 'Chinese Spinach (Amaranth Greens)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 550::numeric, 'ml' FROM ingredients WHERE name = 'Chinkaing Black Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'can', 198::numeric, 'g' FROM ingredients WHERE name = 'Chipotle in Adobo' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Chives' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 150::numeric, 'ml' FROM ingredients WHERE name = 'Cholula' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Chopped Walnuts' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Chrysanthemum Greens' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Chunjang (Black Bean Paste)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 100::numeric, 'g' FROM ingredients WHERE name = 'Cincalok (Fermented Shrimp)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 65::numeric, 'g' FROM ingredients WHERE name = 'Cinnamon (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 2.6::numeric, 'g' FROM ingredients WHERE name = 'Cinnamon (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 25::numeric, 'g' FROM ingredients WHERE name = 'Cinnamon Sticks' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Clementine' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 35::numeric, 'g' FROM ingredients WHERE name = 'Cloves (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Coconut' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'ml' FROM ingredients WHERE name = 'Coconut Cream' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Coconut Flour' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 250::numeric, 'g' FROM ingredients WHERE name = 'Coconut Jam (Kaya)' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'ml' FROM ingredients WHERE name = 'Coconut Milk (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 1890::numeric, 'ml' FROM ingredients WHERE name = 'Coconut Milk (Refrigerated)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 414::numeric, 'ml' FROM ingredients WHERE name = 'Coconut Oil (Refined)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 414::numeric, 'ml' FROM ingredients WHERE name = 'Coconut Oil (Virgin)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Coconut Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'can', 396::numeric, 'g' FROM ingredients WHERE name = 'Condensed Milk' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Coriander (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 30::numeric, 'g' FROM ingredients WHERE name = 'Coriander Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Corn' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 1000::numeric, 'ml' FROM ingredients WHERE name = 'Corn Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 473::numeric, 'ml' FROM ingredients WHERE name = 'Corn Syrup' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Cornichons' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 680::numeric, 'g' FROM ingredients WHERE name = 'Cornmeal' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 160::numeric, 'g' FROM ingredients WHERE name = 'Cornmeal' LIMIT 1)
UNION ALL
(SELECT id, 'container', 454::numeric, 'g' FROM ingredients WHERE name = 'Cornstarch' LIMIT 1)
UNION ALL
(SELECT id, 'tbsp', 8::numeric, 'g' FROM ingredients WHERE name = 'Cornstarch' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'tub', 454::numeric, 'g' FROM ingredients WHERE name = 'Cottage Cheese' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 1000::numeric, 'ml' FROM ingredients WHERE name = 'Cottonseed Oil' LIMIT 1)
UNION ALL
(SELECT id, 'box', 283::numeric, 'g' FROM ingredients WHERE name = 'Couscous' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 170::numeric, 'g' FROM ingredients WHERE name = 'Couscous' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 340::numeric, 'g' FROM ingredients WHERE name = 'Cranberry' LIMIT 1)
UNION ALL
(SELECT id, 'block', 227::numeric, 'g' FROM ingredients WHERE name = 'Cream Cheese' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 42::numeric, 'g' FROM ingredients WHERE name = 'Cream of Tartar' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 200::numeric, 'g' FROM ingredients WHERE name = 'Crème Fraîche' LIMIT 1)
UNION ALL
(SELECT id, 'container', 225::numeric, 'g' FROM ingredients WHERE name = 'Cremini Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 42::numeric, 'g' FROM ingredients WHERE name = 'Crushed Red Pepper Flakes' LIMIT 1)
UNION ALL
(SELECT id, 'count', 350::numeric, 'g' FROM ingredients WHERE name = 'Cucumber (English)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Cucumber (Persian)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 45::numeric, 'g' FROM ingredients WHERE name = 'Cumin (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 2.5::numeric, 'g' FROM ingredients WHERE name = 'Cumin (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 45::numeric, 'g' FROM ingredients WHERE name = 'Cumin Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 113::numeric, 'g' FROM ingredients WHERE name = 'Curry Paste (Green)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 113::numeric, 'g' FROM ingredients WHERE name = 'Curry Paste (Red)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Curry Powder (Mild)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Daikon Radish' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 200::numeric, 'g' FROM ingredients WHERE name = 'Dandelion Greens' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Dangmyeon (Sweet Potato Starch)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Dangmyeon (Sweet Potato Starch)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Dark Brown Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 340::numeric, 'g' FROM ingredients WHERE name = 'Dark Chocolate Chips' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dashi Powder' LIMIT 1)
UNION ALL
(SELECT id, 'box', 350::numeric, 'g' FROM ingredients WHERE name = 'Dates' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 210::numeric, 'ml' FROM ingredients WHERE name = 'Dijon Mustard' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 500::numeric, 'g' FROM ingredients WHERE name = 'Doenjang' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Doraji (Bellflower Root)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Doubanjiang' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Dragon Fruit' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Dragonfruit' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Ancho Chile' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Anchovies (Myeolchi)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 170::numeric, 'g' FROM ingredients WHERE name = 'Dried Apricots' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 15::numeric, 'g' FROM ingredients WHERE name = 'Dried Basil' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 0.7::numeric, 'g' FROM ingredients WHERE name = 'Dried Basil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 5::numeric, 'g' FROM ingredients WHERE name = 'Dried Bay Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'leaf', 0.2::numeric, 'g' FROM ingredients WHERE name = 'Dried Bay Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Cascabel Chile' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Dried Chickpeas' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Chile de Árbol' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Dried Currants' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 15::numeric, 'g' FROM ingredients WHERE name = 'Dried Dill Weed' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Guajillo Chile' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Kashmiri Chili' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Dried Lavender' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 30::numeric, 'g' FROM ingredients WHERE name = 'Dried Lily Buds' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Longan' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Dried Lotus Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Dried Marjoram' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Dried Mint' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Morita Chile' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Ñora Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 20::numeric, 'g' FROM ingredients WHERE name = 'Dried Oregano' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 1.0::numeric, 'g' FROM ingredients WHERE name = 'Dried Oregano' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Oysters' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 10::numeric, 'g' FROM ingredients WHERE name = 'Dried Parsley' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 0.5::numeric, 'g' FROM ingredients WHERE name = 'Dried Parsley' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Pasilla Chile' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Persimmon' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Red Chilies (Chinese)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Rose Petals' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 30::numeric, 'g' FROM ingredients WHERE name = 'Dried Rosemary' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 20::numeric, 'g' FROM ingredients WHERE name = 'Dried Sage' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Salted Fish (Ikan Bilis)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Shiitake Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Shrimp' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Shrimp Sambal' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Dried Squid' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Dried Tarragon' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 20::numeric, 'g' FROM ingredients WHERE name = 'Dried Thyme' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Dried Tofu (Dried Bean Curd)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Dried Wood Ear Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Drumstick (Moringa Pods)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 300::numeric, 'g' FROM ingredients WHERE name = 'Duck Fat' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 300::numeric, 'g' FROM ingredients WHERE name = 'Dumpling Wrappers' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 300::numeric, 'g' FROM ingredients WHERE name = 'Edamame' LIMIT 1)
UNION ALL
(SELECT id, 'count', 0.08333::numeric, 'dozen' FROM ingredients WHERE name = 'Egg (Brown)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 0.08333::numeric, 'dozen' FROM ingredients WHERE name = 'Egg (White)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 450::numeric, 'g' FROM ingredients WHERE name = 'Eggplant' LIMIT 1)
UNION ALL
(SELECT id, 'head', 120::numeric, 'g' FROM ingredients WHERE name = 'Endive' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Enoki Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'can', 354::numeric, 'ml' FROM ingredients WHERE name = 'Evaporated Milk' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 150::numeric, 'g' FROM ingredients WHERE name = 'Everything Bagel Seasoning' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 750::numeric, 'ml' FROM ingredients WHERE name = 'Extra Virgin Olive Oil' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Farfalle (Bow Tie)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Farfalle (Bow Tie)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Farro' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Farro' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Fava Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Fava Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 250::numeric, 'g' FROM ingredients WHERE name = 'Fennel Bulb' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 45::numeric, 'g' FROM ingredients WHERE name = 'Fennel Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Fenugreek Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Fermented Bean Curd (White)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Fermented Bean Paste (Taucu)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Fermented Black Beans' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Fermented Tofu (Chao)' LIMIT 1)
UNION ALL
(SELECT id, 'container', 200::numeric, 'g' FROM ingredients WHERE name = 'Feta' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Fettuccine' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Fettuccine' LIMIT 1)
UNION ALL
(SELECT id, 'container', 250::numeric, 'g' FROM ingredients WHERE name = 'Fig' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 725::numeric, 'ml' FROM ingredients WHERE name = 'Fish Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Flaxseed Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 354::numeric, 'ml' FROM ingredients WHERE name = 'Frank''s RedHot' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Freekeh' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 160::numeric, 'g' FROM ingredients WHERE name = 'Freekeh' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 25::numeric, 'g' FROM ingredients WHERE name = 'Fresh Basil' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Chervil' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 30::numeric, 'g' FROM ingredients WHERE name = 'Fresh Cilantro' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Curry Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 25::numeric, 'g' FROM ingredients WHERE name = 'Fresh Dill' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 25::numeric, 'g' FROM ingredients WHERE name = 'Fresh Epazote' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 100::numeric, 'g' FROM ingredients WHERE name = 'Fresh Fenugreek Leaves (Methi)' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 30::numeric, 'g' FROM ingredients WHERE name = 'Fresh Flat-Leaf Parsley' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Marjoram' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 25::numeric, 'g' FROM ingredients WHERE name = 'Fresh Mint' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Oregano' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Rosemary' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Sage' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Fresh Tarragon' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Fresh Turmeric' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Fried Tofu Puffs' LIMIT 1)
UNION ALL
(SELECT id, 'count', 220::numeric, 'g' FROM ingredients WHERE name = 'Fuji Apple' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Fusilli' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Fusilli' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Fuzzy Melon (Hairy Gourd)' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 250::numeric, 'g' FROM ingredients WHERE name = 'Gai Choy (Chinese Mustard Greens)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 190::numeric, 'g' FROM ingredients WHERE name = 'Gala Apple' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Galangal' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Galangal Paste' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Galangal Powder' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Garam Masala' LIMIT 1)
UNION ALL
(SELECT id, 'bulb', 50::numeric, 'count' FROM ingredients WHERE name = 'Garlic' LIMIT 1)
UNION ALL
(SELECT id, 'clove', 5::numeric, 'count' FROM ingredients WHERE name = 'Garlic' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Garlic Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 85::numeric, 'g' FROM ingredients WHERE name = 'Garlic Powder' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 3.2::numeric, 'g' FROM ingredients WHERE name = 'Garlic Powder' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 368::numeric, 'g' FROM ingredients WHERE name = 'Ghee (Clarified Butter)' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 25::numeric, 'g' FROM ingredients WHERE name = 'Gim (Korean Dried Seaweed)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 30::numeric, 'g' FROM ingredients WHERE name = 'Ginger' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Ginger (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 1.8::numeric, 'g' FROM ingredients WHERE name = 'Ginger (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 250::numeric, 'g' FROM ingredients WHERE name = 'Glass Noodles (Mung Bean)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 80::numeric, 'g' FROM ingredients WHERE name = 'Glass Noodles (Mung Bean)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Glutinous Rice Flour' LIMIT 1)
UNION ALL
(SELECT id, 'oz', 28.35::numeric, 'g' FROM ingredients WHERE name = 'Goat Cheese (Chèvre)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Gochugaru (Korean Chili Flakes)' LIMIT 1)
UNION ALL
(SELECT id, 'tbsp', 10::numeric, 'g' FROM ingredients WHERE name = 'Gochugaru (Korean Chili Flakes)' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 500::numeric, 'g' FROM ingredients WHERE name = 'Gochujang' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Goji Berries' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 100::numeric, 'g' FROM ingredients WHERE name = 'Goji Berry Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Golden kiwi' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Gosari (Dried Fernbrake)' LIMIT 1)
UNION ALL
(SELECT id, 'wheel', 300::numeric, 'g' FROM ingredients WHERE name = 'Gouda' LIMIT 1)
UNION ALL
(SELECT id, 'box', 380::numeric, 'g' FROM ingredients WHERE name = 'Graham Cracker Crumbs' LIMIT 1)
UNION ALL
(SELECT id, 'count', 180::numeric, 'g' FROM ingredients WHERE name = 'Granny Smith Apple' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 1814::numeric, 'g' FROM ingredients WHERE name = 'Granulated Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Granulated Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 400::numeric, 'g' FROM ingredients WHERE name = 'Grape Leaves (Preserved)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 300::numeric, 'g' FROM ingredients WHERE name = 'Grapefruit' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Grapeseed Oil' LIMIT 1)
UNION ALL
(SELECT id, 'can', 500::numeric, 'g' FROM ingredients WHERE name = 'Grass Jelly (Xiancao)' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Great Northern Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Great Northern Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 907::numeric, 'g' FROM ingredients WHERE name = 'Greek Yogurt (Plain)' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 907::numeric, 'g' FROM ingredients WHERE name = 'Greek Yogurt (Vanilla)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 340::numeric, 'g' FROM ingredients WHERE name = 'Green Beans' LIMIT 1)
UNION ALL
(SELECT id, 'head', 900::numeric, 'g' FROM ingredients WHERE name = 'Green Cabbage' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 907::numeric, 'g' FROM ingredients WHERE name = 'Green Grapes' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 250::numeric, 'g' FROM ingredients WHERE name = 'Green Olives' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 8::numeric, 'count' FROM ingredients WHERE name = 'Green Onions' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Green Papaya' LIMIT 1)
UNION ALL
(SELECT id, 'block', 170::numeric, 'g' FROM ingredients WHERE name = 'Gruyère' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Guava' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 946::numeric, 'ml' FROM ingredients WHERE name = 'Half and Half' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 300::numeric, 'g' FROM ingredients WHERE name = 'Haricots Verts' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 170::numeric, 'g' FROM ingredients WHERE name = 'Harissa' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Hazelnut Oil' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 473::numeric, 'ml' FROM ingredients WHERE name = 'Heavy Whipping Cream' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Heirloom Tomato' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Hemp Seed Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Herbes de Provence' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 240::numeric, 'g' FROM ingredients WHERE name = 'Hoisin Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Hominy (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 165::numeric, 'g' FROM ingredients WHERE name = 'Hominy (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 454::numeric, 'g' FROM ingredients WHERE name = 'Honey' LIMIT 1)
UNION ALL
(SELECT id, 'count', 220::numeric, 'g' FROM ingredients WHERE name = 'Honeycrisp Apple' LIMIT 1)
UNION ALL
(SELECT id, 'count', 1800::numeric, 'g' FROM ingredients WHERE name = 'Honeydew' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 200::numeric, 'g' FROM ingredients WHERE name = 'Horta (Wild Chicory Greens)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 255::numeric, 'ml' FROM ingredients WHERE name = 'HP Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Indian Eggplant (Brinjal)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Indian Gooseberry (Amla)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 113::numeric, 'g' FROM ingredients WHERE name = 'Instant Yeast' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Israeli Couscous' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 175::numeric, 'g' FROM ingredients WHERE name = 'Israeli Couscous' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 473::numeric, 'ml' FROM ingredients WHERE name = 'Italian Dressing' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 25::numeric, 'g' FROM ingredients WHERE name = 'Italian Seasoning' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Jackfruit (Green, Canned)' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'count', 1500::numeric, 'g' FROM ingredients WHERE name = 'Jackfruit (Ripe)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Jackfruit Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'count', 30::numeric, 'g' FROM ingredients WHERE name = 'Jalapeño' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Japanese Eggplant' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 2267::numeric, 'g' FROM ingredients WHERE name = 'Jasmine Rice' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 185::numeric, 'g' FROM ingredients WHERE name = 'Jasmine Rice' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Jengkol (Dogfruit)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Jicama' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Jujube (Red Dates)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 1200::numeric, 'g' FROM ingredients WHERE name = 'Kabocha Squash' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 15::numeric, 'g' FROM ingredients WHERE name = 'Kaffir Lime Leaves (Makrut)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 250::numeric, 'g' FROM ingredients WHERE name = 'Kalamata Olives' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 250::numeric, 'g' FROM ingredients WHERE name = 'Kale' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 680::numeric, 'g' FROM ingredients WHERE name = 'Kamut' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Kamut' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Kashmiri Chili Powder' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Kasuri Methi (Dried Fenugreek Leaves)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Kecap Manis (Sweet Soy Sauce)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 946::numeric, 'ml' FROM ingredients WHERE name = 'Kefir' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Kemiri (Candlenut)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 30::numeric, 'g' FROM ingredients WHERE name = 'Kencur (Kaempferia)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 567::numeric, 'ml' FROM ingredients WHERE name = 'Ketchup' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'g' FROM ingredients WHERE name = 'Kewpie Mayo' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Kidney Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Kidney Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 400::numeric, 'g' FROM ingredients WHERE name = 'Kimchi' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 170::numeric, 'g' FROM ingredients WHERE name = 'King Oyster Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'count', 70::numeric, 'g' FROM ingredients WHERE name = 'Kiwi' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Kluwek (Black Nut)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 300::numeric, 'g' FROM ingredients WHERE name = 'Kohlrabi' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Kombu' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Korean Anchovy Broth Powder' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 250::numeric, 'g' FROM ingredients WHERE name = 'Korean Fish Cake (Eomuk)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 800::numeric, 'g' FROM ingredients WHERE name = 'Korean Radish (Mu)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Korean Soup Soy Sauce (Ganjang)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 1360::numeric, 'g' FROM ingredients WHERE name = 'Kosher Salt' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 2.8::numeric, 'g' FROM ingredients WHERE name = 'Kosher Salt' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Krachai (Fingerroot)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Kumquat' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Lá Lốt (Betel Leaf)' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 454::numeric, 'g' FROM ingredients WHERE name = 'Labneh' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Laksa Paste' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 210::numeric, 'g' FROM ingredients WHERE name = 'Lao Gan Ma (Chili Crisp)' LIMIT 1)
UNION ALL
(SELECT id, 'block', 454::numeric, 'g' FROM ingredients WHERE name = 'Lard' LIMIT 1)
UNION ALL
(SELECT id, 'box', 375::numeric, 'g' FROM ingredients WHERE name = 'Lasagna Sheets' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Lasagna Sheets' LIMIT 1)
UNION ALL
(SELECT id, 'stalk', 200::numeric, 'g' FROM ingredients WHERE name = 'Leeks' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Lemon' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Lemon Basil (Kemangi)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Lemon Infused Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 80::numeric, 'g' FROM ingredients WHERE name = 'Lemon Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'stalk', 50::numeric, 'g' FROM ingredients WHERE name = 'Lemongrass' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Lemongrass Paste' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Lentils (Brown)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Lentils (French/Puy)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Lentils (Green)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Lentils (Red)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Light Brown Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 213::numeric, 'g' FROM ingredients WHERE name = 'Light Brown Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 750::numeric, 'ml' FROM ingredients WHERE name = 'Light Olive Oil' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Lima Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Lima Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 60::numeric, 'g' FROM ingredients WHERE name = 'Lime' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Linguine' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Linguine' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 473::numeric, 'ml' FROM ingredients WHERE name = 'Liquid Aminos' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 147::numeric, 'ml' FROM ingredients WHERE name = 'Liquid Smoke' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Lo Mein Noodles' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 454::numeric, 'g' FROM ingredients WHERE name = 'Lo Mein Noodles' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Long Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 300::numeric, 'g' FROM ingredients WHERE name = 'Longan' LIMIT 1)
UNION ALL
(SELECT id, 'count', 30::numeric, 'g' FROM ingredients WHERE name = 'Loquat (Níspero)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 300::numeric, 'g' FROM ingredients WHERE name = 'Lotus Root' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Lychee' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Macadamia Nut Oil' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Macaroni (Elbow)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 120::numeric, 'g' FROM ingredients WHERE name = 'Macaroni (Elbow)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Mace (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 500::numeric, 'g' FROM ingredients WHERE name = 'Maesilcheong (Green Plum Syrup)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Mahlab (Mahleb)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 750::numeric, 'ml' FROM ingredients WHERE name = 'Makgeolli (Korean Rice Wine)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 50::numeric, 'g' FROM ingredients WHERE name = 'Makrut Lime' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Malaysian Curry Powder' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 500::numeric, 'g' FROM ingredients WHERE name = 'Maltose' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Mắm Tôm (Vietnamese Shrimp Paste)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Mamey Sapote' LIMIT 1)
UNION ALL
(SELECT id, 'wedge', 150::numeric, 'g' FROM ingredients WHERE name = 'Manchego' LIMIT 1)
UNION ALL
(SELECT id, 'count', 50::numeric, 'g' FROM ingredients WHERE name = 'Mandarin Orange' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Mango (Ataulfo)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 450::numeric, 'g' FROM ingredients WHERE name = 'Mango (Kent)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 300::numeric, 'g' FROM ingredients WHERE name = 'Mango Pickle (Achaar)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Mangosteen' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 354::numeric, 'ml' FROM ingredients WHERE name = 'Maple Syrup' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 425::numeric, 'g' FROM ingredients WHERE name = 'Margarine' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 680::numeric, 'g' FROM ingredients WHERE name = 'Marinara Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 227::numeric, 'g' FROM ingredients WHERE name = 'Mascarpone' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Mastic (Mastiha)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 887::numeric, 'ml' FROM ingredients WHERE name = 'Mayonnaise' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 907::numeric, 'g' FROM ingredients WHERE name = 'Medium Grain Brown Rice' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 190::numeric, 'g' FROM ingredients WHERE name = 'Medium Grain Brown Rice' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'box', 250::numeric, 'g' FROM ingredients WHERE name = 'Medjool Dates' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Melinjo Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Merguez Spice Mix' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Mexican Oregano (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 793::numeric, 'g' FROM ingredients WHERE name = 'Millet' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Millet' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 150::numeric, 'g' FROM ingredients WHERE name = 'Minari (Korean Watercress)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Mirin' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Mizuna' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Mochi Rice Flour (Shiratamako)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 350::numeric, 'g' FROM ingredients WHERE name = 'Molasses' LIMIT 1)
UNION ALL
(SELECT id, 'block', 227::numeric, 'g' FROM ingredients WHERE name = 'Monterey Jack' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Morning Glory (Water Spinach)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 227::numeric, 'g' FROM ingredients WHERE name = 'Mozzarella (Fresh)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Mozzarella (Shredded)' LIMIT 1)
UNION ALL
(SELECT id, 'container', 150::numeric, 'g' FROM ingredients WHERE name = 'Mulberry' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Mung Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Mustard Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Mustard Powder' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 60::numeric, 'g' FROM ingredients WHERE name = 'Mustard Seeds (Yellow)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Nam Prik Pao (Roasted Chili Paste)' LIMIT 1)
UNION ALL
(SELECT id, 'head', 1000::numeric, 'g' FROM ingredients WHERE name = 'Napa Cabbage' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Navel Orange' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Navy Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Navy Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Nectarine' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 500::numeric, 'g' FROM ingredients WHERE name = 'Nian Gao (Rice Cake)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Nigella Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 1890::numeric, 'ml' FROM ingredients WHERE name = 'Non-Fat Milk' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Nopales (Cactus Paddles)' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 25::numeric, 'g' FROM ingredients WHERE name = 'Nori Sheets' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Nurungji (Scorched Rice)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 50::numeric, 'g' FROM ingredients WHERE name = 'Nutmeg (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 50::numeric, 'g' FROM ingredients WHERE name = 'Nutmeg Fruit' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 1360::numeric, 'g' FROM ingredients WHERE name = 'Oat Flour' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 1890::numeric, 'ml' FROM ingredients WHERE name = 'Oat Milk' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 300::numeric, 'g' FROM ingredients WHERE name = 'Okra' LIMIT 1)
UNION ALL
(SELECT id, 'container', 170::numeric, 'g' FROM ingredients WHERE name = 'Old Bay Seasoning' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 1000::numeric, 'ml' FROM ingredients WHERE name = 'Olive Pomace Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 80::numeric, 'g' FROM ingredients WHERE name = 'Onion Powder' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Orange Blossom Water' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Orzo' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Orzo' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Oyster Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 510::numeric, 'g' FROM ingredients WHERE name = 'Oyster Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Padrón Peppers' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Palm Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Palm Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Panch Phoron' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 60::numeric, 'ml' FROM ingredients WHERE name = 'Pandan Extract' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Pandan Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Pandan Paste' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Papaya' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 60::numeric, 'g' FROM ingredients WHERE name = 'Paprika' LIMIT 1)
UNION ALL
(SELECT id, 'wedge', 200::numeric, 'g' FROM ingredients WHERE name = 'Parmesan' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Parsnips' LIMIT 1)
UNION ALL
(SELECT id, 'count', 40::numeric, 'g' FROM ingredients WHERE name = 'Passion Fruit' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Pea Shoots' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 710::numeric, 'ml' FROM ingredients WHERE name = 'Peanut Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Peanut Sauce (Bumbu Kacang)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Peanuts' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Pecan Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Pecans' LIMIT 1)
UNION ALL
(SELECT id, 'wedge', 200::numeric, 'g' FROM ingredients WHERE name = 'Pecorino Romano' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Penne' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Penne' LIMIT 1)
UNION ALL
(SELECT id, 'block', 227::numeric, 'g' FROM ingredients WHERE name = 'Pepper Jack' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 160::numeric, 'ml' FROM ingredients WHERE name = 'Perilla Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Perilla Seeds (Deulkkae)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Persimmon (Fuyu)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 170::numeric, 'g' FROM ingredients WHERE name = 'Pesto' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Petai (Stinky Beans)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Phyllo Dough' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 300::numeric, 'g' FROM ingredients WHERE name = 'Pickled Mustard Greens (Suancai)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 400::numeric, 'g' FROM ingredients WHERE name = 'Pie Crust' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Piloncillo' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Pimentón (Hot Smoked)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Pine Nut Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Pine Nuts' LIMIT 1)
UNION ALL
(SELECT id, 'count', 1000::numeric, 'g' FROM ingredients WHERE name = 'Pineapple' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 30::numeric, 'g' FROM ingredients WHERE name = 'Pink Peppercorns' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Pinto Beans (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Pinto Beans (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'can', 185::numeric, 'g' FROM ingredients WHERE name = 'Piquillo Peppers (Roasted)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Pistachio Nuts' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Pistachio Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Plantain' LIMIT 1)
UNION ALL
(SELECT id, 'count', 65::numeric, 'g' FROM ingredients WHERE name = 'Plum' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Plum Sauce (Chinese)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Poblano Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Polenta' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 160::numeric, 'g' FROM ingredients WHERE name = 'Polenta' LIMIT 1)
UNION ALL
(SELECT id, 'count', 280::numeric, 'g' FROM ingredients WHERE name = 'Pomegranate' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Pomegranate Molasses' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Pomelo' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Ponzu Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Pork Floss' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 400::numeric, 'g' FROM ingredients WHERE name = 'Potato Starch' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 907::numeric, 'g' FROM ingredients WHERE name = 'Powdered Sugar' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 120::numeric, 'g' FROM ingredients WHERE name = 'Powdered Sugar' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'jar', 400::numeric, 'g' FROM ingredients WHERE name = 'Preserved Lemon' LIMIT 1)
UNION ALL
(SELECT id, 'can', 280::numeric, 'g' FROM ingredients WHERE name = 'Preserved Mustard Greens (Zha Cai)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Preserved Radish (Chai Poh)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Preserved Soy Bean (Tau Cheong)' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 227::numeric, 'g' FROM ingredients WHERE name = 'Provolone' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 100::numeric, 'g' FROM ingredients WHERE name = 'Pucuk Ubi (Cassava Leaves)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 482::numeric, 'g' FROM ingredients WHERE name = 'Puff Pastry' LIMIT 1)
UNION ALL
(SELECT id, 'can', 425::numeric, 'g' FROM ingredients WHERE name = 'Pumpkin Puree' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Pumpkin Seed Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Pumpkin Seeds' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Purple Yam (Ube)' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 12::numeric, 'count' FROM ingredients WHERE name = 'Quail Eggs' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Quatre Épices' LIMIT 1)
UNION ALL
(SELECT id, 'count', 250::numeric, 'g' FROM ingredients WHERE name = 'Quince' LIMIT 1)
UNION ALL
(SELECT id, 'block', 200::numeric, 'g' FROM ingredients WHERE name = 'Quince Paste (Membrillo)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Quinoa (Red)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 180::numeric, 'g' FROM ingredients WHERE name = 'Quinoa (Red)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Quinoa (White)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 180::numeric, 'g' FROM ingredients WHERE name = 'Quinoa (White)' LIMIT 1)
UNION ALL
(SELECT id, 'head', 300::numeric, 'g' FROM ingredients WHERE name = 'Radicchio' LIMIT 1)
UNION ALL
(SELECT id, 'box', 425::numeric, 'g' FROM ingredients WHERE name = 'Raisins' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 300::numeric, 'g' FROM ingredients WHERE name = 'Rambutan' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 80::numeric, 'g' FROM ingredients WHERE name = 'Ramen Noodles (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 85::numeric, 'g' FROM ingredients WHERE name = 'Ramen Noodles (Dried)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 473::numeric, 'ml' FROM ingredients WHERE name = 'Ranch Dressing' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Ras El Hanout' LIMIT 1)
UNION ALL
(SELECT id, 'container', 170::numeric, 'g' FROM ingredients WHERE name = 'Raspberry' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Raw Almonds' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Raw Hazelnuts' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 150::numeric, 'g' FROM ingredients WHERE name = 'Raw Walnuts' LIMIT 1)
UNION ALL
(SELECT id, 'head', 900::numeric, 'g' FROM ingredients WHERE name = 'Red Cabbage' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 900::numeric, 'g' FROM ingredients WHERE name = 'Red Grapes' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 500::numeric, 'g' FROM ingredients WHERE name = 'Red Miso Paste' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Red Onion' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Red Palm Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Red Potato' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 250::numeric, 'g' FROM ingredients WHERE name = 'Red Radish' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 375::numeric, 'ml' FROM ingredients WHERE name = 'Red Wine Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Red Yeast Rice (Hongqu)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Rendang Paste' LIMIT 1)
UNION ALL
(SELECT id, 'stalk', 120::numeric, 'g' FROM ingredients WHERE name = 'Rhubarb' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Rice Bran Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Rice Flour' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 158::numeric, 'g' FROM ingredients WHERE name = 'Rice Flour' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 200::numeric, 'g' FROM ingredients WHERE name = 'Rice Paper (Bánh Tráng)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 80::numeric, 'g' FROM ingredients WHERE name = 'Rice Vermicelli' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 454::numeric, 'g' FROM ingredients WHERE name = 'Rice Vermicelli' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 350::numeric, 'ml' FROM ingredients WHERE name = 'Rice Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 425::numeric, 'g' FROM ingredients WHERE name = 'Ricotta' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Rigatoni' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Rigatoni' LIMIT 1)
UNION ALL
(SELECT id, 'container', 1190::numeric, 'g' FROM ingredients WHERE name = 'Rolled Oats' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 90::numeric, 'g' FROM ingredients WHERE name = 'Rolled Oats' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Roma Tomato' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 300::numeric, 'g' FROM ingredients WHERE name = 'Romesco Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Rose Water' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Rosemary Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 300::numeric, 'g' FROM ingredients WHERE name = 'Russet Potato' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Rye Berries' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Rye Berries' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Rye Flour' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Saeujeot (Salted Fermented Shrimp)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 710::numeric, 'ml' FROM ingredients WHERE name = 'Safflower Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Saffron' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 750::numeric, 'ml' FROM ingredients WHERE name = 'Sake' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 10::numeric, 'g' FROM ingredients WHERE name = 'Salam Leaf (Indonesian Bay Leaf)' LIMIT 1)
UNION ALL
(SELECT id, 'container', 737::numeric, 'g' FROM ingredients WHERE name = 'Salt' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 6.0::numeric, 'g' FROM ingredients WHERE name = 'Salt' LIMIT 1)
UNION ALL
(SELECT id, 'stick', 113::numeric, 'g' FROM ingredients WHERE name = 'Salted Butter' LIMIT 1)
UNION ALL
(SELECT id, 'count', 70::numeric, 'g' FROM ingredients WHERE name = 'Salted Duck Egg' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 226::numeric, 'g' FROM ingredients WHERE name = 'Sambal Oelek' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Sawtooth Herb (Culantro)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Scallion Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 340::numeric, 'g' FROM ingredients WHERE name = 'Schmaltz (Chicken Fat)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 400::numeric, 'g' FROM ingredients WHERE name = 'Sea Salt (Fine)' LIMIT 1)
UNION ALL
(SELECT id, 'box', 250::numeric, 'g' FROM ingredients WHERE name = 'Sea Salt (Flaky/Maldon)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 1.5::numeric, 'g' FROM ingredients WHERE name = 'Sea Salt (Flaky/Maldon)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 2267::numeric, 'g' FROM ingredients WHERE name = 'Self-Rising Flour' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 340::numeric, 'g' FROM ingredients WHERE name = 'Semi-Sweet Chocolate Chips' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 680::numeric, 'g' FROM ingredients WHERE name = 'Semolina Flour' LIMIT 1)
UNION ALL
(SELECT id, 'count', 15::numeric, 'g' FROM ingredients WHERE name = 'Serrano Pepper' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 45::numeric, 'g' FROM ingredients WHERE name = 'Sesame Seeds (Black)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 100::numeric, 'g' FROM ingredients WHERE name = 'Sesame Seeds (White)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 3.0::numeric, 'g' FROM ingredients WHERE name = 'Sesame Seeds (White)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 180::numeric, 'g' FROM ingredients WHERE name = 'Seville Orange (Bitter Orange)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Shallot Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 40::numeric, 'g' FROM ingredients WHERE name = 'Shallots' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 750::numeric, 'ml' FROM ingredients WHERE name = 'Shaoxing Rice Wine' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 375::numeric, 'ml' FROM ingredients WHERE name = 'Sherry Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Shichimi Togarashi' LIMIT 1)
UNION ALL
(SELECT id, 'container', 150::numeric, 'g' FROM ingredients WHERE name = 'Shiitake Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 25::numeric, 'g' FROM ingredients WHERE name = 'Shiso (Perilla Leaves)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 6800::numeric, 'g' FROM ingredients WHERE name = 'Short Grain White Rice' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 190::numeric, 'g' FROM ingredients WHERE name = 'Short Grain White Rice' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 396::numeric, 'g' FROM ingredients WHERE name = 'Shredded Coconut' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Shrimp Floss' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Shrimp Paste (Kapi)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 150::numeric, 'ml' FROM ingredients WHERE name = 'Sichuan Peppercorn Oil' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Sichuan Peppercorns' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 227::numeric, 'g' FROM ingredients WHERE name = 'Slivered Almonds' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'jar', 60::numeric, 'g' FROM ingredients WHERE name = 'Smoked Paprika' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 225::numeric, 'g' FROM ingredients WHERE name = 'Snap Peas' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Snow Fungus (White Tremella)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Snow Peas' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 90::numeric, 'g' FROM ingredients WHERE name = 'Soba Noodles' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 90::numeric, 'g' FROM ingredients WHERE name = 'Soba Noodles' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 300::numeric, 'g' FROM ingredients WHERE name = 'Sofrito Base' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 375::numeric, 'ml' FROM ingredients WHERE name = 'Soju' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 680::numeric, 'g' FROM ingredients WHERE name = 'Sorghum' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 190::numeric, 'g' FROM ingredients WHERE name = 'Sorghum' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 30::numeric, 'g' FROM ingredients WHERE name = 'Sorrel' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 454::numeric, 'g' FROM ingredients WHERE name = 'Sour Cream' LIMIT 1)
UNION ALL
(SELECT id, 'count', 1500::numeric, 'g' FROM ingredients WHERE name = 'Soursop (Guanábana)' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 946::numeric, 'ml' FROM ingredients WHERE name = 'Soy Milk' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 296::numeric, 'ml' FROM ingredients WHERE name = 'Soy Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'tbsp', 15::numeric, 'ml' FROM ingredients WHERE name = 'Soy Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 500::numeric, 'ml' FROM ingredients WHERE name = 'Soy Sauce (Dark)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Soy Sauce Paste (Jiangye)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 1420::numeric, 'ml' FROM ingredients WHERE name = 'Soybean Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Soybean Sprouts' LIMIT 1)
UNION ALL
(SELECT id, 'box', 454::numeric, 'g' FROM ingredients WHERE name = 'Spaghetti' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 100::numeric, 'g' FROM ingredients WHERE name = 'Spaghetti' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Spelt Berries' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Spelt Berries' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 1360::numeric, 'g' FROM ingredients WHERE name = 'Spelt Flour' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 280::numeric, 'g' FROM ingredients WHERE name = 'Spinach' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Split Peas (Green)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Split Peas (Yellow)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 480::numeric, 'ml' FROM ingredients WHERE name = 'Sriracha' LIMIT 1)
UNION ALL
(SELECT id, 'tbsp', 15::numeric, 'ml' FROM ingredients WHERE name = 'Sriracha' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 170::numeric, 'g' FROM ingredients WHERE name = 'Ssamjang' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 50::numeric, 'g' FROM ingredients WHERE name = 'Ssuk (Korean Mugwort)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 20::numeric, 'g' FROM ingredients WHERE name = 'Star Anise (Whole)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Star Fruit (Carambola)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Steamed Fish Soy Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'container', 680::numeric, 'g' FROM ingredients WHERE name = 'Steel Cut Oats' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 150::numeric, 'g' FROM ingredients WHERE name = 'Steel Cut Oats' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 2267::numeric, 'g' FROM ingredients WHERE name = 'Sticky Rice (Glutinous)' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 190::numeric, 'g' FROM ingredients WHERE name = 'Sticky Rice (Glutinous)' LIMIT 1)
UNION ALL
(SELECT id, 'can', 400::numeric, 'g' FROM ingredients WHERE name = 'Straw Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'container', 454::numeric, 'g' FROM ingredients WHERE name = 'Strawberry' LIMIT 1)
UNION ALL
(SELECT id, 'count', 30::numeric, 'g' FROM ingredients WHERE name = 'Sudachi' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Sumac' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 250::numeric, 'g' FROM ingredients WHERE name = 'Sun-Dried Tomatoes' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 1000::numeric, 'ml' FROM ingredients WHERE name = 'Sunflower Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 300::numeric, 'ml' FROM ingredients WHERE name = 'Sweet Chili Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'count', 350::numeric, 'g' FROM ingredients WHERE name = 'Sweet Potato' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 250::numeric, 'g' FROM ingredients WHERE name = 'Swiss Chard' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 200::numeric, 'g' FROM ingredients WHERE name = 'Swiss Cheese' LIMIT 1)
UNION ALL
(SELECT id, 'lb', 453::numeric, 'g' FROM ingredients WHERE name = 'Swordfish' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 147::numeric, 'ml' FROM ingredients WHERE name = 'Tabasco' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 28::numeric, 'g' FROM ingredients WHERE name = 'Taco Seasoning' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Tahini' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Taiwan Shacha Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 300::numeric, 'ml' FROM ingredients WHERE name = 'Tamari' LIMIT 1)
UNION ALL
(SELECT id, 'block', 200::numeric, 'g' FROM ingredients WHERE name = 'Tamarind Block' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Tamarind Concentrate' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'Tamarind Paste' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 250::numeric, 'g' FROM ingredients WHERE name = 'Tapioca Pearls' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Tapioca Starch' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 300::numeric, 'g' FROM ingredients WHERE name = 'Taro Balls (Wu Yuan)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 400::numeric, 'g' FROM ingredients WHERE name = 'Taro Root' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Teff' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 150::numeric, 'g' FROM ingredients WHERE name = 'Teff' LIMIT 1)
UNION ALL
(SELECT id, 'count', 40::numeric, 'g' FROM ingredients WHERE name = 'Tejocote' LIMIT 1)
UNION ALL
(SELECT id, 'block', 50::numeric, 'g' FROM ingredients WHERE name = 'Terasi (Indonesian Shrimp Paste)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 296::numeric, 'ml' FROM ingredients WHERE name = 'Teriyaki Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 25::numeric, 'g' FROM ingredients WHERE name = 'Thai Basil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Thai Bird''s Eye Chili' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Thai Eggplant' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Toasted Rice Powder' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 166::numeric, 'ml' FROM ingredients WHERE name = 'Toasted Sesame Oil' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Tomatillo' LIMIT 1)
UNION ALL
(SELECT id, 'can', 170::numeric, 'g' FROM ingredients WHERE name = 'Tomato Paste' LIMIT 1)
UNION ALL
(SELECT id, 'can', 425::numeric, 'g' FROM ingredients WHERE name = 'Tomato Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 50::numeric, 'g' FROM ingredients WHERE name = 'Toon Leaves (Xiangchun)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 100::numeric, 'g' FROM ingredients WHERE name = 'Torch Ginger Flower (Bunga Kantan)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Trahana' LIMIT 1)
UNION ALL
(SELECT id, 'count', 25::numeric, 'g' FROM ingredients WHERE name = 'Truffle (Black)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 100::numeric, 'ml' FROM ingredients WHERE name = 'Truffle Oil (Black)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 100::numeric, 'ml' FROM ingredients WHERE name = 'Truffle Oil (White)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 500::numeric, 'g' FROM ingredients WHERE name = 'Tteok (Korean Rice Cakes)' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 65::numeric, 'g' FROM ingredients WHERE name = 'Turmeric (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 3.0::numeric, 'g' FROM ingredients WHERE name = 'Turmeric (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 20::numeric, 'g' FROM ingredients WHERE name = 'Turmeric Leaves' LIMIT 1)
UNION ALL
(SELECT id, 'count', 180::numeric, 'g' FROM ingredients WHERE name = 'Turnip' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 150::numeric, 'g' FROM ingredients WHERE name = 'Udon Noodles (Fresh)' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 200::numeric, 'g' FROM ingredients WHERE name = 'Udon Noodles (Fresh)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 20::numeric, 'g' FROM ingredients WHERE name = 'Ume (Japanese Plum)' LIMIT 1)
UNION ALL
(SELECT id, 'stick', 113::numeric, 'g' FROM ingredients WHERE name = 'Unsalted Butter' LIMIT 1)
UNION ALL
(SELECT id, 'container', 227::numeric, 'g' FROM ingredients WHERE name = 'Unsweetened Cocoa Powder' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Urfa Biber (Isot Pepper)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Valencia Orange' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 118::numeric, 'g' FROM ingredients WHERE name = 'Vanilla Bean Paste' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 59::numeric, 'ml' FROM ingredients WHERE name = 'Vanilla Extract' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 425::numeric, 'g' FROM ingredients WHERE name = 'Vegan Butter' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Vegan Shredded Cheese' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 227::numeric, 'g' FROM ingredients WHERE name = 'Vegetable Base (Better Than Bouillon)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 1420::numeric, 'ml' FROM ingredients WHERE name = 'Vegetable Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 20::numeric, 'g' FROM ingredients WHERE name = 'Vietnamese Mint (Rau Ram)' LIMIT 1)
ON CONFLICT DO NOTHING;

INSERT INTO unit_conversions (ingredient_id, input_unit, output_value, output_unit)
(SELECT id, 'bottle', 750::numeric, 'ml' FROM ingredients WHERE name = 'Virgin Olive Oil' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 50::numeric, 'g' FROM ingredients WHERE name = 'Wakame (Dried Seaweed)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 250::numeric, 'ml' FROM ingredients WHERE name = 'Walnut Oil' LIMIT 1)
UNION ALL
(SELECT id, 'container', 43::numeric, 'g' FROM ingredients WHERE name = 'Wasabi Paste' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 200::numeric, 'g' FROM ingredients WHERE name = 'Water Caltrops (Ling Jiao)' LIMIT 1)
UNION ALL
(SELECT id, 'can', 225::numeric, 'g' FROM ingredients WHERE name = 'Water Chestnuts (Canned)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 100::numeric, 'g' FROM ingredients WHERE name = 'Watercress' LIMIT 1)
UNION ALL
(SELECT id, 'count', 5000::numeric, 'g' FROM ingredients WHERE name = 'Watermelon' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 850::numeric, 'g' FROM ingredients WHERE name = 'Wheat Berries' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 200::numeric, 'g' FROM ingredients WHERE name = 'Wheat Berries' LIMIT 1)
UNION ALL
(SELECT id, 'container', 225::numeric, 'g' FROM ingredients WHERE name = 'White Button Mushroom' LIMIT 1)
UNION ALL
(SELECT id, 'tub', 500::numeric, 'g' FROM ingredients WHERE name = 'White Miso Paste' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'White Onion' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'White Peach' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 60::numeric, 'g' FROM ingredients WHERE name = 'White Pepper (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 2.5::numeric, 'g' FROM ingredients WHERE name = 'White Pepper (Ground)' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 375::numeric, 'ml' FROM ingredients WHERE name = 'White Wine Vinegar' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 35::numeric, 'g' FROM ingredients WHERE name = 'Whole Cloves' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 210::numeric, 'ml' FROM ingredients WHERE name = 'Whole Grain Mustard' LIMIT 1)
UNION ALL
(SELECT id, 'carton', 1890::numeric, 'ml' FROM ingredients WHERE name = 'Whole Milk' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 2267::numeric, 'g' FROM ingredients WHERE name = 'Whole Wheat Flour' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 80::numeric, 'g' FROM ingredients WHERE name = 'Wide Rice Noodles (Ho Fun)' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 400::numeric, 'g' FROM ingredients WHERE name = 'Wide Rice Noodles (Ho Fun)' LIMIT 1)
UNION ALL
(SELECT id, 'bag', 454::numeric, 'g' FROM ingredients WHERE name = 'Wild Rice' LIMIT 1)
UNION ALL
(SELECT id, 'cup', 160::numeric, 'g' FROM ingredients WHERE name = 'Wild Rice' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Wild Rice Stems (Jiao Bai)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 2000::numeric, 'g' FROM ingredients WHERE name = 'Winter Melon' LIMIT 1)
UNION ALL
(SELECT id, 'pack', 300::numeric, 'g' FROM ingredients WHERE name = 'Wonton Wrappers' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 150::numeric, 'ml' FROM ingredients WHERE name = 'Worcestershire Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'tsp', 5::numeric, 'ml' FROM ingredients WHERE name = 'Worcestershire Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 200::numeric, 'g' FROM ingredients WHERE name = 'XO Sauce' LIMIT 1)
UNION ALL
(SELECT id, 'bottle', 400::numeric, 'ml' FROM ingredients WHERE name = 'Yellow Mustard' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Yellow Onion' LIMIT 1)
UNION ALL
(SELECT id, 'count', 150::numeric, 'g' FROM ingredients WHERE name = 'Yellow Peach' LIMIT 1)
UNION ALL
(SELECT id, 'count', 500::numeric, 'g' FROM ingredients WHERE name = 'Young Coconut' LIMIT 1)
UNION ALL
(SELECT id, 'bunch', 200::numeric, 'g' FROM ingredients WHERE name = 'Yu Choy (Chinese Flowering Cabbage)' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Yukon Gold Potato' LIMIT 1)
UNION ALL
(SELECT id, 'count', 80::numeric, 'g' FROM ingredients WHERE name = 'Yuzu' LIMIT 1)
UNION ALL
(SELECT id, 'jar', 40::numeric, 'g' FROM ingredients WHERE name = 'Za''atar' LIMIT 1)
UNION ALL
(SELECT id, 'count', 200::numeric, 'g' FROM ingredients WHERE name = 'Zucchini' LIMIT 1)
ON CONFLICT DO NOTHING;
