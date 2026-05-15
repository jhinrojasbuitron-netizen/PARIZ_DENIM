// ============================================
// PARIZ DENIM - SCRIPT PRINCIPAL COMPLETO
// ============================================

let cart = [];
let products = [];
let currentFilter = 'todos';

// ========== CARRITO ==========
function cargarCarrito() {
    const guardado = localStorage.getItem('pariz_carrito');
    if (guardado) { cart = JSON.parse(guardado); actualizarCarrito(); }
}

function guardarCarrito() {
    localStorage.setItem('pariz_carrito', JSON.stringify(cart));
}

function actualizarCarrito() {
    const cartCount = document.getElementById('cartCount');
    const cartItemsDiv = document.getElementById('cartItems');
    const cartTotalSpan = document.getElementById('cartTotal');
    const totalItems = cart.reduce((sum, item) => sum + item.cantidad, 0);
    if (cartCount) cartCount.textContent = totalItems;
    if (cart.length === 0) {
        if (cartItemsDiv) cartItemsDiv.innerHTML = '<div class="empty-cart"><i class="fas fa-shopping-cart"></i><p>Tu carrito está vacío</p></div>';
        if (cartTotalSpan) cartTotalSpan.textContent = 'S/ 0.00';
        return;
    }
    let itemsHtml = '', total = 0;
    for (let i = 0; i < cart.length; i++) {
        const item = cart[i];
        total += item.precio * item.cantidad;
        itemsHtml += `<div class="cart-item" data-index="${i}"><div class="cart-item-img">${item.imagen ? `<img src="${item.imagen}" alt="${item.nombre}" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" onerror="this.innerHTML='<i class=\'fas fa-tshirt\'></i>'">` : '<i class="fas fa-tshirt"></i>'}</div>
        <div class="cart-item-info"><h4>${item.nombre}</h4><p class="cart-item-detail">Talla: ${item.talla} | Color: ${item.color}</p><p class="cart-item-price">S/ ${item.precio.toFixed(2)}</p><div class="cart-item-quantity"><button class="cart-qty-btn cart-minus" data-index="${i}">−</button><span>${item.cantidad}</span><button class="cart-qty-btn cart-plus" data-index="${i}">+</button></div></div><button class="cart-remove" data-index="${i}"><i class="fas fa-trash-alt"></i></button></div>`;
    }
    if (cartItemsDiv) cartItemsDiv.innerHTML = itemsHtml;
    if (cartTotalSpan) cartTotalSpan.textContent = `S/ ${total.toFixed(2)}`;
    document.querySelectorAll('.cart-minus').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); cambiarCantidadCarrito(parseInt(btn.dataset.index), -1); }; });
    document.querySelectorAll('.cart-plus').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); cambiarCantidadCarrito(parseInt(btn.dataset.index), 1); }; });
    document.querySelectorAll('.cart-remove').forEach(btn => { btn.onclick = (e) => { e.stopPropagation(); eliminarDelCarrito(parseInt(btn.dataset.index)); }; });
}

function cambiarCantidadCarrito(index, cambio) {
    if (index < 0 || index >= cart.length) return;
    const item = cart[index];
    const nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad > 0 && nuevaCantidad <= item.stock) {
        item.cantidad = nuevaCantidad; actualizarCarrito(); guardarCarrito();
        mostrarToast(`${item.nombre} cantidad: ${nuevaCantidad}`);
    } else if (nuevaCantidad > item.stock) { mostrarToast('Stock insuficiente', 'error'); }
    else if (nuevaCantidad === 0) { eliminarDelCarrito(index); }
}

function eliminarDelCarrito(index) {
    if (index < 0 || index >= cart.length) return;
    const item = cart[index]; cart.splice(index, 1);
    actualizarCarrito(); guardarCarrito();
    mostrarToast(`${item.nombre} eliminado`);
}

// ========== PRODUCTOS ==========
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    grid.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Cargando productos...</div>';
    try {
        const response = await fetch('php/obtener_productos.php');
        const data = await response.json();
        if (data.error) { grid.innerHTML = '<p style="text-align:center;padding:40px;">Error al cargar productos</p>'; return; }
        products = data;
        mostrarProductos();
    } catch (error) { grid.innerHTML = '<p style="text-align:center;padding:40px;">Error al conectar con el servidor</p>'; }
}

function mostrarProductos() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    let filtrados = products;
    if (currentFilter !== 'todos') filtrados = products.filter(p => p.categoria === currentFilter);
    if (filtrados.length === 0) { grid.innerHTML = '<p style="text-align:center;padding:40px;">No hay productos en esta categoría</p>'; return; }
    let html = '';
    for (const p of filtrados) {
        html += `
            <div class="product-card" onclick="window.location.href='producto_detalle.html?id=${p.id_prenda}'" style="cursor:pointer;">
                <div class="product-img">
                    ${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;" onerror="this.innerHTML='<i class=\'fas fa-tshirt\' style=\'font-size:80px;color:#d4b8b0;\'></i>'">` : '<i class="fas fa-tshirt"></i>'}
                    ${p.stock < 10 ? '<span class="product-tag">¡Últimas!</span>' : ''}
                </div>
                <div class="product-info"><h3>${p.nombre}</h3><p class="product-category">${p.categoria}</p><p class="product-price">S/ ${parseFloat(p.precio).toFixed(2)}</p><p class="product-stock">Stock: ${p.stock}</p><button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarrito(${p.id_prenda})">🛒 Agregar</button></div>
            </div>`;
    }
    grid.innerHTML = html;
}

function agregarAlCarrito(id) {
    const producto = products.find(p => p.id_prenda == id);
    if (!producto) { mostrarToast('Producto no encontrado', 'error'); return; }
    if (producto.stock <= 0) { mostrarToast('Producto agotado', 'error'); return; }
    const tallas = producto.tallas ? producto.tallas.split(',') : ['S','M','L','XL'];
    const colores = producto.colores ? producto.colores.split(',') : ['Negro','Blanco','Beige'];
    const talla = tallas[0].trim(); const color = colores[0].trim();
    const existente = cart.find(item => item.id == id && item.talla === talla && item.color === color);
    if (existente) {
        if (existente.cantidad < producto.stock) { existente.cantidad++; mostrarToast(`+1 ${producto.nombre}`); }
        else { mostrarToast('Stock insuficiente', 'error'); return; }
    } else {
        cart.push({ id: producto.id_prenda, nombre: producto.nombre, precio: parseFloat(producto.precio), cantidad: 1, talla, color, stock: producto.stock, imagen: producto.imagen_url || '' });
        mostrarToast(`${producto.nombre} agregado`);
    }
    actualizarCarrito(); guardarCarrito();
}

// ========== UI ==========
function abrirCarrito() { const s = document.getElementById('cartSidebar'); if (s) s.classList.add('active'); }
function cerrarCarrito() { const s = document.getElementById('cartSidebar'); if (s) s.classList.remove('active'); }

function mostrarToast(mensaje, tipo = 'success') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = mensaje; toast.className = 'toast toast-show';
    toast.style.background = tipo === 'success' ? '#28a745' : '#dc3545';
    clearTimeout(toast.timeout);
    toast.timeout = setTimeout(() => { toast.className = 'toast toast-hide'; }, 2500);
}

function filtrar(categoria) {
    currentFilter = categoria; mostrarProductos();
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.filter === categoria));
}

function buscarProductos() {
    const term = document.getElementById('searchInput')?.value.toLowerCase() || '';
    if (!term) { mostrarProductos(); return; }
    const filtrados = products.filter(p => p.nombre.toLowerCase().includes(term) || p.categoria.toLowerCase().includes(term));
    const grid = document.getElementById('productsGrid');
    if (!filtrados.length) { grid.innerHTML = '<p style="text-align:center;padding:40px;">No se encontraron productos</p>'; return; }
    let html = '';
    for (const p of filtrados) {
        html += `<div class="product-card" onclick="window.location.href='producto_detalle.html?id=${p.id_prenda}'" style="cursor:pointer;"><div class="product-img">${p.imagen_url ? `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:100%;height:100%;object-fit:cover;" onerror="this.innerHTML='<i class=\'fas fa-tshirt\'></i>'">` : '<i class="fas fa-tshirt"></i>'}</div><div class="product-info"><h3>${p.nombre}</h3><p class="product-category">${p.categoria}</p><p class="product-price">S/ ${parseFloat(p.precio).toFixed(2)}</p><button class="btn-add-cart" onclick="event.stopPropagation(); agregarAlCarrito(${p.id_prenda})">🛒 Agregar</button></div></div>`;
    }
    grid.innerHTML = html;
}

// ========== TESTIMONIOS ==========
let testimoniosUsuarios = [];
const todosLosTestimonios = [
    { nombre: 'Sofía Ramírez', iniciales: 'SR', rating: 5, comentario: 'Ropa hermosa y precios accesibles.', fecha: '25/02/2024' },
    { nombre: 'Laura Mendoza', iniciales: 'LM', rating: 5, comentario: 'Diseños únicos, calidad increíble.', fecha: '28/02/2024' },
    { nombre: 'Valeria Castro', iniciales: 'VC', rating: 5, comentario: 'Excelente atención al cliente.', fecha: '05/03/2024' },
    { nombre: 'Andrea López', iniciales: 'AL', rating: 5, comentario: 'Precios competitivos, moda actual.', fecha: '10/03/2024' },
    { nombre: 'Carmen Rojas', iniciales: 'CR', rating: 5, comentario: 'Variedad de estilos, atención excelente.', fecha: '20/03/2024' },
    { nombre: 'María González', iniciales: 'MG', rating: 5, comentario: 'Jeans súper cómodos y duraderos.', fecha: '15/03/2024' },
    { nombre: 'Daniela Flores', iniciales: 'DF', rating: 5, comentario: 'Excelente calidad, no pierden color.', fecha: '18/02/2024' },
    { nombre: 'Patricia Vargas', iniciales: 'PV', rating: 4, comentario: 'Envío rápido, todo perfecto.', fecha: '10/02/2024' },
    { nombre: 'Isabel Rojas', iniciales: 'IR', rating: 5, comentario: 'Atención maravillosa, calidad insuperable.', fecha: '05/02/2024' }
];

function ordenarPorFecha(arr) {
    return arr.sort((a, b) => { const [da,ma,aa]=a.fecha.split('/'); const [db,mb,ab]=b.fecha.split('/'); return new Date(`${ab}-${mb}-${db}`) - new Date(`${aa}-${ma}-${da}`); });
}

function renderizarTestimonios() {
    const grid = document.getElementById('testimonialsGrid');
    if (!grid) return;
    let todos = [...todosLosTestimonios, ...testimoniosUsuarios];
    todos = ordenarPorFecha(todos);
    const primeros6 = todos.slice(0,6), resto = todos.slice(6);
    let html = '';
    for (const t of primeros6) html += `<div class="testimonial-card"><div class="testimonial-user"><div class="user-avatar">${t.iniciales}</div><div class="user-info"><h4>${t.nombre}</h4><div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div></div></div><p>"${t.comentario}"</p><span class="testimonial-date">${t.fecha}</span></div>`;
    for (const t of resto) html += `<div class="testimonial-card testimonial-adicional" style="display:none;"><div class="testimonial-user"><div class="user-avatar">${t.iniciales}</div><div class="user-info"><h4>${t.nombre}</h4><div class="stars">${'★'.repeat(t.rating)}${'☆'.repeat(5-t.rating)}</div></div></div><p>"${t.comentario}"</p><span class="testimonial-date">${t.fecha}</span></div>`;
    grid.innerHTML = html;
}

function mostrarMas() {
    document.querySelectorAll('.testimonial-adicional').forEach(ad => ad.style.display = 'block');
    document.getElementById('btnMoreTestimonials').style.display = 'none';
    document.getElementById('btnLessTestimonials').style.display = 'inline-flex';
}
function mostrarMenos() {
    document.querySelectorAll('.testimonial-adicional').forEach(ad => ad.style.display = 'none');
    document.getElementById('btnMoreTestimonials').style.display = 'inline-flex';
    document.getElementById('btnLessTestimonials').style.display = 'none';
}

function cargarTestimoniosGuardados() {
    const guardados = localStorage.getItem('pariz_testimonios');
    if (guardados) testimoniosUsuarios = JSON.parse(guardados);
    renderizarTestimonios();
}

function guardarTestimonios() {
    localStorage.setItem('pariz_testimonios', JSON.stringify(testimoniosUsuarios));
}

function agregarTestimonio(nombre, apellido, comentario, rating) {
    const fecha = new Date();
    const fechaStr = `${fecha.getDate().toString().padStart(2,'0')}/${(fecha.getMonth()+1).toString().padStart(2,'0')}/${fecha.getFullYear()}`;
    const iniciales = (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    testimoniosUsuarios.unshift({ nombre: `${nombre} ${apellido}`, iniciales, rating, comentario, fecha: fechaStr });
    guardarTestimonios();
    renderizarTestimonios();
    const successMsg = document.getElementById('successMessage');
    if (successMsg) { successMsg.style.display = 'flex'; setTimeout(() => successMsg.style.display = 'none', 3000); }
}

function setupStarRating() {
    const stars = document.querySelectorAll('.stars-rating-modern i');
    let selected = 0;
    const input = document.getElementById('reviewRatingModern');
    if (!stars.length) return;
    stars.forEach(star => {
        star.addEventListener('click', function() {
            selected = parseInt(this.dataset.value); input.value = selected;
            stars.forEach(s => { const v = parseInt(s.dataset.value); s.className = v <= selected ? 'fas fa-star' : 'far fa-star'; s.style.color = v <= selected ? '#f1c40f' : '#ddd'; });
        });
        star.addEventListener('mouseenter', function() {
            const val = parseInt(this.dataset.value);
            stars.forEach(s => { const v = parseInt(s.dataset.value); s.className = v <= val ? 'fas fa-star' : 'far fa-star'; s.style.color = v <= val ? '#f1c40f' : '#ddd'; });
        });
    });
    document.querySelector('.stars-rating-modern')?.addEventListener('mouseleave', function() {
        stars.forEach(s => { const v = parseInt(s.dataset.value); s.className = v <= selected ? 'fas fa-star' : 'far fa-star'; s.style.color = v <= selected ? '#f1c40f' : '#ddd'; });
    });
}

function setupReviewForm() {
    const form = document.getElementById('reviewFormModern');
    if (!form) return;
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = document.getElementById('reviewNameModern')?.value.trim();
        const apellido = document.getElementById('reviewLastNameModern')?.value.trim();
        const comentario = document.getElementById('reviewCommentModern')?.value.trim();
        const rating = parseInt(document.getElementById('reviewRatingModern')?.value || '0');
        if (!nombre || !apellido || !comentario) { alert('Completa todos los campos'); return; }
        if (rating === 0) { alert('Selecciona una calificación'); return; }
        agregarTestimonio(nombre, apellido, comentario, rating);
        document.getElementById('reviewNameModern').value = '';
        document.getElementById('reviewLastNameModern').value = '';
        document.getElementById('reviewCommentModern').value = '';
        document.getElementById('reviewRatingModern').value = '0';
        document.querySelectorAll('.stars-rating-modern i').forEach(s => { s.className = 'far fa-star'; s.style.color = '#ddd'; });
    });
}

// ========== DETALLE DE PRODUCTO ==========
let currentProduct = null, selectedSize = '', quantity = 1;
let currentImageIndex = 0;
let productImages = [];

async function loadProductDetail() {
    const id = new URLSearchParams(window.location.search).get('id');
    if (!id) return document.getElementById('detailContent').innerHTML = '<div style="text-align:center;padding:100px;color:#ccc;">Producto no encontrado</div>';
    try {
        const res = await fetch('php/obtener_productos.php');
        const products = await res.json();
        if (products.error) return document.getElementById('detailContent').innerHTML = '<div style="text-align:center;padding:100px;color:#ccc;">Error</div>';
        currentProduct = products.find(p => p.id_prenda == id);
        if (!currentProduct) return document.getElementById('detailContent').innerHTML = '<div style="text-align:center;padding:100px;color:#ccc;">Producto no encontrado</div>';
        productImages = [];
        if (currentProduct.imagen_url) productImages.push(currentProduct.imagen_url);
        if (currentProduct.imagen2) productImages.push(currentProduct.imagen2);
        if (currentProduct.imagen3) productImages.push(currentProduct.imagen3);
        while (productImages.length < 3) productImages.push('https://placehold.co/800x1000/f5f5f5/bbb?text=' + encodeURIComponent(currentProduct.nombre));
        currentImageIndex = 0;
        renderDetail();
    } catch (e) { document.getElementById('detailContent').innerHTML = '<div style="text-align:center;padding:100px;color:#ccc;">Error de conexión</div>'; }
}

function renderDetail() {
    const tallas = currentProduct.tallas ? currentProduct.tallas.split(',').map(t => t.trim()) : ['S','M','L','XL'];
    const colores = currentProduct.colores ? currentProduct.colores.split(',').map(c => c.trim()) : ['Negro'];
    const color = colores[0];
    const ok = currentProduct.stock > 0;
    document.getElementById('detailContent').innerHTML = `
        <div class="detalle-card">
            <div class="detalle-gallery">
                <div class="detalle-thumbnails">${productImages.map((img,i) => `<div class="detalle-thumb ${i===currentImageIndex?'active':''}" data-index="${i}"><img src="${img}" alt="Vista ${i+1}" onerror="this.src='https://placehold.co/150x190/f5f5f5/ccc?text=Vista'"></div>`).join('')}</div>
                <div class="detalle-main-image"><img src="${productImages[currentImageIndex]}" alt="${currentProduct.nombre}" onerror="this.src='https://placehold.co/800x1000/fafafa/bbb?text=${encodeURIComponent(currentProduct.nombre)}'" id="mainImage"></div>
            </div>
            <div class="detalle-info">
                <span class="detalle-categoria">${currentProduct.categoria}</span><h1 class="detalle-titulo">${currentProduct.nombre}</h1><p class="detalle-precio">S/ ${parseFloat(currentProduct.precio).toFixed(2)}</p><div class="detalle-hr"></div>
                <div class="detalle-color-section"><span class="section-label">Color</span><div class="detalle-color-row"><span class="detalle-color-dot" style="background:${getHex(color)}"></span><span class="detalle-color-text">${color}</span></div></div>
                <div class="detalle-talla-section"><div class="detalle-talla-header"><span class="section-label">Talla</span><span class="detalle-talla-guia" id="guiaTallasBtn">Guía de tallas</span></div><div class="detalle-talla-buttons">${tallas.map(t => `<button class="detalle-talla-opt" data-size="${t}">${t}</button>`).join('')}</div></div>
                <div class="detalle-qty-section"><span class="section-label">Cantidad</span><div class="detalle-qty-row"><div class="detalle-qty-box"><button id="qtyMinus">−</button><span id="qtyValue">1</span><button id="qtyPlus">+</button></div><span class="detalle-stock ${ok?'':'sin-stock'}">${ok?'Disponible':'Agotado'}</span></div></div>
                <button class="detalle-btn-add" id="addToCartBtn" ${!ok?'disabled':''}>${ok?'Añadir al carrito':'Agotado'}</button>
                <div class="detalle-accordion">
                    <div class="detalle-accordion-item open"><div class="detalle-accordion-header"><h4>Descripción</h4><i class="fas fa-chevron-down"></i></div><div class="detalle-accordion-body"><p>${currentProduct.descripcion||'Prenda de alta calidad.'}</p></div></div>
                    <div class="detalle-accordion-item"><div class="detalle-accordion-header"><h4>Características</h4><i class="fas fa-chevron-down"></i></div><div class="detalle-accordion-body"><ul><li>Material: Algodón premium</li><li>Tipo: ${currentProduct.categoria}</li><li>Origen: Nacional</li><li>Cuidado: Lavar en frío</li></ul></div></div>
                    <div class="detalle-accordion-item"><div class="detalle-accordion-header"><h4>Envíos y cambios</h4><i class="fas fa-chevron-down"></i></div><div class="detalle-accordion-body"><p>Envío gratis a Lima desde S/150. Cambios sin costo 30 días.</p></div></div>
                </div>
                <div class="detalle-tags"><div class="detalle-tag"><i class="fas fa-truck"></i> Envío gratis S/150+</div><div class="detalle-tag"><i class="fas fa-undo-alt"></i> Cambios gratis</div><div class="detalle-tag"><i class="fas fa-lock"></i> Pago seguro</div></div>
            </div>
        </div>`;
    selectedSize = ''; quantity = 1;
    setupDetailEvents(ok, colores);
    setupThumbnails();
}

function setupThumbnails() {
    document.querySelectorAll('.detalle-thumb').forEach(thumb => thumb.addEventListener('click', function() {
        currentImageIndex = parseInt(this.dataset.index);
        document.querySelectorAll('.detalle-thumb').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        const m = document.getElementById('mainImage'); m.style.opacity = '0';
        setTimeout(() => { m.src = productImages[currentImageIndex]; m.style.opacity = '1'; }, 100);
    }));
}

function setupDetailEvents(ok, colores) {
    document.querySelectorAll('.detalle-talla-opt').forEach(btn => btn.addEventListener('click', function() {
        document.querySelectorAll('.detalle-talla-opt').forEach(b => b.classList.remove('selected'));
        this.classList.add('selected'); selectedSize = this.dataset.size;
    }));
    document.getElementById('qtyMinus').addEventListener('click', () => { if (quantity > 1) { quantity--; document.getElementById('qtyValue').textContent = quantity; } });
    document.getElementById('qtyPlus').addEventListener('click', () => { if (quantity < currentProduct.stock) { quantity++; document.getElementById('qtyValue').textContent = quantity; } else mostrarToast('Stock máximo', 'error'); });
    document.getElementById('guiaTallasBtn').addEventListener('click', abrirGuia);
    document.querySelectorAll('.detalle-accordion-header').forEach(h => h.addEventListener('click', () => h.parentElement.classList.toggle('open')));
    document.getElementById('addToCartBtn').addEventListener('click', () => {
        if (!ok) { mostrarToast('Agotado', 'error'); return; }
        if (!selectedSize) { mostrarToast('Elige una talla', 'error'); return; }
        if (currentProduct.stock < quantity) { mostrarToast('Stock insuficiente', 'error'); return; }
        const c = colores[0];
        const ex = cart.find(i => i.id === currentProduct.id_prenda && i.talla === selectedSize && i.color === c);
        if (ex) { if (ex.cantidad + quantity <= currentProduct.stock) ex.cantidad += quantity; else { mostrarToast('Stock insuficiente', 'error'); return; } }
        else cart.push({ id: currentProduct.id_prenda, nombre: currentProduct.nombre, precio: parseFloat(currentProduct.precio), cantidad: quantity, talla: selectedSize, color: c, stock: currentProduct.stock, imagen: currentProduct.imagen_url || '' });
        mostrarToast('¡Agregado! ✓'); actualizarCarrito(); guardarCarrito();
    });
}

function getHex(n) { const m = {'Verde':'#0b5f03','Rojo':'#ff4b4b','Lila':'#f0c8f5','Azul Oscuro':'#1a3a5c','Gris Oscuro':'#4a4a4a','Camel':'#c19a6b','Verde Salvia':'#b2bea0','Negro':'#1a1a1a','Blanco':'#f5f5f5','Beige':'#d4b896','Azul':'#3a5a8c','Denim':'#5a7a9a','Rosa':'#e8c0c0','Gris':'#a0a0a0','Claro':'#e8e0d5','Azul Claro':'#8ab8d8','Azul Marino':'#1a2a3c','Celeste':'#b8d8f0','Guinda':'#800040','Marrón':'#472710'}; return m[n]||'#ccc'; }
function abrirGuia() {
    let modal = document.getElementById('guiaModal');
    if (!modal) {
        document.body.insertAdjacentHTML('beforeend', `<div class="guia-modal" id="guiaModal"><div class="guia-dialog"><button class="close" id="closeGuia">&times;</button><h3>Guía de tallas</h3><table><thead><tr><th>Talla</th><th>Pecho</th><th>Cintura</th><th>Cadera</th></tr></thead><tbody><tr><td>S</td><td>84-88</td><td>64-68</td><td>88-92</td></tr><tr><td>M</td><td>88-92</td><td>68-72</td><td>92-96</td></tr><tr><td>L</td><td>92-96</td><td>72-76</td><td>96-100</td></tr><tr><td>XL</td><td>96-100</td><td>76-80</td><td>100-104</td></tr></tbody></table><p class="nota">Medidas en centímetros</p></div></div>`);
        document.getElementById('closeGuia').addEventListener('click', () => modal.classList.remove('active'));
        modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('active'); });
    }
    modal.classList.add('active');
}

// ========== FORMULARIO DE CONTACTO ==========
function setupContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = this.querySelector('input[placeholder="Tu nombre"]')?.value.trim();
        const email = this.querySelector('input[placeholder="Tu email"]')?.value.trim();
        const mensaje = this.querySelector('textarea')?.value.trim();
        if (!nombre) { mostrarToast('Ingresa tu nombre', 'error'); return; }
        if (!email) { mostrarToast('Ingresa tu email', 'error'); return; }
        if (!mensaje) { mostrarToast('Escribe tu mensaje', 'error'); return; }
        const contactos = JSON.parse(localStorage.getItem('pariz_contactos') || '[]');
        contactos.unshift({ nombre, email, mensaje, fecha: new Date().toLocaleString() });
        localStorage.setItem('pariz_contactos', JSON.stringify(contactos));
        mostrarToast(`¡Gracias ${nombre}! Te contactaremos pronto.`, 'success');
        this.reset();
    });
}

// ========== ENVIAR PEDIDO ==========
async function enviarPedidoAlServidor(datosCliente, metodoPago, tipoEntrega, costoEnvio) {
    const productos = cart.map(item => ({ id: item.id, cantidad: item.cantidad, precio: item.precio, talla: item.talla||'', color: item.color||'', subtotal: item.precio*item.cantidad }));
    const subtotal = cart.reduce((sum, item) => sum + (item.precio*item.cantidad), 0);
    const total = subtotal + costoEnvio;
    const pedido = { nombre: datosCliente.nombre, apellido: datosCliente.apellido, email: datosCliente.email, telefono: datosCliente.telefono, direccion: datosCliente.direccion||'', total, metodo_pago: metodoPago, tipo_entrega: tipoEntrega, productos };
    try {
        const response = await fetch('php/registrar_pedido.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pedido) });
        const resultado = await response.json();
        if (resultado.success) {
            let pedidos = JSON.parse(localStorage.getItem('pariz_pedidos')||'[]');
            pedidos.unshift({ id: resultado.id_pedido, codigo: 'PARIZ-'+resultado.id_pedido, fecha: new Date().toLocaleString(), total, metodo_pago: metodoPago, productos: cart });
            localStorage.setItem('pariz_pedidos', JSON.stringify(pedidos));
            cart = []; guardarCarrito(); actualizarCarrito();
            return { success: true, id_pedido: resultado.id_pedido, total };
        } else return { success: false, message: resultado.message||'Error del servidor' };
    } catch (error) {
        let pedidos = JSON.parse(localStorage.getItem('pariz_pedidos')||'[]');
        pedidos.unshift({ id: Date.now(), codigo: 'PARIZ-'+Date.now().toString().slice(-6), fecha: new Date().toLocaleString(), total, metodo_pago: metodoPago, productos: cart });
        localStorage.setItem('pariz_pedidos', JSON.stringify(pedidos));
        cart = []; guardarCarrito(); actualizarCarrito();
        return { success: true, offline: true, total };
    }
}

async function procesarPedido(e) {
    if (e) e.preventDefault();
    if (cart.length === 0) { mostrarToast('Carrito vacío', 'error'); return; }
    const nombre = document.getElementById('nombre')?.value.trim();
    const apellido = document.getElementById('apellido')?.value.trim();
    const email = document.getElementById('email')?.value.trim();
    const telefono = document.getElementById('telefono')?.value.trim();
    const direccion = document.getElementById('direccion')?.value.trim();
    const metodoPago = document.getElementById('metodoPago')?.value;
    if (!nombre||!apellido||!email||!telefono) { alert('Completa todos los datos'); return; }
    if (!metodoPago) { alert('Selecciona un método de pago'); return; }
    if (!direccion) { alert('Ingresa una dirección'); return; }
    const resultado = await enviarPedidoAlServidor({ nombre, apellido, email, telefono, direccion }, metodoPago, 'delivery', 0);
    if (resultado.success) {
        document.getElementById('checkoutModal')?.classList.remove('active');
        ['nombre','apellido','email','telefono','direccion','metodoPago'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        alert('✅ ¡Pedido confirmado!\n\nTotal: S/ ' + resultado.total.toFixed(2));
    } else alert('❌ Error: ' + resultado.message);
}

// ========== INICIALIZAR (SOLO UNO) ==========
document.addEventListener('DOMContentLoaded', () => {
    cargarCarrito();
    if (document.getElementById('productsGrid')) loadProducts();
    if (document.getElementById('detailContent')) loadProductDetail();
    if (document.getElementById('testimonialsGrid')) { cargarTestimoniosGuardados(); }
    if (document.getElementById('starsRatingModern')) { setupStarRating(); setupReviewForm(); }
    setupContactForm();
    
    document.getElementById('cartIcon')?.addEventListener('click', abrirCarrito);
    document.querySelector('.close-cart')?.addEventListener('click', cerrarCarrito);
    document.getElementById('checkoutBtn')?.addEventListener('click', () => {
        if (cart.length === 0) { mostrarToast('Carrito vacío', 'error'); return; }
        window.location.href = 'checkout.html';
    });
    document.querySelector('.close-modal')?.addEventListener('click', () => document.getElementById('checkoutModal')?.classList.remove('active'));
    document.getElementById('checkoutForm')?.addEventListener('submit', (e) => procesarPedido(e));
    document.getElementById('btnMoreTestimonials')?.addEventListener('click', mostrarMas);
    document.getElementById('btnLessTestimonials')?.addEventListener('click', mostrarMenos);
    
    document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => document.querySelector('.nav-menu')?.classList.toggle('active'));
    document.querySelectorAll('.filter-btn').forEach(btn => btn.addEventListener('click', () => filtrar(btn.dataset.filter)));
    const searchInput = document.getElementById('searchInput');
    if (searchInput) searchInput.addEventListener('input', buscarProductos);
});