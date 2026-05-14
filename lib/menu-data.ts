/**
 * Shehnai Resort — Restaurant Full Menu
 *
 * Single source of truth for all menu items shown on /restaurant/menu.
 * Prices are in INR. `priceHalf` / `priceFull` are used for portions that
 * are served as Half / Full plates (typical for chicken & mutton curries).
 */

export type MenuItem = {
  name: string;
  price?: number;       // single-portion items
  priceHalf?: number;   // optional half portion
  priceFull?: number;   // optional full portion
  note?: string;        // e.g. "(2 pcs)"
  veg?: boolean;        // green/red dot indicator
};

export type MenuCategory = {
  id: string;           // slug used for in-page anchor links
  title: string;        // section heading
  subtitle?: string;    // small italic descriptor under the heading
  items: MenuItem[];
};

export const menuSections: MenuCategory[] = [
  {
    id: "soups",
    title: "Soups",
    subtitle: "A warm beginning to your meal",
    items: [
      { name: "Hot & Sour Veg Soup", price: 80, veg: true },
      { name: "Veg Manchow Soup", price: 90, veg: true },
      { name: "Lemon Coriander Soup", price: 110, veg: true },
      { name: "Hot & Sour Chicken Soup", price: 110, veg: false },
      { name: "Chicken Manchow Soup", price: 120, veg: false },
    ],
  },
  {
    id: "tandoor",
    title: "Tandoor Snacks",
    subtitle: "From the live charcoal grill",
    items: [
      { name: "Paneer Achaari Tikka", priceFull: 199, veg: true },
      { name: "Paneer Tikka", priceFull: 199, veg: true },
      { name: "Paneer Hariyali Tikka", priceFull: 199, veg: true },
      { name: "Paneer Afghani Tikka", priceFull: 199, veg: true },
      { name: "Tandoori Soya Chaap", priceFull: 199, veg: true },
      { name: "Afghani Chaap", priceFull: 199, veg: true },
      { name: "Mushroom Tikka", priceFull: 210, veg: true },
      { name: "Chicken Tikka", priceFull: 250, veg: false },
      { name: "Lemon Chicken Tikka", priceFull: 250, veg: false },
      { name: "Achari Chicken Tikka", priceFull: 239, veg: false },
      { name: "Tandoori Chicken", priceHalf: 320, priceFull: 599, veg: false },
    ],
  },
  {
    id: "rolls-momos",
    title: "Rolls & Momos",
    subtitle: "Hand-rolled, freshly steamed",
    items: [
      { name: "Veg Roll", price: 99, veg: true },
      { name: "Paneer Roll", price: 130, veg: true },
      { name: "Egg Roll", price: 150, veg: false },
      { name: "Chicken Roll", price: 179, veg: false },
      { name: "Veg Momos", price: 99, veg: true },
      { name: "Paneer Momos", price: 111, veg: true },
      { name: "Sweet Corn Momos", price: 139, veg: true },
      { name: "Chicken Momos", price: 149, veg: false },
    ],
  },
  {
    id: "main-veg",
    title: "Main Course — Vegetarian",
    subtitle: "Slow-cooked curries from our kitchen",
    items: [
      { name: "Paneer Bhuna Masala", price: 199, veg: true },
      { name: "Paneer Masala", price: 199, veg: true },
      { name: "Paneer Do Pyaza", price: 199, veg: true },
      { name: "Paneer Butter Masala", price: 210, veg: true },
      { name: "Paneer Tikka Masala", price: 220, veg: true },
      { name: "Shahi Paneer", price: 240, veg: true },
      { name: "Paneer Kadhi", price: 199, veg: true },
      { name: "Paneer Chatpatta", price: 199, veg: true },
      { name: "Paneer Lababdar", price: 199, veg: true },
      { name: "Matar Paneer", price: 199, veg: true },
      { name: "Paneer Baby Corn Masala", price: 240, veg: true },
      { name: "Matar Methi Malai", price: 199, veg: true },
      { name: "Malai Kofta", price: 240, veg: true },
      { name: "Veg Kofta", price: 180, veg: true },
      { name: "Mix Veg", price: 150, veg: true },
      { name: "Veg Makhan Wala", price: 199, veg: true },
      { name: "Mushroom Masala", price: 199, veg: true },
      { name: "Mushroom Kadhai", price: 199, veg: true },
      { name: "Mushroom Do Pyaza", price: 199, veg: true },
      { name: "Soya Chaap Masala", price: 190, veg: true },
      { name: "Kadhai Chaap Masala", price: 190, veg: true },
      { name: "Chaap Butter Masala", price: 190, veg: true },
      { name: "Chaap Do Pyaza", price: 190, veg: true },
    ],
  },
  {
    id: "chicken",
    title: "Chicken",
    subtitle: "Choose Half or Full portion",
    items: [
      { name: "Chicken Butter Masala", priceHalf: 175, priceFull: 290, veg: false },
      { name: "Murg Mussallam", priceHalf: 220, priceFull: 390, veg: false },
      { name: "Chicken Do Pyaza", priceHalf: 180, priceFull: 290, veg: false },
      { name: "Chicken Kadhai", priceHalf: 200, priceFull: 320, veg: false },
      { name: "Chicken Curry", priceHalf: 175, priceFull: 290, veg: false },
      { name: "Chicken Lababdar", priceHalf: 175, priceFull: 290, veg: false },
      { name: "Chicken Rara", priceHalf: 220, priceFull: 390, veg: false },
      { name: "Chicken Keema", priceFull: 200, veg: false },
      { name: "Chicken Kosa", priceHalf: 175, priceFull: 290, veg: false },
      { name: "Chicken Stew", priceHalf: 175, priceFull: 290, veg: false },
      { name: "Chicken Masala", priceHalf: 190, priceFull: 320, veg: false },
      { name: "Chicken Korma", priceHalf: 190, priceFull: 320, veg: false },
      { name: "Chicken Chatkara", priceHalf: 190, priceFull: 320, veg: false },
      { name: "Chicken Handi", priceHalf: 190, priceFull: 320, veg: false },
      { name: "Chicken Tikka Masala", priceHalf: 190, priceFull: 320, veg: false },
    ],
  },
  {
    id: "mutton",
    title: "Mutton",
    subtitle: "Choose Half or Full portion",
    items: [
      { name: "Mutton Rogan Josh", priceHalf: 260, priceFull: 420, veg: false },
      { name: "Mutton Bhunna Masala", priceHalf: 230, priceFull: 400, veg: false },
      { name: "Dehati Mutton", priceHalf: 200, priceFull: 390, veg: false },
    ],
  },
  {
    id: "egg",
    title: "Egg",
    items: [
      { name: "Egg Curry", note: "2 pcs", price: 110, veg: false },
      { name: "Egg Masala", note: "2 pcs", price: 120, veg: false },
      { name: "Egg Do Pyaza", note: "2 pcs", price: 140, veg: false },
    ],
  },
  {
    id: "indo-chinese",
    title: "Indo-Chinese",
    subtitle: "Gravies & noodles wok-tossed to order",
    items: [
      { name: "Veg Manchurian Gravy", price: 160, veg: true },
      { name: "Paneer Chilli Gravy", price: 180, veg: true },
      { name: "Paneer Manchurian Gravy", price: 190, veg: true },
      { name: "Mushroom Chilli Gravy", price: 199, veg: true },
      { name: "Veg Hakka Noodles", price: 99, veg: true },
      { name: "Veg Chowmein", price: 95, veg: true },
      { name: "Chilli Garlic Veg Noodles", price: 99, veg: true },
      { name: "Egg Noodles", price: 120, veg: false },
      { name: "Chicken Noodles", price: 120, veg: false },
      { name: "Chicken Hakka Noodles", price: 130, veg: false },
      { name: "Chicken Garlic Noodles", price: 130, veg: false },
      { name: "Chicken Schezwan Gravy", price: 190, veg: false },
      { name: "Black Pepper Chicken Gravy", price: 190, veg: false },
      { name: "Chicken Chilli Boneless Gravy", price: 225, veg: false },
      { name: "Garlic Chicken Gravy", price: 210, veg: false },
      { name: "Chicken Lollipop", note: "6 pcs", price: 299, veg: false },
    ],
  },
  {
    id: "biryani-rice",
    title: "Biryani & Rice",
    subtitle: "Long-grain basmati, slow-cooked",
    items: [
      { name: "Steam Rice", price: 80, veg: true },
      { name: "Jeera Rice", price: 100, veg: true },
      { name: "Ghee Rice", price: 120, veg: true },
      { name: "Veg Fry Rice", price: 140, veg: true },
      { name: "Paneer Fry Rice", price: 140, veg: true },
      { name: "Kashmiri Pulao", price: 140, veg: true },
      { name: "Paneer Pulao", price: 140, veg: true },
      { name: "Veg Biryani", price: 160, veg: true },
      { name: "Paneer Veg Biryani", price: 170, veg: true },
      { name: "Egg Fried Rice", price: 120, veg: false },
      { name: "Egg Biryani", note: "2 eggs", price: 130, veg: false },
      { name: "Chicken Fried Rice", price: 170, veg: false },
      { name: "Chicken Garlic Fried Rice", price: 170, veg: false },
      { name: "Chicken Mushroom Fried Rice", price: 180, veg: false },
      { name: "Chicken Biryani", note: "2 pcs", price: 180, veg: false },
      { name: "Chicken Hyderabadi Biryani", note: "2 pcs", price: 240, veg: false },
      { name: "Mutton Biryani", note: "2 pcs", price: 240, veg: false },
    ],
  },
  {
    id: "dal",
    title: "Dal",
    items: [
      { name: "Dal Fry", price: 120, veg: true },
      { name: "Dal Tadka", price: 140, veg: true },
      { name: "Dal Punjabi Tadka", price: 120, veg: true },
      { name: "Dal Makhani", price: 170, veg: true },
    ],
  },
  {
    id: "breads",
    title: "Breads",
    subtitle: "Fresh from the tandoor",
    items: [
      { name: "Tawa Roti", price: 15, veg: true },
      { name: "Tandoori Roti", price: 25, veg: true },
      { name: "Butter Tandoori Roti", price: 30, veg: true },
      { name: "Mirchi Butter Tandoori Roti", price: 30, veg: true },
      { name: "Roomali Roti", price: 30, veg: true },
      { name: "Plain Naan", price: 40, veg: true },
      { name: "Butter Naan", price: 40, veg: true },
      { name: "Lacha Paratha", price: 40, veg: true },
      { name: "Garlic Naan", price: 50, veg: true },
      { name: "Aloo Paratha", price: 50, veg: true },
      { name: "Sattu Paratha", price: 50, veg: true },
      { name: "Paneer Paratha", price: 70, veg: true },
      { name: "Chicken Keema Naan", price: 100, veg: false },
    ],
  },
  {
    id: "sides",
    title: "Salads, Raita & Papad",
    subtitle: "The perfect accompaniments",
    items: [
      { name: "Green Salad", price: 50, veg: true },
      { name: "Family Salad", price: 80, veg: true },
      { name: "Veg Raita", price: 50, veg: true },
      { name: "Boondi Raita", price: 50, veg: true },
      { name: "Roasted Papad", price: 20, veg: true },
      { name: "Masala Papad", price: 20, veg: true },
      { name: "Fried Papad", price: 40, veg: true },
    ],
  },
  {
    id: "beverages",
    title: "Hot Beverages",
    items: [
      { name: "Tea", price: 40, veg: true },
      { name: "Coffee", price: 50, veg: true },
    ],
  },
  {
    id: "mocktails",
    title: "Mocktails",
    subtitle: "Refreshing, artfully crafted",
    items: [
      { name: "Mint Mojito", price: 125, veg: true },
      { name: "Green Mint Mojito", price: 135, veg: true },
      { name: "Green Apple Mojito", price: 140, veg: true },
      { name: "Blue Sky", price: 130, veg: true },
      { name: "Watermelon Cooler", price: 129, veg: true },
      { name: "Piña Colada", price: 150, veg: true },
    ],
  },
  {
    id: "shakes",
    title: "Shakes",
    subtitle: "Thick, indulgent, and made fresh",
    items: [
      { name: "Strawberry Shake", price: 110, veg: true },
      { name: "Butterscotch Shake", price: 120, veg: true },
      { name: "Mango Shake", price: 130, veg: true },
      { name: "Pineapple Shake", price: 130, veg: true },
      { name: "Oreo Shake", price: 135, veg: true },
      { name: "Kiwi Shake", price: 140, veg: true },
      { name: "KitKat Shake", price: 140, veg: true },
      { name: "Banana Shake", price: 160, veg: true },
      { name: "Shehnai Special", price: 125, veg: true },
    ],
  },
];
