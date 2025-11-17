/* script.js - final, tested
 - features: add/edit/delete products with image (dataURL), badges, search (KMP), sort (merge sort),
   localStorage persistence, export CSV, reset storage, show all.
*/

// ---------- state ----------
const STORAGE_KEY = 'soft_elegant_products_v1';
let productList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let editIndex = -1;
let currentImageData = '';

// ---------- DOM refs ----------
const productForm = document.getElementById('productForm');
const imgInput = document.getElementById('image');
const imgPreview = document.getElementById('imgPreview');
const addBtn = document.getElementById('addBtn');
const saveBtn = document.getElementById('saveBtn');
const resetFormBtn = document.getElementById('resetForm');
const showAllBtn = document.getElementById('showAll');
const cardsWrap = document.getElementById('cards');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const clearSearch = document.getElementById('clearSearch');
const sortBtn = document.getElementById('sortBtn');
const sortKey = document.getElementById('sortKey');
const sortOrder = document.getElementById('sortOrder');
const table = document.getElementById('table');
const tableBody = document.getElementById('tableBody');
const btnExport = document.getElementById('btn-export');
const btnClearStorage = document.getElementById('btn-clear-storage');

// ---------- helpers ----------
function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(productList));
}
function formatRp(n){ return Number(n).toLocaleString('id-ID'); }
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }

// ---------- image preview ----------
if (imgInput){
  imgInput.addEventListener('change', e=>{
    const file = e.target.files[0];
    if (!file) { currentImageData=''; imgPreview.innerText='Preview'; return; }
    const reader = new FileReader();
    reader.onload = () => {
      currentImageData = reader.result;
      imgPreview.innerHTML = `<img src="${currentImageData}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:8px" />`;
    };
    reader.readAsDataURL(file);
  });
}

// ---------- render ----------
function renderAll(list = productList){
  // cards
  cardsWrap.innerHTML = '';
  if (!list || list.length === 0){
    cardsWrap.innerHTML = `<div class="card"><div class="title" style="color:var(--muted)">Belum ada produk — tambahkan produk menggunakan form.</div></div>`;
    table.classList.add('hidden');
    return;
  }
  table.classList.remove('hidden');

  list.forEach((p, i) => {
    const el = document.createElement('article');
    el.className = 'card';
    el.innerHTML = `
      <div class="thumb">${ p.image ? `<img src="${p.image}" alt="${escapeHtml(p.name)}">` : `<div style="font-size:28px;color:var(--muted)">${escapeHtml(p.name.charAt(0) || '?')}</div>` }</div>
      <div>
        <div class="title">${escapeHtml(p.name)}</div>
        <div class="meta">${escapeHtml(p.category || '')} • Stok: ${p.stock || 0}</div>
      </div>
      <div style="margin-top:auto;display:flex;justify-content:space-between;align-items:center">
        <div class="price">Rp ${formatRp(p.price)}</div>
        ${ p.badge ? `<div class="badge">${escapeHtml(p.badge)}</div>` : ''}
      </div>
      <div style="margin-top:8px;display:flex;gap:8px">
        <button class="btn subtle" type="button" onclick="editProduct(${i})">Edit</button>
        <button class="btn subtle" type="button" style="background:#fff;color:#b91c1c;border:1px solid #fee2e2" onclick="deleteProduct(${i})">Hapus</button>
      </div>
    `;
    cardsWrap.appendChild(el);
  });

  // table
  tableBody.innerHTML = '';
  list.forEach((p, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(p.name)}</td>
      <td>Rp ${formatRp(p.price)}</td>
      <td>${p.stock || 0}</td>
      <td>${escapeHtml(p.category || '')}</td>
      <td>
        <button class="btn subtle" type="button" onclick="editProduct(${i})">Edit</button>
        <button class="btn subtle" type="button" style="background:#fff;color:#b91c1c;border:1px solid #fee2e2" onclick="deleteProduct(${i})">Hapus</button>
      </td>
    `;
    tableBody.appendChild(tr);
  });
}

// ---------- add / save ----------
productForm.addEventListener('submit', e=>{
  e.preventDefault();
  addOrSave();
});

function addOrSave(){
  const name = document.getElementById('name').value.trim();
  const priceVal = document.getElementById('price').value;
  const stockVal = document.getElementById('stock').value || '0';
  const category = document.getElementById('category').value.trim();
  const badge = document.getElementById('badge').value || '';

  if (!name || priceVal === '') { alert('Lengkapi nama & harga!'); return; }
  const price = Number(priceVal);
  const stock = Number(stockVal);

  if (Number.isNaN(price) || Number.isNaN(stock)) { alert('Harga / stok harus angka!'); return; }

  const item = { name, price, stock, category, badge, image: currentImageData || '' };

  if (editIndex >= 0){
    productList[editIndex] = item;
    editIndex = -1;
    addBtn.style.display = 'inline-block';
    saveBtn.style.display = 'none';
  } else {
    productList.push(item);
  }

  currentImageData = '';
  imgPreview.innerText = 'Preview';
  productForm.reset();
  saveState();
  renderAll();
}

// ---------- edit / delete ----------
function editProduct(index){
  const p = productList[index];
  editIndex = index;
  document.getElementById('name').value = p.name;
  document.getElementById('price').value = p.price;
  document.getElementById('stock').value = p.stock;
  document.getElementById('category').value = p.category;
  document.getElementById('badge').value = p.badge || '';
  currentImageData = p.image || '';
  imgPreview.innerHTML = currentImageData ? `<img src="${currentImageData}" alt="preview" style="width:100%;height:100%;object-fit:cover;border-radius:8px" />` : 'Preview';
  addBtn.style.display = 'none';
  saveBtn.style.display = 'inline-block';
}

function deleteProduct(idx){
  if (!confirm('Hapus produk ini?')) return;
  productList.splice(idx,1);
  saveState();
  renderAll();
}

// ---------- KMP search ----------
function kmpSearch(text, pattern){
  if (!pattern) return true;
  text = text.toLowerCase();
  pattern = pattern.toLowerCase();

  const lps = new Array(pattern.length).fill(0);
  let len = 0, i = 1;
  while (i < pattern.length){
    if (pattern[i] === pattern[len]) { lps[i++] = ++len; }
    else { if (len) len = lps[len-1]; else lps[i++] = 0; }
  }

  let t = 0, p = 0;
  while (t < text.length){
    if (pattern[p] === text[t]) { p++; t++; }
    if (p === pattern.length) return true;
    if (t < text.length && pattern[p] !== text[t]) {
      if (p) p = lps[p-1];
      else t++;
    }
  }
  return false;
}

searchBtn.addEventListener('click', ()=>{
  const q = searchInput.value.trim();
  if (!q) { renderAll(); return; }
  const results = [];
  for (let i=0;i<productList.length;i++){
    if (kmpSearch(productList[i].name, q)) results.push(productList[i]);
  }
  renderAll(results);
});
clearSearch.addEventListener('click', ()=>{ searchInput.value=''; renderAll(); });

// ---------- merge sort ----------
function mergeSort(arr, key='name', order='asc'){
  if (arr.length <= 1) return arr.slice();
  const mid = Math.floor(arr.length/2);
  const left = mergeSort(arr.slice(0,mid), key, order);
  const right = mergeSort(arr.slice(mid), key, order);
  return merge(left, right, key, order);
}
function merge(a,b,key,order){
  const res=[];
  while(a.length && b.length){
    let cmp = 0;
    if (key === 'price') cmp = a[0].price - b[0].price;
    else cmp = a[0].name.toLowerCase().localeCompare(b[0].name.toLowerCase());
    if (cmp === 0) res.push(a.shift());
    else {
      if ((order==='asc' && cmp<0) || (order==='desc' && cmp>0)) res.push(a.shift());
      else res.push(b.shift());
    }
  }
  return [...res, ...a, ...b];
}
sortBtn.addEventListener('click', ()=>{
  const key = sortKey.value;
  const order = sortOrder.value;
  productList = mergeSort(productList, key, order);
  saveState();
  renderAll();
});

// ---------- export CSV ----------
btnExport.addEventListener('click', ()=>{
  if (!productList.length) return alert('Tidak ada data untuk diexport');
  const header = ['name','price','stock','category','badge'];
  const rows = productList.map(p => [p.name, p.price, p.stock, p.category, p.badge || '']);
  const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'products.csv'; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
});

// ---------- reset storage ----------
btnClearStorage.addEventListener('click', ()=>{
  if (!confirm('Hapus semua data di localStorage?')) return;
  localStorage.removeItem(STORAGE_KEY);
  productList = [];
  renderAll();
});

// ---------- show all / reset form ----------
showAllBtn.addEventListener('click', ()=>{ searchInput.value=''; renderAll(); });
resetFormBtn.addEventListener('click', ()=>{
  productForm.reset();
  currentImageData=''; imgPreview.innerText='Preview';
  addBtn.style.display='inline-block'; saveBtn.style.display='none'; editIndex=-1;
});

// ---------- initial render ----------
renderAll();
