// Common utility functions for both admin and customer views

// Key for localStorage
const STORAGE_KEY = 'retailer-shop-items';
const BASKET_KEY = 'retailer-shop-basket';

// Load items from localStorage or initialize empty array
function loadItems() {
  const itemsJson = localStorage.getItem(STORAGE_KEY);
  if (itemsJson) {
    try {
      return JSON.parse(itemsJson);
    } catch (e) {
      console.error('Error parsing items from localStorage', e);
      return [];
    }
  }
  return [];
}

// Save items to localStorage
function saveItems(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

// Load basket from localStorage or initialize empty object
function loadBasket() {
  const basketJson = localStorage.getItem(BASKET_KEY);
  if (basketJson) {
    try {
      return JSON.parse(basketJson);
    } catch (e) {
      console.error('Error parsing basket from localStorage', e);
      return {};
    }
  }
  return {};
}

// Save basket to localStorage
function saveBasket(basket) {
  localStorage.setItem(BASKET_KEY, JSON.stringify(basket));
}

function createCustomerItemCard(item) {
  const div = document.createElement('div');
  div.className = 'bg-white p-4 rounded shadow flex flex-col justify-between';

  const name = document.createElement('h3');
  name.className = 'text-lg font-semibold mb-2';
  name.textContent = item.name;
  div.appendChild(name);

  const quantity = document.createElement('p');
  quantity.className = 'mb-4';
  quantity.textContent = `Quantity left: ${item.quantity}`;
  div.appendChild(quantity);

  const basket = loadBasket();
  const basketQty = basket[item.id] || 0;

  if (basketQty > 0) {
    const qtyContainer = document.createElement('div');
    qtyContainer.className = 'flex items-center space-x-2';

    const qtyLabel = document.createElement('span');
    qtyLabel.className = 'text-green-700 font-semibold';
    qtyLabel.textContent = 'Quantity in Basket:';
    qtyContainer.appendChild(qtyLabel);

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = 1;
    qtyInput.max = item.quantity;
    qtyInput.value = basketQty;
    qtyInput.className = 'border border-gray-300 rounded px-2 py-1 w-20';
    qtyInput.addEventListener('change', (e) => {
      const newQty = parseInt(e.target.value);
      if (isNaN(newQty) || newQty < 1) {
        e.target.value = basketQty;
        return;
      }
      if (newQty > item.quantity) {
        alert('Quantity exceeds available stock.');
        e.target.value = basketQty;
        return;
      }
      updateBasketQuantity(item.id, newQty);
    });
    qtyContainer.appendChild(qtyInput);

    div.appendChild(qtyContainer);
  } else {
    const addToBasketBtn = document.createElement('button');
    addToBasketBtn.textContent = 'Add to Basket';
    addToBasketBtn.className = 'bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:opacity-50';
    addToBasketBtn.disabled = item.quantity === 0;
    addToBasketBtn.addEventListener('click', () => {
      addToBasket(item.id);
    });
    div.appendChild(addToBasketBtn);
  }

  return div;
}

function addToBasket(itemId) {
  const items = loadItems();
  const item = items.find(i => i.id === itemId);
  if (!item) {
    alert('Item not found.');
    return;
  }
  if (item.quantity === 0) {
    alert('Item is out of stock.');
    return;
  }
  const basket = loadBasket();
  if (basket[itemId]) {
    if (basket[itemId] < item.quantity) {
      basket[itemId]++;
    } else {
      alert('You have reached the maximum available quantity for this item.');
      return;
    }
  } else {
    basket[itemId] = 1;
  }
  saveBasket(basket);
  renderBasket();
  renderCustomerItems(); // Re-render items list to update quantity display immediately
}

// Remove item from basket
function removeFromBasket(itemId) {
  const basket = loadBasket();
  if (basket[itemId]) {
    delete basket[itemId];
    saveBasket(basket);
    renderBasket();
  }
}

// Update basket item quantity
function updateBasketQuantity(itemId, quantity) {
  const items = loadItems();
  const item = items.find(i => i.id === itemId);
  if (!item) {
    alert('Item not found.');
    return;
  }
  if (quantity < 1) {
    removeFromBasket(itemId);
    return;
  }
  if (quantity > item.quantity) {
    alert('Quantity exceeds available stock.');
    return;
  }
  const basket = loadBasket();
  basket[itemId] = quantity;
  saveBasket(basket);
  renderBasket();
}

// Render basket items on customer page
function renderBasket() {
  const container = document.getElementById('basket-list');
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (!container || !placeOrderBtn) return;
  container.innerHTML = '';
  const basket = loadBasket();
  const items = loadItems();
  const basketItemIds = Object.keys(basket);
  if (basketItemIds.length === 0) {
    container.textContent = 'Your basket is empty.';
    placeOrderBtn.disabled = true;
    return;
  }
  placeOrderBtn.disabled = false;
  basketItemIds.forEach(itemId => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const quantity = basket[itemId];

    const div = document.createElement('div');
    div.className = 'bg-white p-3 rounded shadow flex justify-between items-center';

    const nameQty = document.createElement('div');
    nameQty.innerHTML = `<strong>${item.name}</strong> - Quantity: `;
    div.appendChild(nameQty);

    const qtyInput = document.createElement('input');
    qtyInput.type = 'number';
    qtyInput.min = 1;
    qtyInput.max = item.quantity;
    qtyInput.value = quantity;
    qtyInput.className = 'border border-gray-300 rounded px-2 py-1 w-20 mr-3';
    qtyInput.addEventListener('change', (e) => {
      const newQty = parseInt(e.target.value);
      if (isNaN(newQty)) return;
      updateBasketQuantity(itemId, newQty);
    });
    div.appendChild(qtyInput);

    const removeBtn = document.createElement('button');
    removeBtn.innerHTML = '<i class="fas fa-trash"></i>';
    removeBtn.className = 'text-red-600 hover:text-red-800';
    removeBtn.title = 'Remove from basket';
    removeBtn.addEventListener('click', () => {
      removeFromBasket(itemId);
    });
    div.appendChild(removeBtn);

    container.appendChild(div);
  });
}

const ORDERS_KEY = 'retailer-shop-orders';

function placeOrder(userDetails) {
  console.log('placeOrder called with userDetails:', userDetails);
  const basket = loadBasket();
  if (Object.keys(basket).length === 0) {
    alert('Your basket is empty.');
    return false;
  }
  const items = loadItems();
  for (const itemId in basket) {
    const item = items.find(i => i.id === itemId);
    if (!item) {
      alert('Item not found.');
      return false;
    }
    const orderQty = basket[itemId];
    if (orderQty > item.quantity) {
      alert(`Order quantity for ${item.name} exceeds available stock.`);
      return false;
    }
  }
  // Deduct quantities
  for (const itemId in basket) {
    const item = items.find(i => i.id === itemId);
    item.quantity -= basket[itemId];
  }
  saveItems(items);

  // Save order with user details
  const ordersJson = localStorage.getItem(ORDERS_KEY);
  let orders = [];
  if (ordersJson) {
    try {
      orders = JSON.parse(ordersJson);
    } catch (e) {
      console.error('Error parsing orders from localStorage', e);
    }
  }
  const newOrder = {
    id: Date.now().toString(),
    userDetails,
    items: Object.entries(basket).map(([itemId, quantity]) => {
      const item = items.find(i => i.id === itemId);
      return {
        id: itemId,
        name: item ? item.name : 'Unknown',
        quantity,
      };
    }),
    date: new Date().toISOString(),
    delivered: false,
  };
  orders.push(newOrder);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));

  saveBasket({});
  alert('Order placed successfully.');
  renderCustomerItems();
  renderBasket();
  renderAdminItems();
  renderNotifications();
  return true;
}

// Load orders from localStorage
function loadOrders() {
  const ordersJson = localStorage.getItem(ORDERS_KEY);
  if (ordersJson) {
    try {
      return JSON.parse(ordersJson);
    } catch (e) {
      console.error('Error parsing orders from localStorage', e);
      return [];
    }
  }
  return [];
}

// Save orders to localStorage
function saveOrders(orders) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

// Debug function to log orders from localStorage
function debugLogOrders() {
  const ordersJson = localStorage.getItem('retailer-shop-orders');
  if (!ordersJson) {
    console.log('No orders found in localStorage.');
    return;
  }
  try {
    const orders = JSON.parse(ordersJson);
    console.log('Orders in localStorage:', orders);
  } catch (e) {
    console.error('Error parsing orders from localStorage:', e);
  }
}

// Render orders on orders.html
function renderOrders() {
  console.log('renderOrders called');
  const container = document.getElementById('orders-list');
  if (!container) {
    console.error('orders-list container not found');
    return;
  }
  container.innerHTML = '';
  const orders = loadOrders();
  console.log('Loaded orders:', orders);
  if (orders.length === 0) {
    container.textContent = 'No orders placed yet.';
    return;
  }
  orders.forEach(order => {
    const orderDiv = document.createElement('div');
    orderDiv.className = 'bg-white p-4 rounded shadow space-y-2';

    const header = document.createElement('div');
    header.className = 'flex justify-between items-center';

    const orderId = document.createElement('h3');
    orderId.className = 'text-lg font-semibold';
    orderId.textContent = `Order ID: ${order.id}`;
    header.appendChild(orderId);

    const date = document.createElement('span');
    date.className = 'text-sm text-gray-600';
    date.textContent = new Date(order.date).toLocaleString();
    header.appendChild(date);

    orderDiv.appendChild(header);

    const userDetails = document.createElement('div');
    userDetails.innerHTML = `
      <p><strong>Name:</strong> ${order.userDetails?.name || 'N/A'}</p>
      <p><strong>Address:</strong> ${order.userDetails?.address || 'N/A'}</p>
      <p><strong>Phone:</strong> ${order.userDetails?.phone || 'N/A'}</p>
    `;
    orderDiv.appendChild(userDetails);

    const itemsList = document.createElement('ul');
    itemsList.className = 'list-disc list-inside';
    order.items.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} - Quantity: ${item.quantity}`;
      itemsList.appendChild(li);
    });
    orderDiv.appendChild(itemsList);

    const status = document.createElement('p');
    status.textContent = `Status: ${order.delivered ? 'Delivered' : 'Pending'}`;
    status.className = order.delivered ? 'text-green-600 font-semibold' : 'text-yellow-600 font-semibold';
    orderDiv.appendChild(status);

    const actions = document.createElement('div');
    actions.className = 'space-x-2';

    if (!order.delivered) {
      const markDeliveredBtn = document.createElement('button');
      markDeliveredBtn.textContent = 'Mark as Delivered';
      markDeliveredBtn.className = 'bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700';
      markDeliveredBtn.addEventListener('click', () => {
        order.delivered = true;
        saveOrders(orders);
        renderOrders();
      });
      actions.appendChild(markDeliveredBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete Order';
    deleteBtn.className = 'bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700';
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete this order?')) {
        const index = orders.findIndex(o => o.id === order.id);
        if (index !== -1) {
          orders.splice(index, 1);
          saveOrders(orders);
          renderOrders();
        }
      }
    });
    actions.appendChild(deleteBtn);

    orderDiv.appendChild(actions);

    container.appendChild(orderDiv);
  });
}

// Render items on customer page with search filter
function renderCustomerItems() {
  const container = document.getElementById('items-list');
  if (!container) return;
  container.innerHTML = '';
  const items = loadItems();
  if (items.length === 0) {
    container.textContent = 'No items available.';
    return;
  }
  const searchInput = document.getElementById('search-input');
  const filter = searchInput ? searchInput.value.toLowerCase() : '';
  const filteredItems = items.filter(item => item.name.toLowerCase().includes(filter));
  if (filteredItems.length === 0) {
    container.textContent = 'No items match your search.';
    return;
  }
  filteredItems.forEach(item => {
    const card = createCustomerItemCard(item);
    container.appendChild(card);
  });
}

// Admin view: create item element
function createAdminItemElement(item) {
  const div = document.createElement('div');
  div.className = 'bg-white p-3 rounded shadow flex justify-between items-center';

  const nameQty = document.createElement('div');
  nameQty.innerHTML = `<strong>${item.name}</strong> - Quantity: ${item.quantity}`;
  div.appendChild(nameQty);

  const deleteBtn = document.createElement('button');
  deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
  deleteBtn.className = 'text-red-600 hover:text-red-800';
  deleteBtn.title = 'Delete item';
  deleteBtn.addEventListener('click', () => {
    if (confirm(`Delete item "${item.name}"?`)) {
      deleteItem(item.id);
    }
  });
  div.appendChild(deleteBtn);

  return div;
}

// Render items on admin page
function renderAdminItems() {
  const container = document.getElementById('admin-items-list');
  if (!container) return;
  container.innerHTML = '';
  const items = loadItems();
  if (items.length === 0) {
    container.textContent = 'No items added yet.';
    return;
  }
  items.forEach(item => {
    const elem = createAdminItemElement(item);
    container.appendChild(elem);
  });
}

// Render notifications for out-of-stock items on admin page
function renderNotifications() {
  const notificationList = document.getElementById('notification-list');
  const noNotifications = document.getElementById('no-notifications');
  if (!notificationList || !noNotifications) return;
  notificationList.innerHTML = '';
  const items = loadItems();
  const outOfStockItems = items.filter(item => item.quantity === 0);
  if (outOfStockItems.length === 0) {
    noNotifications.style.display = 'block';
    notificationList.style.display = 'none';
  } else {
    noNotifications.style.display = 'none';
    notificationList.style.display = 'block';
    outOfStockItems.forEach(item => {
      const li = document.createElement('li');
      li.textContent = `${item.name} is out of stock!`;
      notificationList.appendChild(li);
    });
  }
}

// Add or update item
function addOrUpdateItem(name, quantity) {
  const items = loadItems();
  const existingItem = items.find(i => i.name.toLowerCase() === name.toLowerCase());
  if (existingItem) {
    existingItem.quantity = quantity;
  } else {
    const newItem = {
      id: Date.now().toString(),
      name,
      quantity
    };
    items.push(newItem);
  }
  saveItems(items);
  renderAdminItems();
  renderNotifications();
}

// Delete item by id
function deleteItem(itemId) {
  let items = loadItems();
  items = items.filter(i => i.id !== itemId);
  saveItems(items);
  renderAdminItems();
  renderNotifications();
}

// Setup admin form event listener
function setupAdminForm() {
  const form = document.getElementById('add-item-form');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('item-name');
    const quantityInput = document.getElementById('item-quantity');
    const name = nameInput.value.trim();
    const quantity = parseInt(quantityInput.value);
    if (!name) {
      alert('Item name is required.');
      return;
    }
    if (isNaN(quantity) || quantity < 0) {
      alert('Quantity must be a non-negative number.');
      return;
    }
    addOrUpdateItem(name, quantity);
    form.reset();
  });
}

// Setup search input event listener
function setupSearchInput() {
  const searchInput = document.getElementById('search-input');
  if (!searchInput) return;
  searchInput.addEventListener('input', () => {
    renderCustomerItems();
  });
}

// Setup place order button event listener
function setupPlaceOrderButton() {
  const placeOrderBtn = document.getElementById('place-order-btn');
  if (!placeOrderBtn) return;
  placeOrderBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to place the order?')) {
      // Collect user details from form
      const nameInput = document.getElementById('user-name');
      const addressInput = document.getElementById('user-address');
      const phoneInput = document.getElementById('user-phone');
      const successMsg = document.getElementById('order-success-msg');
      if (!nameInput.value.trim() || !addressInput.value.trim() || !phoneInput.value.trim()) {
        alert('Please fill in all delivery details.');
        return;
      }
      const userDetails = {
        name: nameInput.value.trim(),
        address: addressInput.value.trim(),
        phone: phoneInput.value.trim(),
      };
      const success = placeOrder(userDetails);
      if (success) {
        // Reset form
        nameInput.value = '';
        addressInput.value = '';
        phoneInput.value = '';
        if (successMsg) {
          successMsg.classList.remove('hidden');
        }
      }
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('add-item-form')) {
    // Admin page
    renderAdminItems();
    renderNotifications();
    setupAdminForm();
  }
  if (document.getElementById('items-list')) {
    // Customer page (index.html)
    renderCustomerItems();
    setupSearchInput();
  }
  if (document.getElementById('basket-list') && !document.getElementById('items-list')) {
    // Place order page (placeorder.html)
    renderBasket();
    setupPlaceOrderButton();
  }
  if (document.getElementById('orders-list')) {
    // Orders page (orders.html)
    renderOrders();
  }
});
