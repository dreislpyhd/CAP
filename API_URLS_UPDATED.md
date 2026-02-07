# ✅ API URLs Updated to Production

All frontend API URLs have been changed from `localhost` to `23.94.230.146`

## Files Updated:

### RGD Module (Relief Good and Distribution)
1. **reliefBene.jsx** - Beneficiaries API
   - ✅ `http://23.94.230.146/gsm/backend/api/rgd/beneficiaries.php`

2. **rgdInventory.jsx** - Inventory API
   - ✅ `http://23.94.230.146/gsm/backend/api/rgd/inventory.php`

3. **RgdTracker.jsx** - Distribution Tracker API
   - ✅ `http://23.94.230.146/gsm/backend/api/rgd/tracker.php`

### Coordination Tool Module
4. **TDS.jsx** - Training & Drill Scheduling API
   - ✅ `http://23.94.230.146/gsm/backend/api/coordination/training.php`

5. **ToolR.jsx** - Resource Inventory Management API
   - ✅ `http://23.94.230.146/gsm/backend/api/coordination/resources.php`

### HES Module (Hazard & Evacuation System)
6. **Evac.jsx** - Evacuations API
   - ✅ `http://23.94.230.146/gsm/backend/api/hes/evacuations.php`

7. **Map.jsx** - Multiple APIs
   - ✅ `http://23.94.230.146/gsm/backend/api/hes/evacuations.php`
   - ✅ `http://23.94.230.146/gsm/backend/api/hes/hazards.php`

---

## Backend Configuration Updated:

**config.php:**
```php
$host = '23.94.230.146';
$database = 'disa_gsm_database';
$username = 'disa_gsm_db';
$password = '1234';
```

**setup.php:**
```php
$host = '23.94.230.146';
$username = 'disa_gsm_db';
$password = '1234';
```

---

## Next Steps to Deploy:

### 1. Build Frontend for Production
```bash
cd gsm-main-main
npm run build
```

This creates an optimized `build` folder.

### 2. Upload Frontend Build
Upload the `build` folder contents to your web server:
```
/var/www/html/gsm/
```

### 3. Upload Backend
Upload the `backend` folder to:
```
/var/www/html/gsm/backend/
```

### 4. Run Setup on Server
Visit:
```
http://23.94.230.146/gsm/backend/setup.php
```

### 5. Test Your Application
Visit:
```
http://23.94.230.146/gsm/
```

---

## ⚠️ Important Security Notes:

1. **Change Database Password** - The password '1234' is NOT secure for production!
   ```sql
   ALTER USER 'disa_gsm_db'@'localhost' IDENTIFIED BY 'strong_password_here';
   ```

2. **Update CORS Settings** in `config.php`:
   ```php
   header('Access-Control-Allow-Origin: http://23.94.230.146');
   ```

3. **Enable HTTPS** (Recommended):
   - Get SSL certificate
   - Update all URLs to use `https://` instead of `http://`

4. **Secure File Permissions**:
   ```bash
   chmod 755 /var/www/html/gsm/backend/
   chown -R www-data:www-data /var/www/html/gsm/
   ```

---

## Testing Checklist:

- [ ] Backend setup.php runs successfully
- [ ] All API endpoints return data
- [ ] Relief Beneficiaries loads
- [ ] Relief Inventory loads and CRUD works
- [ ] Distribution Tracker loads
- [ ] Training & Drill Scheduling works
- [ ] Resource Management works
- [ ] Evacuation system loads
- [ ] Hazard map displays correctly
- [ ] All forms submit successfully
- [ ] No console errors in browser

---

## 🎉 Your Application is Ready for Deployment!

All API URLs are now pointing to your production server at `23.94.230.146`.
