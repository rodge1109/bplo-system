const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Add AppNavbar import
if (!content.includes("import AppNavbar from './components/layout/AppNavbar'")) {
  content = content.replace(
    /import AuthScreen from '\.\/components\/auth\/AuthScreen';/,
    "import AuthScreen from './components/auth/AuthScreen';\nimport AppNavbar from './components/layout/AppNavbar';"
  );
}

// 2. Add selectedTenantCode state to RestaurantApp
const restaurantAppSignature = 'export default function RestaurantApp() {';
const tenantStateInjection = `export default function RestaurantApp() {
  // Multi-Tenant state for Navigation Bar & Application
  const [selectedTenantCode, setSelectedTenantCode] = useState('BOGO');
  const activeTenant = TENANTS.find(t => t.code === selectedTenantCode) || TENANTS[0];`;

if (!content.includes("const [selectedTenantCode, setSelectedTenantCode] = useState('BOGO');")) {
  content = content.replace(restaurantAppSignature, tenantStateInjection);
}

// 3. Update return of RestaurantApp with AppNavbar
const oldReturnPattern = /\/\/ Gate: Show Login \/ Sign Up screen if not authenticated[\s\S]*?<div className="min-h-screen bg-slate-50 py-6 px-4">\s*<BusinessPermitForm currentUser={currentUser} onLogout={handleLogout} \/>\s*<\/div>\s*<\/CartContext\.Provider>\s*\);/;

const newReturnBlock = `// Gate: Show Login / Sign Up screen if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
        <AppNavbar
          activeTenant={activeTenant}
          selectedTenantCode={selectedTenantCode}
          onTenantChange={setSelectedTenantCode}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <div className="flex-1 flex items-center justify-center">
          <AuthScreen
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              try {
                localStorage.setItem('bplo_currentUser', JSON.stringify(user));
              } catch (e) {
                console.warn(e);
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <CartContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <AppNavbar
          activeTenant={activeTenant}
          selectedTenantCode={selectedTenantCode}
          onTenantChange={setSelectedTenantCode}
          currentUser={currentUser}
          onLogout={handleLogout}
        />
        <main className="flex-1 py-4 px-2 sm:px-4">
          <BusinessPermitForm
            currentUser={currentUser}
            onLogout={handleLogout}
            selectedTenantCode={selectedTenantCode}
            setSelectedTenantCode={setSelectedTenantCode}
          />
        </main>
      </div>
    </CartContext.Provider>
  );`;

content = content.replace(oldReturnPattern, newReturnBlock);

// 4. Update BusinessPermitForm props & tenant sync
const oldFormSignaturePattern = /export function BusinessPermitForm\(\{ currentUser, onLogout \} = \{\}\) \{[\s\S]*?const activeTenant = TENANTS\.find\(t => t\.code === selectedTenantCode\) \|\| TENANTS\[0\];/;

const newFormSignature = `export function BusinessPermitForm({ 
  currentUser, 
  onLogout,
  selectedTenantCode: externalTenantCode,
  setSelectedTenantCode: externalSetTenantCode
} = {}) {
  const [internalTenantCode, setInternalTenantCode] = useState('BOGO');
  const selectedTenantCode = externalTenantCode || internalTenantCode;
  const setSelectedTenantCode = externalSetTenantCode || setInternalTenantCode;
  const activeTenant = TENANTS.find(t => t.code === selectedTenantCode) || TENANTS[0];`;

content = content.replace(oldFormSignaturePattern, newFormSignature);

// Sync city & province when selectedTenantCode changes
if (!content.includes('// Auto-sync municipality & province when tenant changes in navbar')) {
  const tenantSyncEffect = `
  // Auto-sync municipality & province when tenant changes in navbar
  useEffect(() => {
    const tenant = TENANTS.find(t => t.code === selectedTenantCode);
    if (tenant) {
      setFormData(prev => ({
        ...prev,
        busCityMunicipality: tenant.name,
        busProvince: tenant.province
      }));
    }
  }, [selectedTenantCode]);
  `;
  content = content.replace(
    'const [submitStatus, setSubmitStatus] = useState({ type: null, message: \'\' });',
    tenantSyncEffect + '\n  const [submitStatus, setSubmitStatus] = useState({ type: null, message: \'\' });'
  );
}

// 5. Remove redundant User Session Bar and redundant Multi-Tenant Line from inside BusinessPermitForm JSX
const redundantBarsPattern = /\{\/\* Logged In User Bar \*\/\}[\s\S]*?\{\/\* Official Form Header \*\/\}/;
const cleanOfficialHeader = `{/* Official Form Header */}`;

content = content.replace(redundantBarsPattern, cleanOfficialHeader);

fs.writeFileSync(appPath, content, 'utf8');
console.log('App.jsx successfully integrated with AppNavbar!');
