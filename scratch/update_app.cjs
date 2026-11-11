const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Check AuthScreen import
if (!content.includes("import AuthScreen from './components/auth/AuthScreen'")) {
  content = content.replace(
    /import { TENANTS } from '\.\/constants\/tenants';/,
    "import { TENANTS } from './constants/tenants';\nimport AuthScreen from './components/auth/AuthScreen';"
  );
}

// Ensure LogOut icon is imported
if (!content.includes('LogOut')) {
  content = content.replace(
    /import { ShoppingCart,/,
    "import { ShoppingCart, LogOut,"
  );
}

// 2. Add auth state to RestaurantApp
const restaurantAppTarget = 'export default function RestaurantApp() {';
const authLogic = `export default function RestaurantApp() {
  // Authentication state (gate before main page)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bplo_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Supabase session listener
  useEffect(() => {
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const userObj = {
            id: session.user.id,
            email: session.user.email,
            fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
            role: session.user.user_metadata?.role || 'applicant',
          };
          setCurrentUser(userObj);
          localStorage.setItem('bplo_currentUser', JSON.stringify(userObj));
        }
      } catch (err) {
        console.warn('Auth check notice:', err);
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const userObj = {
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name || session.user.email?.split('@')[0],
          role: session.user.user_metadata?.role || 'applicant',
        };
        setCurrentUser(userObj);
        localStorage.setItem('bplo_currentUser', JSON.stringify(userObj));
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn(e);
    }
    setCurrentUser(null);
    localStorage.removeItem('bplo_currentUser');
  };`;

if (!content.includes('// Authentication state (gate before main page)')) {
  content = content.replace(restaurantAppTarget, authLogic);
}

// 3. Update return of RestaurantApp with AuthScreen gate
const oldReturnPattern = /return \(\s*<CartContext\.Provider value={contextValue}>\s*<div className="min-h-screen bg-white py-6 px-4">\s*<BusinessPermitForm \/>\s*<\/div>\s*<\/CartContext\.Provider>\s*\);/;

const newReturn = `// Gate: Show Login / Sign Up screen if not authenticated
  if (!currentUser) {
    return (
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
    );
  }

  return (
    <CartContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <BusinessPermitForm currentUser={currentUser} onLogout={handleLogout} />
      </div>
    </CartContext.Provider>
  );`;

content = content.replace(oldReturnPattern, newReturn);

// 4. Update BusinessPermitForm to accept currentUser and onLogout
if (!content.includes('export function BusinessPermitForm({ currentUser, onLogout } = {}) {')) {
  content = content.replace(
    'export function BusinessPermitForm() {',
    'export function BusinessPermitForm({ currentUser, onLogout } = {}) {'
  );
}

// 5. Update initial formData to pre-fill user info if available
const oldFormDataPattern = 'const [formData, setFormData] = useState(getInitialFormData());';
const newFormDataCode = `const [formData, setFormData] = useState(() => {
    const init = getInitialFormData();
    if (currentUser) {
      if (currentUser.email) {
        init.ownerEmailAddress = currentUser.email;
        init.busEmailAddress = currentUser.email;
      }
      if (currentUser.fullName) {
        init.applicantSignatureName = currentUser.fullName;
        const parts = currentUser.fullName.trim().split(' ');
        if (parts.length > 1) {
          init.taxpayerFirstName = parts.slice(0, -1).join(' ');
          init.taxpayerLastName = parts[parts.length - 1];
        } else {
          init.taxpayerFirstName = currentUser.fullName;
        }
      }
    }
    return init;
  });`;

content = content.replace(oldFormDataPattern, newFormDataCode);

// 6. Insert User Session Bar in BusinessPermitForm JSX
const formReturnPattern = /(<div className="relative p-6 sm:p-10 max-w-5xl mx-auto text-gray-800 text-xs sm:text-sm my-6 font-\['Poppins',sans-serif'\]">\s*)/;
const userBarCode = `$1{/* Logged in User Bar */}
      {currentUser && (
        <div className="mb-5 bg-white border border-slate-200/90 rounded-2xl p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#1B4332] text-white font-bold flex items-center justify-center text-sm shadow">
              {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">
                  {currentUser.fullName || currentUser.email}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-[#1B4332] border border-emerald-200">
                  {currentUser.role === 'business_owner' ? 'Business Owner' : currentUser.role === 'admin' ? 'BPLO Staff' : 'Applicant'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">{currentUser.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 rounded-full border border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      }

      `;

if (!content.includes('{/* Logged in User Bar */}')) {
  content = content.replace(formReturnPattern, userBarCode);
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully updated App.jsx with auth integration!');
