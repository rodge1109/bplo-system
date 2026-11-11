import React, { useState, createContext, useContext, useEffect } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ChevronRight, Check, X, Search, LogOut, Edit3, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from './supabaseClient';
import { TENANTS } from './constants/tenants';
import AuthScreen from './components/auth/AuthScreen';
import AppNavbar from './components/layout/AppNavbar';
import ArtaDocumentUpload from './components/documents/ArtaDocumentUpload';
import AcknowledgementReceiptModal from './components/documents/AcknowledgementReceiptModal';
import ApplicationTracker from './components/documents/ApplicationTracker';
import AdminEvaluationDashboard from './components/admin/AdminEvaluationDashboard';

// Cart Context
const CartContext = createContext();

const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};

// Google Sheets API URL - UPDATE THIS WITH YOUR WEB APP URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyQNLHXp9Fzi0_mVxYmV7M0xSA2bqteLxIDzA96nAsaIObDEAhwGN9oX1lOAoY72BaL/exec';

// Fallback Menu Data (used if Google Sheets fetch fails)
const fallbackMenuData = [
  { id: 1, name: 'Margherita Pizza', category: 'Pizza', sizes: [{ name: 'Small', price: 10.99 }, { name: 'Medium', price: 12.99 }, { name: 'Large', price: 15.99 }], image: 'assets/images/food/pepperoni.png', description: 'Classic tomato sauce, mozzarella, fresh basil', popular: true },
  { id: 2, name: 'Pepperoni Pizza', category: 'Pizza', sizes: [{ name: 'Small', price: 12.99 }, { name: 'Medium', price: 14.99 }, { name: 'Large', price: 17.99 }], image: 'assets/images/food/burgerpizza.png', description: 'Loaded with pepperoni and mozzarella', popular: true },
  { id: 3, name: 'BBQ Chicken Pizza', category: 'Pizza', sizes: [{ name: 'Small', price: 13.99 }, { name: 'Medium', price: 15.99 }, { name: 'Large', price: 18.99 }], image: 'assets/images/food/pepperoni.png', description: 'BBQ sauce, grilled chicken, red onions', popular: false },
  { id: 4, name: 'Veggie Supreme', category: 'Pizza', sizes: [{ name: 'Small', price: 11.99 }, { name: 'Medium', price: 13.99 }, { name: 'Large', price: 16.99 }], image: 'assets/images/food/pepperoni.png', description: 'Mushrooms, peppers, olives, onions', popular: false },

  { id: 5, name: 'Classic Burger', category: 'Burgers', price: 9.99, image: 'assets/images/food/pepperoni.png', description: 'Beef patty, lettuce, tomato, cheese', popular: true },
  { id: 6, name: 'Bacon Cheeseburger', category: 'Burgers', price: 11.99, image: 'assets/images/food/pepperoni.png', description: 'Double beef, bacon, cheddar cheese', popular: true },
  { id: 7, name: 'Veggie Burger', category: 'Burgers', price: 10.99, image: 'assets/images/food/pepperoni.png', description: 'Plant-based patty, avocado, sprouts', popular: false },
  { id: 8, name: 'Chicken Burger', category: 'Burgers', price: 10.49, image: 'assets/images/food/pepperoni.png', description: 'Grilled chicken breast, mayo, lettuce', popular: false },

  { id: 9, name: 'Spaghetti Carbonara', category: 'Pasta', price: 13.99, image: 'assets/images/food/pepperoni.png', description: 'Creamy sauce, bacon, parmesan', popular: true },
  { id: 10, name: 'Penne Arrabiata', category: 'Pasta', price: 12.49, image: 'assets/images/food/pepperoni.png', description: 'Spicy tomato sauce, garlic, herbs', popular: false },
  { id: 11, name: 'Fettuccine Alfredo', category: 'Pasta', price: 13.49, image: 'assets/images/food/pepperoni.png', description: 'Rich cream sauce, parmesan cheese', popular: true },
  { id: 12, name: 'Lasagna', category: 'Pasta', price: 14.99, image: 'assets/images/food/pepperoni.png', description: 'Layered pasta, beef, ricotta, mozzarella', popular: false },

  { id: 13, name: 'Caesar Salad', category: 'Salads', price: 8.99, image: 'assets/images/food/pepperoni.png', description: 'Romaine, croutons, parmesan, caesar dressing', popular: true },
  { id: 14, name: 'Greek Salad', category: 'Salads', price: 9.49, image: 'assets/images/food/pepperoni.png', description: 'Feta, olives, cucumber, tomatoes', popular: false },
  { id: 15, name: 'Caprese Salad', category: 'Salads', price: 10.99, image: 'assets/images/food/pepperoni.png', description: 'Fresh mozzarella, tomatoes, basil', popular: false },

  { id: 16, name: 'Coca Cola', category: 'Drinks', price: 2.99, image: 'assets/images/food/pepperoni.png', description: 'Classic cola, 500ml', popular: true },
  { id: 17, name: 'Fresh Lemonade', category: 'Drinks', price: 3.49, image: 'assets/images/food/pepperoni.png', description: 'Freshly squeezed lemon juice', popular: true },
  { id: 18, name: 'Iced Tea', category: 'Drinks', price: 2.99, image: 'assets/images/food/pepperoni.png', description: 'Peach iced tea', popular: false },

  { id: 19, name: 'Chocolate Cake', category: 'Desserts', price: 6.99, image: 'assets/images/food/pepperoni.png', description: 'Rich chocolate layer cake', popular: true },
  { id: 20, name: 'Tiramisu', category: 'Desserts', price: 7.49, image: 'assets/images/food/pepperoni.png', description: 'Italian coffee-flavored dessert', popular: true },
];

const categories = ['All', 'Pizza', 'Burgers', 'Pasta', 'Salads', 'Drinks', 'Desserts'];

// Main App Component
export default function RestaurantApp() {
  // Multi-Tenant state for Navigation Bar & Application
  const [selectedTenantCode, setSelectedTenantCode] = useState('BOGO');
  const activeTenant = TENANTS.find(t => t.code === selectedTenantCode) || TENANTS[0];
  // Authentication state (gate before main page)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bplo_currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  // Application Tracker and e-AR Receipt state
  const [trackerOpen, setTrackerOpen] = useState(false);
  const [trackerInitialRef, setTrackerInitialRef] = useState('');
  const [activeReceiptData, setActiveReceiptData] = useState(null);
  const [editingApplication, setEditingApplication] = useState(null);

  const handleEditApplication = (appData) => {
    setEditingApplication(appData);
    setTrackerOpen(false);
    setActiveReceiptData(null);
    setViewMode('applicant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Role-based View Mode: 'applicant' or 'admin'
  const [viewMode, setViewMode] = useState(() => {
    return currentUser?.role === 'admin' ? 'admin' : 'applicant';
  });

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      setViewMode('admin');
    } else {
      setViewMode('applicant');
    }
  }, [currentUser]);

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
  };
  const [cartItems, setCartItems] = useState([]);
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [pendingOrderNumber, setPendingOrderNumber] = useState(null);

  // Products state
  const [menuData, setMenuData] = useState(fallbackMenuData);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  // Check URL parameters for payment status (after GCash redirect)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const payment = urlParams.get('payment');
    const orderNumber = urlParams.get('order');

    if (payment && orderNumber) {
      setPaymentStatus(payment);
      setPendingOrderNumber(orderNumber);
      setCurrentPage(payment === 'success' ? 'confirmation' : 'payment-failed');
      // Clear cart if payment successful
      if (payment === 'success') {
        setCartItems([]);
        localStorage.removeItem('pendingOrder');
      }
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Fetch products from Google Sheets on mount
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoadingProducts(true);
        setProductsError(null);

        const response = await fetch(GOOGLE_SCRIPT_URL);
        const data = await response.json();

        if (data.success && data.products && data.products.length > 0) {
          setMenuData(data.products);
        } else {
          setMenuData(fallbackMenuData);
          setProductsError('Using offline menu data');
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        setMenuData(fallbackMenuData);
        setProductsError('Using offline menu data');
      } finally {
        setIsLoadingProducts(false);
      }
    };

    fetchProducts();
  }, []);

  // Initialize OneSignal Push Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && window.OneSignalDeferred) {
      window.OneSignalDeferred = window.OneSignalDeferred || [];
      window.OneSignalDeferred.push(async function(OneSignal) {
        await OneSignal.init({
          appId: "22fa0af9-4790-4b61-9f6d-573237f0585d", // Replace with your OneSignal App ID
          notifyButton: {
            enable: true,
            size: 'small',
            position: 'bottom-right',
            prenotify: true,
            showCredit: false,
            text: {
              'tip.state.unsubscribed': 'Get order updates',
              'tip.state.subscribed': 'You\'re subscribed!',
              'tip.state.blocked': 'Notifications blocked',
              'message.prenotify': 'Click to receive order updates',
              'message.action.subscribed': 'Thanks for subscribing!',
              'dialog.main.title': 'Manage Notifications',
              'dialog.main.button.subscribe': 'SUBSCRIBE',
              'dialog.main.button.unsubscribe': 'UNSUBSCRIBE',
            }
          },
          welcomeNotification: {
            title: "Welcome to Kuchefnero!",
            message: "You'll receive order updates here."
          }
        });
      });
    }
  }, []);

  // Clear cart function
  const clearCart = () => {
    setCartItems([]);
  };

  const addToCart = (item, selectedSize = null) => {
    console.log('addToCart called:', { item, selectedSize, hasSizes: !!item.sizes });

    // For items with sizes, we need size info
    if (item.sizes && !selectedSize) {
      console.log('Opening size modal for:', item.name);
      setSelectedProduct(item);
      setShowSizeModal(true);
      return;
    }

    // Create cart item with size info if applicable
    const cartItem = selectedSize
      ? { ...item, selectedSize: selectedSize.name, price: selectedSize.price, displayName: `${item.name} (${selectedSize.name})` }
      : item;

    // Find existing item by id AND size (if applicable)
    const existingItem = cartItems.find(i =>
      i.id === item.id && (!selectedSize || i.selectedSize === selectedSize.name)
    );

    if (existingItem) {
      setCartItems(cartItems.map(i =>
        (i.id === item.id && (!selectedSize || i.selectedSize === selectedSize.name))
          ? { ...i, quantity: i.quantity + 1 }
          : i
      ));
    } else {
      setCartItems([...cartItems, { ...cartItem, quantity: 1 }]);
    }

    // Close modal if it was open
    setShowSizeModal(false);
    setSelectedProduct(null);
  };

  const removeFromCart = (id, selectedSize = null) => {
    setCartItems(cartItems.filter(item =>
      !(item.id === id && (!selectedSize || item.selectedSize === selectedSize))
    ));
  };

  const updateQuantity = (id, newQuantity, selectedSize = null) => {
    if (newQuantity === 0) {
      removeFromCart(id, selectedSize);
    } else {
      setCartItems(cartItems.map(item =>
        (item.id === id && (!selectedSize || item.selectedSize === selectedSize))
          ? { ...item, quantity: newQuantity }
          : item
      ));
    }
  };

  const getTotalItems = () => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const contextValue = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    getTotalPrice
  };

  // Gate: Show Login / Sign Up screen if not authenticated
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex flex-col font-['Poppins',sans-serif]">
        <AppNavbar
          activeTenant={activeTenant}
          selectedTenantCode={selectedTenantCode}
          onTenantChange={setSelectedTenantCode}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenTracker={() => setTrackerOpen(prev => !prev)}
          isTrackerActive={trackerOpen}
          onQuickStaffLogin={() => {
            const adminUser = {
              id: 'demo-admin',
              email: 'admin@bogo.gov.ph',
              fullName: 'LGU BPLO Administrator',
              role: 'admin',
              isDemo: true
            };
            setCurrentUser(adminUser);
            setViewMode('admin');
            try {
              localStorage.setItem('bplo_currentUser', JSON.stringify(adminUser));
            } catch (e) {
              console.warn(e);
            }
          }}
        />
        <main className="flex-1 py-4 px-2 sm:px-4 flex flex-col">
          {trackerOpen ? (
            <ApplicationTracker
              initialReferenceNo={trackerInitialRef}
              onClose={() => {
                setTrackerOpen(false);
                setTrackerInitialRef('');
              }}
              onViewReceipt={(data) => setActiveReceiptData(data)}
              onEditApplication={handleEditApplication}
              activeTenant={activeTenant}
            />
          ) : (
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
          )}
        </main>

        {/* Global Acknowledgement Receipt Modal */}
        {activeReceiptData && (
          <AcknowledgementReceiptModal
            receiptData={activeReceiptData}
            onClose={() => setActiveReceiptData(null)}
            onOpenTracker={(ref) => {
              setTrackerInitialRef(ref);
              setTrackerOpen(true);
            }}
            onEditApplication={handleEditApplication}
            activeTenant={activeTenant}
          />
        )}
      </div>
    );
  }

  return (
    <CartContext.Provider value={contextValue}>
      <div className="min-h-screen bg-slate-50 flex flex-col font-['Poppins',sans-serif]">
        <AppNavbar
          activeTenant={activeTenant}
          selectedTenantCode={selectedTenantCode}
          onTenantChange={setSelectedTenantCode}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenTracker={() => setTrackerOpen(prev => !prev)}
          isTrackerActive={trackerOpen}
          viewMode={viewMode}
          onToggleViewMode={() => {
            setTrackerOpen(false);
            setViewMode(v => v === 'admin' ? 'applicant' : 'admin');
          }}
        />
        <main className="flex-1 py-4 px-2 sm:px-4">
          {trackerOpen ? (
            <ApplicationTracker
              initialReferenceNo={trackerInitialRef}
              onClose={() => {
                setTrackerOpen(false);
                setTrackerInitialRef('');
              }}
              onViewReceipt={(data) => setActiveReceiptData(data)}
              onEditApplication={handleEditApplication}
              activeTenant={activeTenant}
              isEvaluationAdmin={viewMode === 'admin'}
            />
          ) : viewMode === 'admin' ? (
            <AdminEvaluationDashboard
              currentUser={currentUser}
              activeTenant={activeTenant}
              onSwitchToApplicantView={() => setViewMode('applicant')}
            />
          ) : (
            <BusinessPermitForm
              currentUser={currentUser}
              onLogout={handleLogout}
              selectedTenantCode={selectedTenantCode}
              setSelectedTenantCode={setSelectedTenantCode}
              onSubmissionSuccess={(receipt) => {
                setActiveReceiptData(receipt);
                setEditingApplication(null);
              }}
              editingApplication={editingApplication}
              onCancelEdit={() => setEditingApplication(null)}
            />
          )}
        </main>

        {/* Global Acknowledgement Receipt Modal */}
        {activeReceiptData && (
          <AcknowledgementReceiptModal
            receiptData={activeReceiptData}
            onClose={() => setActiveReceiptData(null)}
            onOpenTracker={(ref) => {
              setTrackerInitialRef(ref);
              setTrackerOpen(true);
            }}
            onEditApplication={handleEditApplication}
            activeTenant={activeTenant}
          />
        )}
      </div>
    </CartContext.Provider>
  );
}

// Size Selection Modal
function SizeModal({ product, onClose, onSelectSize }) {
  console.log('SizeModal rendering with product:', product);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-fadeIn">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-all"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="text-2xl font-black text-green-600 mb-2">Select Size</h2>
        <p className="text-gray-600 font-bold mb-6">{product.name}</p>

        <div className="space-y-3">
          {product.sizes.map((size) => (
            <button
              key={size.name}
              onClick={() => onSelectSize(size)}
              className="w-full bg-gray-50 hover:bg-green-50 border-2 border-gray-200 hover:border-green-600 rounded-lg p-4 flex items-center justify-between transition-all group"
            >
              <span className="font-bold text-gray-800 group-hover:text-green-600">{size.name}</span>
              <span className="text-xl font-black text-green-600">Php {size.price.toFixed(2)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Header Component
function Header({ currentPage, setCurrentPage, setShowCart, searchQuery, setSearchQuery }) {
  const { getTotalItems } = useCart();

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="bg-green-600">
        <div className="w-full px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentPage('home')}>
              <div className="text-4xl font-black text-white drop-shadow-lg">K</div>
              <div>
                <h1 className="text-xl font-black text-white drop-shadow-lg tracking-wider">Kuchefnero.ph</h1>
                <p className="text-[9px] text-white font-bold">Food Ordering System (ver 1.0)</p>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-md mx-6 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-5 h-5" />
              <input
                type="text"
                placeholder="Search for food..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value && currentPage !== 'menu') setCurrentPage('menu');
                }}
                className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-green-500 focus:border-green-700 focus:outline-none font-bold text-green-800 bg-green-100 placeholder-green-700/50"
              />
            </div>

            <nav className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => setCurrentPage('home')}
                className={`font-black transition-all px-4 py-2 rounded-lg text-sm tracking-wider ${currentPage === 'home' ? 'bg-green-400 text-green-700' : 'text-green-400 hover:bg-green-700'}`}
              >
                HOME
              </button>
              <button
                onClick={() => setCurrentPage('menu')}
                className={`font-black transition-all px-4 py-2 rounded-lg text-sm tracking-wider ${currentPage === 'menu' ? 'bg-green-400 text-green-700' : 'text-green-400 hover:bg-green-700'}`}
              >
                MENU
              </button>
            </nav>

            <button
              onClick={() => setShowCart(true)}
              className="relative bg-green-400 text-white px-6 py-2 rounded-full hover:shadow-2xl transition-all flex items-center space-x-2 shadow-lg hover:scale-105 font-black text-sm"
            >
              <ShoppingCart className="w-5 h-5" />
              <span>CART</span>
              {getTotalItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-600 text-white text-xs w-6 h-6 rounded-full flex items-center justify-center font-black animate-bounce">
                  {getTotalItems()}
                </span>
              )}
            </button>
          </div>

          <div className="mt-3 md:hidden relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-green-700 w-5 h-5" />
            <input
              type="text"
              placeholder="Search for food..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value && currentPage !== 'menu') setCurrentPage('menu');
              }}
              className="w-full pl-10 pr-4 py-2 rounded-full border-2 border-green-500 focus:border-green-700 focus:outline-none font-bold text-green-800 bg-green-100 placeholder-green-700/50"
            />
          </div>
        </div>
      </div>
      {/* Brush stroke edge */}
      <svg className="w-full h-5 -mt-px" viewBox="0 0 1440 20" preserveAspectRatio="none">
        <path fill="#007A33" d="M0,0 L0,10 C40,14 60,8 100,12 C160,18 200,6 280,14 C340,20 400,8 480,11 C560,14 600,6 680,10 C760,15 820,5 900,12 C960,17 1020,7 1100,10 C1180,13 1240,6 1320,11 C1380,15 1420,8 1440,10 L1440,0 Z" />
        <path fill="#007A33" opacity="0.7" d="M0,0 L0,6 C60,10 100,4 160,8 C240,14 300,4 380,9 C460,14 520,5 600,8 C680,12 740,4 820,7 C900,11 960,3 1040,8 C1120,12 1180,5 1260,7 C1340,10 1400,4 1440,6 L1440,0 Z" />
      </svg>
    </header>
  );
}

// Home Page
function HomePage({ setCurrentPage, menuData, isLoading }) {
  const popularItems = menuData.filter(item => item.popular).slice(0, 6);
  const [currentSlide, setCurrentSlide] = useState(0);

  const heroSlides = [
    {
      title: "TASTE THE SUCCESS",
      subtitle: "DELIVERED FAST!",
      description: "Order your favorite meals and get them delivered hot and fresh",
      bgImage: "assets/images/hero/hero1.jpg"
    },
    {
      title: "FRESH & DELICIOUS",
      subtitle: "EVERY TIME!",
      description: "Made with quality ingredients, cooked with passion",
      bgImage: "assets/images/hero/hero1.jpg"
    },
    {
      title: "30 MINUTES OR LESS",
      subtitle: "GUARANTEED!",
      description: "Fast delivery right to your doorstep",
      bgImage: "assets/images/hero/hero1.jpg"
    },
    {
      title: "ORDER NOW",
      subtitle: "PAY LATER!",
      description: "Multiple payment options available for your convenience",
      bgImage: "assets/images/hero/hero1.jpg"
    }
  ];

  // Auto-rotate carousel every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  return (
    <div>
      {/* Hero Carousel Section */}
      <section className="relative overflow-hidden">
        <div className="relative h-[307px] md:h-[400px]">
          {heroSlides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 text-white transition-all duration-700 ease-in-out transform ${
                index === currentSlide
                  ? 'translate-x-0 opacity-100'
                  : index < currentSlide
                  ? '-translate-x-full opacity-0'
                  : 'translate-x-full opacity-0'
              }`}
              style={{
                backgroundImage: `url(${slide.bgImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <div className="absolute inset-0 bg-black bg-opacity-50"></div>
              <div className="relative w-full px-8 h-full flex flex-col justify-center items-center text-center" >
                <h1 className="text-3xl md:text-5xl font-black mb-4 drop-shadow-lg animate-fadeIn">
                  {slide.title}
                  <br />
                  <span className="text-yellow-300">{slide.subtitle}</span>
                </h1>
                <p className="text-sm md:text-lg mb-8 text-white font-bold animate-fadeIn">
                  {slide.description}
                </p>
                <button
                  onClick={() => setCurrentPage('menu')}
                  className="bg-yellow-400 text-gray-900 px-8 py-4 rounded-lg text-sm font-black hover:bg-yellow-300 transition-all shadow-xl hover:shadow-2xl inline-flex items-center space-x-2 tracking-wider animate-fadeIn hover:scale-105"
                >
                  <span>ORDER NOW</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10 hover:scale-110"
          aria-label="Previous slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full transition-all z-10 hover:scale-110"
          aria-label="Next slide"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Dots Navigation */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-3 z-10">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`transition-all duration-300 rounded-full ${
                index === currentSlide
                  ? 'bg-white w-8 h-3'
                  : 'bg-white/50 hover:bg-white/75 w-3 h-3'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Popular Items */}
      <section className="bg-gray-50 py-12 sm:py-16">
        <div className="w-full px-8">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-green-600 mb-8 sm:mb-12 text-center drop-shadow-lg">⭐ POPULAR NOW</h2>
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-xl text-green-600 font-bold">Loading popular items...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {popularItems.map(item => (
                <PopularItemCard key={item.id} item={item} />
              ))}
            </div>
            <div className="text-center mt-8 sm:mt-12">
              <button
                onClick={() => setCurrentPage('menu')}
                className="bg-red-600 text-white px-8 py-3 rounded-lg font-black hover:bg-red-700 transition-all shadow-lg text-sm tracking-wider"
              >
                VIEW FULL MENU
              </button>
            </div>
          </>
        )}
        </div>
      </section>

      {/* Features & Contact Info */}
      <section className="bg-gray-50 py-2">
        <div className="w-full px-8">
          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center mb-16">
            <div className="bg-green-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4">🚀</div>
              <h3 className="text-xl font-black text-white mb-2">FAST DELIVERY</h3>
              <p className="text-green-100 font-bold">Get your food delivered in 30 minutes or less</p>
            </div>
            <div className="bg-green-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4">👨‍🍳</div>
              <h3 className="text-xl font-black text-white mb-2">FRESH FOOD</h3>
              <p className="text-green-100 font-bold">Made fresh daily with quality ingredients</p>
            </div>
            <div className="bg-green-600 p-8 rounded-xl shadow-lg hover:shadow-xl transition-all">
              <div className="text-6xl mb-4">⭐</div>
              <h3 className="text-xl font-black text-white mb-2">BEST QUALITY</h3>
              <p className="text-green-100 font-bold">Rated 4.9/5 by our satisfied customers</p>
            </div>
          </div>

          {/* Contact & Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-left border-t-2 border-green-300 pt-6">
            {/* About */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">ABOUT US</h4>
              <p className="text-gray-700 text-sm leading-relaxed">
                Kuchefnero delivers delicious food right to your doorstep. Quality ingredients, fast service, and satisfied customers since 2020.
              </p>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">CONTACT</h4>
              <div className="space-y-3 text-gray-700 text-sm">
                <div className="flex items-start space-x-2">
                  <span>📍</span>
                  <span>Cantecson,Gairan,Bogo,Cebu,Philippines</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📞</span>
                  <span>+63 912 345 6789</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span>📧</span>
                  <span>hello@kuchefnero.com</span>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">HOURS</h4>
              <div className="space-y-2 text-gray-700 text-sm">
                <div className="flex justify-between">
                  <span>Monday - Friday:</span>
                  <span>9AM - 11PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday:</span>
                  <span>10AM - 12AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday:</span>
                  <span>10AM - 10PM</span>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h4 className="text-xl font-black text-green-600 mb-4">FOLLOW US</h4>
              <div className="flex space-x-4 mb-4">
                <a href="#" className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-xl transition-all">
                  📘
                </a>
                <a href="#" className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-xl transition-all">
                  📷
                </a>
                <a href="#" className="w-10 h-10 bg-green-600 hover:bg-green-500 rounded-full flex items-center justify-center text-white text-xl transition-all">
                  🐦
                </a>
              </div>
              <div className="text-gray-700 text-sm">
                <p className="mb-2">Subscribe to our newsletter:</p>
                <div className="flex space-x-2">
                  <input 
                    type="email" 
                    placeholder="Your email" 
                    className="flex-1 px-3 py-2 rounded-lg text-gray-800 text-xs font-bold"
                  />
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-black text-xs transition-all">
                    GO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="border-t-2 border-green-300 mt-12 pt-8 text-center">
            <p className="text-gray-600 text-sm">
              © 2026 Kuchefnero. All rights reserved. |
              <a href="#" className="hover:text-green-600 transition-all ml-1">Privacy Policy</a> |
              <a href="#" className="hover:text-green-600 transition-all ml-1">Terms of Service</a>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

// Popular Item Card
function PopularItemCard({ item }) {
  const { addToCart } = useCart();

  return (
    <div className="bg-gray-50 rounded-xl shadow-lg hover:shadow-2xl transition-all overflow-hidden group w-full h-96 flex flex-col">
      <div className="bg-gray-50 p-4 text-center flex-1 flex flex-col justify-center">
        {item.image && item.image.startsWith('assets/') ? (
          <img src={item.image} alt={item.name} className="object-contain mx-auto rounded-lg h-48 w-48 group-hover:scale-110 transition-transform bg-gray-50" />
        ) : (
          <div className="text-9xl group-hover:scale-110 transition-transform">{item.image}</div>
        )}
      </div>
      <div className="p-6 flex flex-col justify-between h-40">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-green-600">{item.name}</h3>
          <span className="bg-green-600 text-white px-3 py-1 rounded-full text-xs font-black whitespace-nowrap">POPULAR</span>
        </div>
        <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-2 font-normal">{item.description}</p>
        <div className="flex items-center justify-between gap-2">
          {item.sizes ? (
            <span className="text-sm sm:text-base md:text-lg font-semibold text-green-600 whitespace-nowrap flex-shrink-0">
              From Php {Math.min(...item.sizes.map(s => s.price)).toFixed(2)}
            </span>
          ) : (
            <span className="text-sm sm:text-base md:text-lg font-semibold text-green-600 whitespace-nowrap flex-shrink-0">Php {item.price.toFixed(2)}</span>
          )}
          <button
            onClick={() => addToCart(item)}
            className="bg-green-600 text-white px-4 sm:px-5 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center space-x-1 font-bold text-sm hover:scale-105 whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Menu Page
function MenuPage({ selectedCategory, setSelectedCategory, searchQuery, menuData, isLoading }) {
  const filteredItems = menuData.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Category Filter - Right below header */}
      <div className="bg-white shadow-md sticky top-[140px] md:top-[100px] z-40">
        <div className="w-full px-8">
          <div className="flex overflow-x-auto space-x-1 py-3 scrollbar-hide">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-2 rounded-md font-medium whitespace-nowrap transition-all text-xs tracking-wide ${
                  selectedCategory === category
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="w-full px-8 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-green-600 mb-6 sm:mb-8 text-center">OUR MENU</h1>

        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
            <p className="text-xl text-green-600 font-bold">Loading menu...</p>
          </div>
        ) : (
          <>
            {/* Menu Grid - Optimized for horizontal cards */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 lg:gap-5">
              {filteredItems.map(item => (
                <MenuItem key={item.id} item={item} />
              ))}
            </div>

            {filteredItems.length === 0 && (
              <div className="text-center py-16">
                <p className="text-2xl text-gray-400">No items found</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Menu Item Card
function MenuItem({ item }) {
  const { addToCart } = useCart();

  return (
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all overflow-hidden group w-full flex flex-row h-auto min-h-[273px] sm:min-h-[293px]">
        {/* Left side - Product Image */}
        <div className="bg-gray-50 p-3 sm:p-4 flex items-center justify-center w-48 sm:w-54 md:w-60 flex-shrink-0 relative">
          {item.image && item.image.startsWith('assets/') ? (
            <img src={item.image} alt={item.name} className="object-contain w-full h-48 sm:h-54 md:h-60 rounded-lg group-hover:scale-110 transition-transform duration-300" />
          ) : (
            <div className="text-7xl sm:text-8xl md:text-9xl group-hover:scale-110 transition-transform duration-300">{item.image}</div>
          )}
          {item.popular && (
            <span className="absolute top-1 right-1 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-black">
            HOT
          </span>
        )}
      </div>

      {/* Right side - Product Details */}
      <div className="p-4 sm:p-5 md:p-6 flex flex-col justify-start flex-1 min-w-0">
        <div className="mb-4">
          <h3 className="text-base sm:text-lg md:text-xl font-bold text-green-600 mb-2 break-words">{item.name}</h3>
          <p className="text-gray-600 text-sm sm:text-base mb-3 line-clamp-2 font-normal">{item.description}</p>
        </div>
        <div className="flex flex-col gap-2 mt-auto">
          {item.sizes ? (
            <span className="text-sm sm:text-base md:text-lg font-semibold text-green-600 break-words">
              From Php {Math.min(...item.sizes.map(s => s.price)).toFixed(2)}
            </span>
          ) : (
            <span className="text-sm sm:text-base md:text-lg font-semibold text-green-600 break-words">Php {item.price.toFixed(2)}</span>
          )}
          <button
            onClick={() => addToCart(item)}
            className="bg-green-600 text-white px-4 sm:px-5 py-3 rounded-lg hover:bg-green-700 transition-all flex items-center justify-center space-x-1 text-sm font-bold hover:scale-105 w-full whitespace-nowrap"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// Cart Drawer
function CartDrawer({ setShowCart, setCurrentPage }) {
  const { cartItems } = useCart();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end" onClick={() => setShowCart(false)}>
      <div className="bg-gray-100 w-full max-w-md h-full overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Your Cart</h2>
            <button onClick={() => setShowCart(false)} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-6">
                {cartItems.map((item, index) => (
                  <CartItemCard key={`${item.id}-${item.selectedSize || 'default'}-${index}`} item={item} />
                ))}
              </div>
              <button 
                onClick={() => {
                  setShowCart(false);
                  setCurrentPage('cart');
                }}
                className="w-full bg-green-600 text-white py-4 rounded-full font-bold hover:bg-green-700 transition-all"
              >
                View Full Cart
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Cart Page
function CartPage({ setCurrentPage }) {
  const { cartItems, getTotalPrice } = useCart();
  const deliveryFee = 4.99;
  const tax = getTotalPrice() * 0.08;
  const total = getTotalPrice() + deliveryFee + tax;

  if (cartItems.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="w-full px-8 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium text-gray-800 mb-2">Your cart is empty</h2>
          <p className="text-sm text-gray-500 mb-6">Add some items to get started</p>
          <button
            onClick={() => setCurrentPage('menu')}
            className="bg-green-600 text-white px-6 py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition-all"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="w-full px-8">
        <h1 className="text-2xl font-medium text-gray-800 mb-8 text-center">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-3">
            {cartItems.map((item, index) => (
              <CartItemCard key={`${item.id}-${item.selectedSize || 'default'}-${index}`} item={item} detailed />
            ))}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-5 sticky top-[160px] md:top-[120px]">
              <h3 className="text-base font-medium text-gray-800 mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>Php {getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Delivery Fee</span>
                  <span>Php {deliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax (8%)</span>
                  <span>Php {tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 mt-2">
                  <div className="flex justify-between text-base font-medium">
                    <span>Total</span>
                    <span className="text-green-600">Php {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setCurrentPage('checkout')}
                className="w-full bg-green-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition-all"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Cart Item Card
function CartItemCard({ item, detailed = false }) {
  const { updateQuantity, removeFromCart } = useCart();

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
      <div className="bg-gray-50 rounded-md flex items-center justify-center w-16 h-16">
        {item.image && item.image.startsWith('assets/') ? (
          <img src={item.image} alt={item.name} className="object-contain w-full h-full rounded" />
        ) : (
          <div className="text-3xl">{item.image}</div>
        )}
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-800 text-sm">{item.name}</h3>
        {item.selectedSize && <p className="text-gray-400 text-xs">Size: {item.selectedSize}</p>}
        <p className="text-green-600 font-medium text-sm">Php {item.price.toFixed(2)}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => updateQuantity(item.id, item.quantity - 1, item.selectedSize)}
          className="bg-gray-100 hover:bg-gray-200 rounded-md p-1.5 transition-all"
        >
          <Minus className="w-3 h-3 text-gray-600" />
        </button>
        <span className="font-medium text-sm w-6 text-center">{item.quantity}</span>
        <button
          onClick={() => updateQuantity(item.id, item.quantity + 1, item.selectedSize)}
          className="bg-green-600 hover:bg-green-700 text-white rounded-md p-1.5 transition-all"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {detailed && (
        <button
          onClick={() => removeFromCart(item.id, item.selectedSize)}
          className="text-gray-400 hover:text-red-500 p-1 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// Checkout Page
function CheckoutPage({ setCurrentPage, clearCart }) {
  const { getTotalPrice, cartItems } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    zipCode: '',
    paymentMethod: 'cash',
    paymentReference: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationStatus, setNotificationStatus] = useState('checking'); // 'checking', 'subscribed', 'not-subscribed', 'denied'

  // Check notification subscription status on mount
  useEffect(() => {
    const checkNotificationStatus = async () => {
      try {
        if (window.OneSignalDeferred) {
          window.OneSignalDeferred.push(async function(OneSignal) {
            const permission = await OneSignal.Notifications.permission;
            const playerId = await OneSignal.User.PushSubscription.id;

            if (permission === false) {
              setNotificationStatus('denied');
            } else if (playerId) {
              setNotificationStatus('subscribed');
            } else {
              setNotificationStatus('not-subscribed');
            }
          });
        } else {
          setNotificationStatus('not-subscribed');
        }
      } catch (err) {
        console.log('Error checking notification status:', err);
        setNotificationStatus('not-subscribed');
      }
    };

    checkNotificationStatus();
  }, []);

  // Function to request notification permission
  const requestNotificationPermission = async () => {
    try {
      if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async function(OneSignal) {
          await OneSignal.Notifications.requestPermission();
          // Check status after requesting
          const playerId = await OneSignal.User.PushSubscription.id;
          if (playerId) {
            setNotificationStatus('subscribed');
          } else {
            const permission = await OneSignal.Notifications.permission;
            if (permission === false) {
              setNotificationStatus('denied');
            }
          }
        });
      }
    } catch (err) {
      console.log('Error requesting notification permission:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate payment reference for Bank Transfer only (GCash uses PayMongo)
    if (formData.paymentMethod === 'bank' && !formData.paymentReference.trim()) {
      alert('Please enter the Bank reference number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const deliveryFee = 4.99;
      const tax = getTotalPrice() * 0.08;
      const total = getTotalPrice() + deliveryFee + tax;

      // Format cart items as a string
      const itemsList = cartItems.map(item =>
        `${item.name}${item.selectedSize ? ` (${item.selectedSize})` : ''} (x${item.quantity}) - Php ${(item.price * item.quantity).toFixed(2)}`
      ).join(', ');

      // Format payment method display
      let paymentMethodDisplay = formData.paymentMethod;
      if (formData.paymentMethod === 'cash') {
        paymentMethodDisplay = 'Cash on Delivery';
      } else if (formData.paymentMethod === 'gcash') {
        paymentMethodDisplay = 'GCash';
      } else if (formData.paymentMethod === 'bank') {
        paymentMethodDisplay = `Bank Transfer (Ref: ${formData.paymentReference})`;
      }

      // Get OneSignal Player ID for customer notifications
      let playerId = null;
      try {
        if (window.OneSignalDeferred) {
          await new Promise((resolve) => {
            window.OneSignalDeferred.push(async function(OneSignal) {
              playerId = await OneSignal.User.PushSubscription.id;
              resolve();
            });
          });
        }
      } catch (err) {
        console.log('Could not get OneSignal player ID:', err);
      }

      // Send data to Google Sheets
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        body: JSON.stringify({
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          barangay: formData.zipCode,
          paymentMethod: paymentMethodDisplay,
          paymentReference: formData.paymentReference || 'N/A',
          playerId: playerId || '',
          items: itemsList,
          subtotal: getTotalPrice().toFixed(2),
          deliveryFee: deliveryFee.toFixed(2),
          tax: tax.toFixed(2),
          total: total.toFixed(2)
        })
      });

      const result = await response.json();

      if (result.success) {
        // If GCash payment, redirect to PayMongo checkout
        if (result.requiresPayment && result.paymentUrl) {
          // Store order number for later reference
          localStorage.setItem('pendingOrder', result.orderNumber);
          // Redirect to GCash payment page
          window.location.href = result.paymentUrl;
        } else {
          // Clear cart and go to confirmation for non-GCash payments
          if (clearCart) clearCart();
          setCurrentPage('confirmation');
        }
      } else {
        alert('Error: ' + (result.error || 'Failed to process order'));
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('There was an error processing your order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = 4.99;
  const tax = getTotalPrice() * 0.08;
  const total = getTotalPrice() + deliveryFee + tax;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="w-full px-8">
        <h1 className="text-2xl font-medium text-gray-800 mb-8 text-center">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-6 space-y-6">
            <div>
              <h3 className="text-base font-medium text-gray-700 mb-4">Delivery Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:outline-none text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:outline-none text-sm"
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:outline-none text-sm"
                />
                <input
                  type="text"
                  placeholder="ZIP Code"
                  required
                  value={formData.zipCode}
                  onChange={(e) => setFormData({...formData, zipCode: e.target.value})}
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:outline-none text-sm"
                />
              </div>
              <input
                type="text"
                placeholder="Street Address"
                required
                value={formData.address}
                onChange={(e) => setFormData({...formData, address: e.target.value})}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:outline-none text-sm mt-3"
              />
              <input
                type="text"
                placeholder="City"
                required
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-green-500 focus:outline-none text-sm mt-3"
              />
            </div>

            {/* Notification Subscription Prompt */}
            {notificationStatus === 'checking' && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                  <span className="text-sm text-gray-600">Checking notification status...</span>
                </div>
              </div>
            )}

            {notificationStatus !== 'subscribed' && notificationStatus !== 'checking' && (
              <div className={`rounded-lg p-4 border-2 ${
                notificationStatus === 'denied'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-yellow-50 border-yellow-300'
              }`}>
                <div className="flex items-start gap-3">
                  <div className="text-2xl flex-shrink-0">
                    {notificationStatus === 'denied' ? '🔕' : '🔔'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-800 text-sm mb-1">
                      {notificationStatus === 'denied'
                        ? 'Notifications Blocked'
                        : 'Get Order Updates'}
                    </h4>
                    <p className="text-xs text-gray-600 mb-3">
                      {notificationStatus === 'denied'
                        ? 'You\'ve blocked notifications. Enable them in your browser settings to receive real-time order updates.'
                        : 'Enable push notifications to receive real-time updates when your order is being prepared, out for delivery, and delivered!'}
                    </p>
                    {notificationStatus === 'not-subscribed' && (
                      <button
                        type="button"
                        onClick={requestNotificationPermission}
                        className="bg-green-600 text-white px-4 py-2 rounded-md text-xs font-medium hover:bg-green-700 transition-all flex items-center gap-2"
                      >
                        <span>🔔</span>
                        <span>Enable Notifications</span>
                      </button>
                    )}
                    {notificationStatus === 'denied' && (
                      <p className="text-xs text-red-600 font-medium">
                        To enable: Click the lock icon in your browser's address bar → Allow notifications
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {notificationStatus === 'subscribed' && (
              <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h4 className="font-medium text-green-700 text-sm">Notifications Enabled</h4>
                    <p className="text-xs text-green-600">You'll receive updates when your order status changes!</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-base font-medium text-gray-700 mb-4">Payment Method</h3>
              <div className="space-y-2">
                <label className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-all ${
                  formData.paymentMethod === 'cash' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value, paymentReference: ''})}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700">Cash on Delivery</span>
                </label>

                <label className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-all ${
                  formData.paymentMethod === 'gcash' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="gcash"
                    checked={formData.paymentMethod === 'gcash'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700">GCash</span>
                </label>

                <label className={`flex items-center space-x-3 p-3 border rounded-md cursor-pointer transition-all ${
                  formData.paymentMethod === 'bank' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:bg-gray-50'
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="bank"
                    checked={formData.paymentMethod === 'bank'}
                    onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                    className="w-4 h-4 text-green-600"
                  />
                  <span className="text-sm text-gray-700">Bank Transfer</span>
                </label>
              </div>

              {/* Payment Instructions */}
              {formData.paymentMethod === 'cash' && (
                <div className="mt-4 bg-gray-50 border border-gray-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-700 text-sm mb-2">Cash on Delivery Instructions</h4>
                  <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                    <li>Prepare exact amount if possible</li>
                    <li>Payment will be collected upon delivery</li>
                    <li>Please have your order number ready</li>
                  </ul>
                </div>
              )}

              {formData.paymentMethod === 'gcash' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-700 text-sm mb-3">GCash Payment</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-md p-3 border border-green-100">
                      <p className="text-xs text-gray-500 mb-1">Amount to pay:</p>
                      <p className="text-lg font-medium text-green-600">Php {(getTotalPrice() + 4.99 + getTotalPrice() * 0.08).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Secure payment via PayMongo</span>
                    </div>
                    <div className="text-xs text-gray-600 bg-white rounded-md p-3 border border-green-100">
                      <p className="font-medium mb-2">How it works:</p>
                      <ol className="list-decimal list-inside space-y-1">
                        <li>Click "Place Order" below</li>
                        <li>You'll be redirected to GCash to complete payment</li>
                        <li>After payment, you'll return here automatically</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {formData.paymentMethod === 'bank' && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-md p-4">
                  <h4 className="font-medium text-gray-700 text-sm mb-3">Bank Transfer Instructions</h4>
                  <div className="space-y-3">
                    <div className="bg-white rounded-md p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 mb-2">Transfer to:</p>
                      <p className="text-xs text-gray-600">Bank: BDO</p>
                      <p className="text-xs text-gray-600">Account Name: Kuchefnero Restaurant</p>
                      <p className="text-base font-medium text-gray-800">Account #: 1234-5678-9012</p>
                    </div>
                    <div className="bg-white rounded-md p-3 border border-blue-100">
                      <p className="text-xs text-gray-500 mb-1">Amount to transfer:</p>
                      <p className="text-lg font-medium text-blue-600">Php {(getTotalPrice() + 4.99 + getTotalPrice() * 0.08).toFixed(2)}</p>
                    </div>
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-medium">After transfer:</p>
                      <ol className="list-decimal list-inside space-y-1 ml-2">
                        <li>Keep your bank receipt/confirmation</li>
                        <li>Enter the reference number below</li>
                        <li>Send photo of receipt to our contact number</li>
                      </ol>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter Bank Reference Number"
                      value={formData.paymentReference}
                      onChange={(e) => setFormData({...formData, paymentReference: e.target.value})}
                      className="w-full px-3 py-2 rounded-md border border-gray-300 focus:border-blue-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-md font-medium transition-all text-sm ${
                isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : `Place Order - Php ${total.toFixed(2)}`}
            </button>
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-5 sticky top-[160px] md:top-[120px]">
            <h3 className="text-base font-medium text-gray-800 mb-4">Order Summary</h3>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>Php {getTotalPrice().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Delivery Fee</span>
                <span>Php {deliveryFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tax (8%)</span>
                <span>Php {tax.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between text-base font-medium">
                  <span>Total</span>
                  <span className="text-green-600">Php {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

// Confirmation Page
function ConfirmationPage({ setCurrentPage, orderNumber, paymentStatus }) {
  // Generate order number if not provided (for non-GCash orders)
  const displayOrderNumber = orderNumber || `ORD-${Date.now()}`;

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="w-full px-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-gray-800 mb-1">
            {paymentStatus === 'success' ? 'Payment Successful!' : 'Order Confirmed'}
          </h1>
          <p className="text-sm text-gray-500">
            {paymentStatus === 'success' ? 'Your GCash payment has been received' : 'Thank you for your order'}
          </p>
        </div>

        {/* Order Number */}
        <div className="bg-green-600 rounded-lg p-4 mb-6 text-center">
          <div className="text-xs text-green-200 mb-1">Order Number</div>
          <div className="text-xl font-medium text-white">{displayOrderNumber}</div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg p-5 mb-6 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-4">Order Status</h3>

          <div className="space-y-0">
            {/* Order Confirmed */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="w-0.5 h-8 bg-green-500"></div>
              </div>
              <div className="pb-3">
                <div className="text-sm font-medium text-gray-800">Order Received</div>
                <div className="text-xs text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}, {new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</div>
              </div>
            </div>

            {/* Preparing */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full border-2 border-green-500 flex items-center justify-center flex-shrink-0">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
                <div className="w-0.5 h-8 bg-gray-200"></div>
              </div>
              <div className="pb-3">
                <div className="text-sm font-medium text-gray-800">Preparing your order</div>
                <div className="text-xs text-gray-500">Estimated: 15-20 mins</div>
              </div>
            </div>

            {/* Out for Delivery */}
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0"></div>
              </div>
              <div>
                <div className="text-sm text-gray-400">Out for delivery</div>
                <div className="text-xs text-gray-400">Estimated arrival: 25-30 mins</div>
              </div>
            </div>
          </div>
        </div>

        {/* SMS Notice */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500">You will receive a text message with delivery updates</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentPage('home')}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition-all"
          >
            Back to Home
          </button>
          <button
            onClick={() => setCurrentPage('menu')}
            className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-all"
          >
            Order Again
          </button>
        </div>
      </div>
    </div>
  );
}

// Payment Failed Page
function PaymentFailedPage({ setCurrentPage, orderNumber }) {
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="w-full px-8 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-xl font-medium text-gray-800 mb-1">Payment Failed</h1>
          <p className="text-sm text-gray-500">Your GCash payment was not completed</p>
        </div>

        {/* Order Number */}
        {orderNumber && (
          <div className="bg-gray-200 rounded-lg p-4 mb-6 text-center">
            <div className="text-xs text-gray-500 mb-1">Order Number</div>
            <div className="text-xl font-medium text-gray-700">{orderNumber}</div>
          </div>
        )}

        {/* Message */}
        <div className="bg-white rounded-lg p-5 mb-6 shadow-sm">
          <h3 className="text-base font-medium text-gray-800 mb-3">What happened?</h3>
          <p className="text-sm text-gray-600 mb-4">
            Your payment was cancelled or failed to process. Your order has been saved but is awaiting payment.
          </p>
          <h3 className="text-base font-medium text-gray-800 mb-3">What can you do?</h3>
          <ul className="text-sm text-gray-600 space-y-2">
            <li>• Try placing your order again with GCash</li>
            <li>• Choose a different payment method (Cash on Delivery)</li>
            <li>• Contact us if you need assistance</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setCurrentPage('checkout')}
            className="w-full bg-green-600 text-white py-2.5 rounded-md text-sm font-medium hover:bg-green-700 transition-all"
          >
            Try Again
          </button>
          <button
            onClick={() => setCurrentPage('home')}
            className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-md text-sm font-medium hover:bg-gray-200 transition-all"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}




const getInitialFormData = () => ({
  applicationType: 'New',
  amendmentType: '',
  modeOfPayment: 'Annually',
  transferLocation: false,
  businessStartDate: '',
  dateOfApplication: new Date().toISOString().split('T')[0],
  referenceNo: '',
  dtiSecCdaRegNo: '',
  dtiSecCdaRegDate: '',
  typeOfOrganization: 'Single',
  tinNo: '',
  ctcNo: '',
  hasTaxIncentive: false,
  taxIncentiveEntity: '',
  taxpayerLastName: '',
  taxpayerFirstName: '',
  taxpayerMiddleName: '',
  businessName: '',
  tradeNameFranchise: '',
  corpPresidentLastName: '',
  corpPresidentFirstName: '',
  corpPresidentMiddleName: '',
  busHouseBldgNo: '',
  busBuildingName: '',
  busStreet: '',
  busBarangay: '',
  busSubdivisionLandmark: '',
  busCityMunicipality: 'City of Bogo',
  busProvince: 'Cebu',
  busTelephoneNo: '',
  busEmailAddress: '',
  sameAsBusinessAddress: false,
  ownerHouseBldgNo: '',
  ownerBuildingName: '',
  ownerStreet: '',
  ownerBarangay: '',
  ownerSubdivisionLandmark: '',
  ownerCityMunicipality: '',
  ownerProvince: '',
  ownerTelephoneNo: '',
  ownerEmailAddress: '',
  numEmployeesMale: 0,
  numEmployeesFemale: 0,
  numEmployeesBogoResiding: 0,
  isRented: false,
  isMarketStall: false,
  isFranchisee: false,
  isRepresentative: false,
  representativeName: '',
  representativePosition: '',
  specialBusinessTypes: [],
  lessorName: '',
  monthlyRental: '',
  lessorAddress: '',
  lessorContactNo: '',
  lessorEmailAddress: '',
  emergencyContactPerson: '',
  emergencyContactNo: '',
  emergencyEmailAddress: '',
  businessActivities: [{ code: '', lineOfBusiness: '', noOfUnits: '', capitalization: '', grossEssential: '', grossNonEssential: '' }],
  uploadedDocuments: {},
  applicantSignatureName: ''
});

export function mapApplicationToFormData(app) {
  if (!app) return getInitialFormData();

  const val = (snake, camel, fallback = '') => {
    if (app[camel] !== undefined && app[camel] !== null) return app[camel];
    if (app[snake] !== undefined && app[snake] !== null) return app[snake];
    return fallback;
  };

  // Map business activities
  let activities = [];
  if (Array.isArray(app.business_activities) && app.business_activities.length > 0) {
    activities = app.business_activities.map(a => ({
      code: a.code || '',
      lineOfBusiness: a.line_of_business || a.lineOfBusiness || '',
      noOfUnits: a.no_of_units || a.noOfUnits || '',
      capitalization: a.capitalization || '',
      grossEssential: a.gross_essential || a.grossEssential || '',
      grossNonEssential: a.gross_non_essential || a.grossNonEssential || ''
    }));
  } else if (Array.isArray(app.businessActivities) && app.businessActivities.length > 0) {
    activities = app.businessActivities;
  } else {
    activities = [{ code: '', lineOfBusiness: '', noOfUnits: '', capitalization: '', grossEssential: '', grossNonEssential: '' }];
  }

  // Map documents
  let uploadedDocs = {};
  const rawDocs = app.documents || app.uploaded_documents || app.uploadedDocuments || [];
  if (Array.isArray(rawDocs)) {
    rawDocs.forEach((d, idx) => {
      const key = d.docId || d.id || `doc_${idx}`;
      uploadedDocs[key] = d;
    });
  } else if (rawDocs && typeof rawDocs === 'object') {
    uploadedDocs = rawDocs;
  }

  const refNo = val('reference_no', 'referenceNo', '');
  if (Object.keys(uploadedDocs).length === 0 && refNo) {
    try {
      const stored = localStorage.getItem(`bplo_docs_${refNo}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed.forEach((d, idx) => {
            uploadedDocs[d.docId || d.id || `doc_${idx}`] = d;
          });
        }
      }
    } catch(e) {}
  }

  return {
    referenceNo: refNo,
    applicationType: val('application_type', 'applicationType', 'New'),
    amendmentType: val('amendment_type', 'amendmentType', ''),
    modeOfPayment: val('mode_of_payment', 'modeOfPayment', 'Annually'),
    transferLocation: Boolean(val('transfer_location', 'transferLocation', false)),
    businessStartDate: val('business_start_date', 'businessStartDate', ''),
    dateOfApplication: val('date_of_application', 'dateOfApplication', new Date().toISOString().split('T')[0]),
    dtiSecCdaRegNo: val('dti_sec_cda_reg_no', 'dtiSecCdaRegNo', ''),
    dtiSecCdaRegDate: val('dti_sec_cda_reg_date', 'dtiSecCdaRegDate', ''),
    typeOfOrganization: val('type_of_organization', 'typeOfOrganization', 'Single'),
    tinNo: val('tin_no', 'tinNo', ''),
    hasTaxIncentive: Boolean(val('has_tax_incentive', 'hasTaxIncentive', false)),
    taxIncentiveEntity: val('tax_incentive_entity', 'taxIncentiveEntity', ''),
    ctcNo: val('ctc_no', 'ctcNo', ''),
    taxpayerLastName: val('taxpayer_last_name', 'taxpayerLastName', ''),
    taxpayerFirstName: val('taxpayer_first_name', 'taxpayerFirstName', ''),
    taxpayerMiddleName: val('taxpayer_middle_name', 'taxpayerMiddleName', ''),
    businessName: val('business_name', 'businessName', ''),
    tradeNameFranchise: val('trade_name_franchise', 'tradeNameFranchise', ''),
    corpPresidentLastName: val('corp_president_treasurer_last_name', 'corpPresidentLastName', ''),
    corpPresidentFirstName: val('corp_president_treasurer_first_name', 'corpPresidentFirstName', ''),
    corpPresidentMiddleName: val('corp_president_treasurer_middle_name', 'corpPresidentMiddleName', ''),
    busHouseBldgNo: val('bus_house_bldg_no', 'busHouseBldgNo', ''),
    busBuildingName: val('bus_building_name', 'busBuildingName', ''),
    busLotNo: val('bus_lot_no', 'busLotNo', ''),
    busBlockNo: val('bus_block_no', 'busBlockNo', ''),
    busStreet: val('bus_street', 'busStreet', ''),
    busBarangay: val('bus_barangay', 'busBarangay', ''),
    busSubdivisionLandmark: val('bus_subdivision_landmark', 'busSubdivisionLandmark', ''),
    busCityMunicipality: val('bus_city_municipality', 'busCityMunicipality', 'City of Bogo'),
    busProvince: val('bus_province', 'busProvince', 'Cebu'),
    busZipCode: val('bus_zip_code', 'busZipCode', ''),
    busTelephoneNo: val('bus_telephone_no', 'busTelephoneNo', ''),
    busMobileNo: val('bus_mobile_no', 'busMobileNo', ''),
    busEmailAddress: val('bus_email_address', 'busEmailAddress', ''),
    sameAsBusinessAddress: false,
    ownerHouseBldgNo: val('owner_house_bldg_no', 'ownerHouseBldgNo', ''),
    ownerBuildingName: val('owner_building_name', 'ownerBuildingName', ''),
    ownerStreet: val('owner_street', 'ownerStreet', ''),
    ownerBarangay: val('owner_barangay', 'ownerBarangay', ''),
    ownerSubdivisionLandmark: val('owner_subdivision_landmark', 'ownerSubdivisionLandmark', ''),
    ownerCityMunicipality: val('owner_city_municipality', 'ownerCityMunicipality', ''),
    ownerProvince: val('owner_province', 'ownerProvince', ''),
    ownerZipCode: val('owner_zip_code', 'ownerZipCode', ''),
    ownerTelephoneNo: val('owner_telephone_no', 'ownerTelephoneNo', ''),
    ownerMobileNo: val('owner_mobile_no', 'ownerMobileNo', ''),
    ownerEmailAddress: val('owner_email_address', 'ownerEmailAddress', ''),
    numEmployeesTotal: val('num_employees_total', 'numEmployeesTotal', 0),
    numEmployeesMale: val('num_employees_male', 'numEmployeesMale', 0),
    numEmployeesFemale: val('num_employees_female', 'numEmployeesFemale', 0),
    numEmployeesBogoResiding: val('num_employees_bogo_residing', 'numEmployeesBogoResiding', 0),
    isRented: Boolean(val('is_rented', 'isRented', false)),
    isMarketStall: Boolean(val('is_market_stall', 'isMarketStall', false)),
    isFranchisee: Boolean(val('is_franchisee', 'isFranchisee', false)),
    isRepresentative: Boolean(val('is_representative', 'isRepresentative', false)),
    representativeName: val('representative_name', 'representativeName', ''),
    representativePosition: val('representative_position', 'representativePosition', ''),
    specialBusinessTypes: val('special_business_types', 'specialBusinessTypes', []),
    lessorName: val('lessor_name', 'lessorName', ''),
    monthlyRental: val('monthly_rental', 'monthlyRental', ''),
    lessorAddress: val('lessor_address', 'lessorAddress', ''),
    lessorContactNo: val('lessor_contact_no', 'lessorContactNo', ''),
    lessorEmailAddress: val('lessor_email_address', 'lessorEmailAddress', ''),
    emergencyContactPerson: val('emergency_contact_person', 'emergencyContactPerson', ''),
    emergencyContactNo: val('emergency_contact_no', 'emergencyContactNo', ''),
    emergencyEmailAddress: val('emergency_email_address', 'emergencyEmailAddress', ''),
    businessActivities: activities,
    uploadedDocuments: uploadedDocs,
    applicantSignatureName: val('applicant_signature_name', 'applicantSignatureName', '')
  };
}

export function BusinessPermitForm({ 
  currentUser, 
  onLogout,
  selectedTenantCode: externalTenantCode,
  setSelectedTenantCode: externalSetTenantCode,
  onSubmissionSuccess,
  editingApplication,
  onCancelEdit
} = {}) {
  const [internalTenantCode, setInternalTenantCode] = useState('BOGO');
  const selectedTenantCode = externalTenantCode || internalTenantCode;
  const setSelectedTenantCode = externalSetTenantCode || setInternalTenantCode;
  const activeTenant = TENANTS.find(t => t.code === selectedTenantCode) || TENANTS[0];

  const [formData, setFormData] = useState(() => {
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
  });
  
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

  // Auto-load application data when editingApplication is provided
  useEffect(() => {
    if (editingApplication) {
      setFormData(mapApplicationToFormData(editingApplication));
      if (editingApplication.tenant_code && externalSetTenantCode) {
        externalSetTenantCode(editingApplication.tenant_code);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [editingApplication]);
  
  const [submitStatus, setSubmitStatus] = useState({ type: null, message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCopyBusinessAddress = (e) => {
    const isChecked = e.target.checked;
    setFormData(prev => ({
      ...prev,
      sameAsBusinessAddress: isChecked,
      ownerHouseBldgNo: isChecked ? prev.busHouseBldgNo : '',
      ownerBuildingName: isChecked ? prev.busBuildingName : '',
      ownerStreet: isChecked ? prev.busStreet : '',
      ownerBarangay: isChecked ? prev.busBarangay : '',
      ownerSubdivisionLandmark: isChecked ? prev.busSubdivisionLandmark : '',
      ownerCityMunicipality: isChecked ? prev.busCityMunicipality : '',
      ownerProvince: isChecked ? prev.busProvince : '',
      ownerTelephoneNo: isChecked ? prev.busTelephoneNo : '',
      ownerEmailAddress: isChecked ? prev.busEmailAddress : ''
    }));
  };

  const handleActivityChange = (index, field, value) => {
    setFormData(prev => {
      const updated = [...prev.businessActivities];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, businessActivities: updated };
    });
  };

  const addActivityRow = () => {
    setFormData(prev => ({
      ...prev,
      businessActivities: [...prev.businessActivities, { code: '', lineOfBusiness: '', noOfUnits: '', capitalization: '', grossEssential: '', grossNonEssential: '' }]
    }));
  };

  const removeActivityRow = (index) => {
    setFormData(prev => ({
      ...prev,
      businessActivities: prev.businessActivities.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus({ type: null, message: '' });

    const isEditingMode = Boolean(editingApplication);
    const targetId = editingApplication?.id;
    const generateRefNo = () => `${selectedTenantCode}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    let refNo = isEditingMode 
      ? (editingApplication.referenceNo || editingApplication.reference_no || formData.referenceNo || '').trim()
      : (formData.referenceNo?.trim() || generateRefNo());

    try {
      // Direct Supabase Option B Integration
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const isSupabaseConfigured = supabaseUrl && !supabaseUrl.includes('YOUR_SUPABASE_PROJECT_ID');

      if (isSupabaseConfigured) {
        // 1. Prepare clean database payload (strictly real columns in PostgreSQL)
        const dbPayload = {
          tenant_code: selectedTenantCode,
          application_type: formData.applicationType || 'New',
          amendment_type: formData.amendmentType || null,
          mode_of_payment: formData.modeOfPayment || 'Annually',
          transfer_location: Boolean(formData.transferLocation),
          business_start_date: formData.businessStartDate || null,
          date_of_application: formData.dateOfApplication || new Date().toISOString().split('T')[0],
          reference_no: refNo,
          dti_sec_cda_reg_no: formData.dtiSecCdaRegNo || null,
          dti_sec_cda_reg_date: formData.dtiSecCdaRegDate || null,
          type_of_organization: formData.typeOfOrganization || 'Single',
          tin_no: formData.tinNo || null,
          has_tax_incentive: Boolean(formData.hasTaxIncentive),
          tax_incentive_entity: formData.taxIncentiveEntity || null,
          ctc_no: formData.ctcNo || null,
          taxpayer_last_name: formData.taxpayerLastName || '',
          taxpayer_first_name: formData.taxpayerFirstName || '',
          taxpayer_middle_name: formData.taxpayerMiddleName || null,
          business_name: formData.businessName || '',
          trade_name_franchise: formData.tradeNameFranchise || null,
          corp_president_treasurer_last_name: formData.corpPresidentLastName || null,
          corp_president_treasurer_first_name: formData.corpPresidentFirstName || null,
          corp_president_treasurer_middle_name: formData.corpPresidentMiddleName || null,
          bus_house_bldg_no: formData.busHouseBldgNo || null,
          bus_building_name: formData.busBuildingName || null,
          bus_street: formData.busStreet || null,
          bus_barangay: formData.busBarangay || '',
          bus_subdivision_landmark: formData.busSubdivisionLandmark || null,
          bus_city_municipality: formData.busCityMunicipality || 'City of Bogo',
          bus_province: formData.busProvince || 'Cebu',
          bus_telephone_no: formData.busTelephoneNo || null,
          bus_email_address: formData.busEmailAddress || null,
          owner_house_bldg_no: formData.ownerHouseBldgNo || null,
          owner_building_name: formData.ownerBuildingName || null,
          owner_street: formData.ownerStreet || null,
          owner_barangay: formData.ownerBarangay || null,
          owner_subdivision_landmark: formData.ownerSubdivisionLandmark || null,
          owner_city_municipality: formData.ownerCityMunicipality || null,
          owner_province: formData.ownerProvince || null,
          owner_telephone_no: formData.ownerTelephoneNo || null,
          owner_email_address: formData.ownerEmailAddress || null,
          num_employees_male: parseInt(formData.numEmployeesMale) || 0,
          num_employees_female: parseInt(formData.numEmployeesFemale) || 0,
          num_employees_bogo_residing: parseInt(formData.numEmployeesBogoResiding) || 0,
          is_rented: Boolean(formData.isRented),
          lessor_name: formData.lessorName || null,
          monthly_rental: parseFloat(formData.monthlyRental) || null,
          lessor_address: formData.lessorAddress || null,
          lessor_contact_no: formData.lessorContactNo || null,
          lessor_email_address: formData.lessorEmailAddress || null,
          emergency_contact_person: formData.emergencyContactPerson || null,
          emergency_contact_no: formData.emergencyContactNo || null,
          emergency_email_address: formData.emergencyEmailAddress || null,
          business_activities: formData.businessActivities || [],
          applicant_signature_name: formData.applicantSignatureName || null,
          updated_at: new Date().toISOString()
        };

        let insertedApp = null;
        let appError = null;

        if (isEditingMode) {
          // Update primary target in Supabase (by ID first if available, otherwise by reference_no)
          let query = supabase.from('bplo_application').update(dbPayload);
          if (targetId) {
            query = query.eq('id', targetId);
          } else {
            query = query.ilike('reference_no', refNo);
          }

          const updateRes = await query.select().maybeSingle();
          insertedApp = updateRes.data;
          appError = updateRes.error;

          // If updating by ID returned no row, retry updating by reference number
          if (!insertedApp && !appError && targetId && refNo) {
            const retryRef = await supabase
              .from('bplo_application')
              .update(dbPayload)
              .ilike('reference_no', refNo)
              .select()
              .maybeSingle();
            insertedApp = retryRef.data;
            appError = retryRef.error;
          }

          // If SELECT permissions fail (42501), perform plain update without returning rows
          if (appError && appError.code === '42501') {
            const plainQuery = targetId
              ? supabase.from('bplo_application').update(dbPayload).eq('id', targetId)
              : supabase.from('bplo_application').update(dbPayload).ilike('reference_no', refNo);
            const { error: plainErr } = await plainQuery;
            if (plainErr) throw plainErr;
            appError = null;
          } else if (appError) {
            throw appError;
          }
        } else {
          // New Application insert:
          const insertRes = await supabase
            .from('bplo_application')
            .insert([dbPayload])
            .select()
            .maybeSingle();

          insertedApp = insertRes.data;
          appError = insertRes.error;

          // Duplicate reference number retry
          if (appError && (appError.code === '23505' || appError.message?.includes('reference_no_key'))) {
            refNo = generateRefNo();
            dbPayload.reference_no = refNo;
            const retry = await supabase.from('bplo_application').insert([dbPayload]).select().maybeSingle();
            insertedApp = retry.data;
            appError = retry.error;
          }

          if (appError && appError.code === '42501') {
            const { error: plainInsertError } = await supabase
              .from('bplo_application')
              .insert([dbPayload]);
            if (plainInsertError) throw plainInsertError;
            appError = null;
          } else if (appError) {
            throw appError;
          }
        }

        // 2. Insert or update bplo_business_activities
        let appId = insertedApp?.id || targetId;
        if (!appId && refNo) {
          try {
            const { data: foundApp } = await supabase
              .from('bplo_application')
              .select('id')
              .ilike('reference_no', refNo)
              .maybeSingle();
            if (foundApp?.id) appId = foundApp.id;
          } catch (e) {}
        }

        if (appId && formData.businessActivities && formData.businessActivities.length > 0) {
          if (isEditingMode) {
            try {
              await supabase.from('bplo_business_activities').delete().eq('application_id', appId);
            } catch (err) {
              console.warn('Activities delete warning:', err);
            }
          }
          const activitiesPayload = formData.businessActivities
            .filter(act => act.lineOfBusiness)
            .map(act => ({
              application_id: appId,
              tenant_code: selectedTenantCode,
              code: act.code || null,
              line_of_business: act.lineOfBusiness,
              no_of_units: parseInt(act.noOfUnits) || 0,
              capitalization: parseFloat(act.capitalization) || 0.00,
              gross_essential: parseFloat(act.grossEssential) || 0.00,
              gross_non_essential: parseFloat(act.grossNonEssential) || 0.00
            }));

          if (activitiesPayload.length > 0) {
            const { error: actError } = await supabase
              .from('bplo_business_activities')
              .insert(activitiesPayload);
            if (actError) console.warn('Business activities insertion warning:', actError);
          }
        }

        // 3. Prepare ARTA Electronic Acknowledgement Receipt (e-AR) payload
        const docsList = Object.values(formData.uploadedDocuments || {});
        const receiptPayload = {
          id: appId || undefined,
          referenceNo: refNo,
          reference_no: refNo,
          tenant_code: selectedTenantCode,
          submittedAt: isEditingMode ? (editingApplication.submittedAt || new Date().toISOString()) : new Date().toISOString(),
          submittedAtFormatted: new Date().toLocaleString('en-PH', { 
            dateStyle: 'full', 
            timeStyle: 'medium' 
          }),
          applicantName: `${formData.taxpayerFirstName || ''} ${formData.taxpayerLastName || ''}`.trim() || formData.applicantSignatureName || 'Applicant',
          taxpayer_first_name: formData.taxpayerFirstName,
          taxpayer_last_name: formData.taxpayerLastName,
          businessName: formData.businessName || 'Business Establishment',
          business_name: formData.businessName,
          applicationType: formData.applicationType || 'New',
          application_type: formData.applicationType || 'New',
          typeOfOrganization: formData.typeOfOrganization || 'Single',
          type_of_organization: formData.typeOfOrganization || 'Single',
          businessAddress: `${formData.busHouseBldgNo || ''} ${formData.busStreet || ''} Brgy. ${formData.busBarangay || ''}, ${formData.busCityMunicipality || 'City of Bogo'}`.trim(),
          bus_house_bldg_no: formData.busHouseBldgNo,
          bus_street: formData.busStreet,
          bus_barangay: formData.busBarangay,
          bus_city_municipality: formData.busCityMunicipality,
          bus_province: formData.busProvince,
          isRented: Boolean(formData.isRented),
          isMarketStall: Boolean(formData.isMarketStall),
          isFranchisee: Boolean(formData.isFranchisee),
          isRepresentative: Boolean(formData.isRepresentative),
          specialBusinessTypes: formData.specialBusinessTypes || [],
          business_activities: formData.businessActivities || [],
          businessActivities: formData.businessActivities || [],
          documents: docsList,
          uploaded_documents: docsList,
          status: isEditingMode ? (editingApplication.status || 'Pending') : 'Pending'
        };

        // Cache into recent applications & document storage for fast local lookup
        try {
          localStorage.setItem(`bplo_docs_${refNo}`, JSON.stringify(docsList));
          const recents = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
          const existingIdx = recents.findIndex(r => (r.referenceNo || '').toLowerCase() === refNo.toLowerCase());
          if (existingIdx !== -1) {
            recents[existingIdx] = { ...recents[existingIdx], ...receiptPayload };
          } else {
            recents.unshift(receiptPayload);
          }
          localStorage.setItem('bplo_recent_applications', JSON.stringify(recents.slice(0, 20)));
        } catch (e) {
          console.warn('Failed to cache recent receipt:', e);
        }

        setSubmitStatus({
          type: 'success',
          message: isEditingMode
            ? `Application ${refNo} updated successfully! Your revisions have been recorded for evaluation.`
            : `Application submitted successfully! Reference No: ${refNo}`
        });

        if (onSubmissionSuccess) {
          onSubmissionSuccess(receiptPayload);
        }

        if (isEditingMode && onCancelEdit) {
          onCancelEdit();
        }

        setFormData(getInitialFormData());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        // Fallback to Express backend if Supabase env vars not configured yet
        const endpoint = isEditingMode 
          ? `http://localhost:5000/api/bplo-applications/${refNo}` 
          : 'http://localhost:5000/api/bplo-applications';
        const method = isEditingMode ? 'PUT' : 'POST';
        const response = await fetch(endpoint, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, referenceNo: refNo })
        });

        const data = await response.json();

        if (data.success) {
          const receiptPayload = {
            referenceNo: data.referenceNo || refNo,
            submittedAt: isEditingMode ? (editingApplication.submittedAt || new Date().toISOString()) : new Date().toISOString(),
            submittedAtFormatted: new Date().toLocaleString('en-PH', { 
              dateStyle: 'full', 
              timeStyle: 'medium' 
            }),
            applicantName: `${formData.taxpayerFirstName || ''} ${formData.taxpayerLastName || ''}`.trim() || formData.applicantSignatureName || 'Applicant',
            businessName: formData.businessName || 'Business Establishment',
            applicationType: formData.applicationType || 'New',
            typeOfOrganization: formData.typeOfOrganization || 'Single',
            isRented: Boolean(formData.isRented),
            isMarketStall: Boolean(formData.isMarketStall),
            isFranchisee: Boolean(formData.isFranchisee),
            isRepresentative: Boolean(formData.isRepresentative),
            specialBusinessTypes: formData.specialBusinessTypes || [],
            documents: Object.values(formData.uploadedDocuments || {}),
            status: isEditingMode ? (editingApplication.status || 'Under BPLO Evaluation') : 'Under BPLO Evaluation'
          };

          try {
            const recents = JSON.parse(localStorage.getItem('bplo_recent_applications') || '[]');
            const existingIdx = recents.findIndex(r => r.referenceNo === refNo);
            if (existingIdx !== -1) {
              recents[existingIdx] = receiptPayload;
            } else {
              recents.unshift(receiptPayload);
            }
            localStorage.setItem('bplo_recent_applications', JSON.stringify(recents.slice(0, 10)));
          } catch (e) {
            console.warn(e);
          }

          setSubmitStatus({
            type: 'success',
            message: isEditingMode 
              ? `Application ${refNo} updated successfully! Revisions have been saved.` 
              : `Application submitted successfully! Reference No: ${data.referenceNo || refNo}`
          });

          if (onSubmissionSuccess) {
            onSubmissionSuccess(receiptPayload);
          }

          if (isEditingMode && onCancelEdit) {
            onCancelEdit();
          }

          setFormData(getInitialFormData());
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setSubmitStatus({ type: 'error', message: data.message || 'Submission failed' });
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      const errMsg = error.code === '23505'
        ? 'A permit application with this reference number already exists. Please clear the reference number field or try again.'
        : (error.message || 'Failed to submit application. Please try again.');
      setSubmitStatus({ type: 'error', message: errMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative p-6 sm:p-10 max-w-5xl mx-auto text-gray-800 text-xs sm:text-sm my-6 font-['Poppins',sans-serif]">
      
      {/* Editing Application Banner */}
      {editingApplication && (
        <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 shadow-2xs">
              <Edit3 className="w-5 h-5 text-amber-800" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-sm sm:text-base">Editing Application Submission</span>
                <span className="font-mono font-bold text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-950 border border-amber-300">
                  {editingApplication.referenceNo || editingApplication.reference_no}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Status: {editingApplication.status || 'Pending'}
                </span>
              </div>
              <p className="text-xs text-amber-800 mt-1">
                You are amending your submitted permit form. Updates will be saved directly to your existing reference number and synced with BPLO evaluators.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (onCancelEdit) onCancelEdit();
                setFormData(getInitialFormData());
              }}
              className="px-4 py-2 rounded-full border border-amber-300 hover:bg-amber-100 text-amber-950 font-semibold text-xs transition-colors cursor-pointer bg-white shadow-2xs"
            >
              Cancel & New Form
            </button>
          </div>
        </div>
      )}

      {/* Official Form Header */}
      <div className="border-b-2 border-gray-800 pb-4 mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <img
              src={activeTenant.logo}
              alt={`${activeTenant.name} Seal`}
              className="w-20 h-20 object-contain flex-shrink-0 drop-shadow-sm"
              onError={(e) => { e.target.onerror = null; e.target.src = '/assets/images/bogo_city_logo.png'; }}
            />
            <div>
              <p className="text-[11px] font-medium uppercase text-gray-500 tracking-wide">Republic of the Philippines</p>
              <p className="text-[11px] font-medium uppercase text-gray-500 tracking-wide">Province of {activeTenant.province}</p>
              <h2 className="text-base sm:text-lg font-semibold text-gray-800 uppercase tracking-normal mt-0.5">{activeTenant.name}</h2>
              <p className="text-[11px] text-gray-500 font-normal mt-0.5">Website: <span className="text-gray-700 font-medium">{activeTenant.website}</span></p>
              <h3 className="text-xs font-medium uppercase mt-0.5 tracking-normal" style={{ color: activeTenant.primaryColor }}>{activeTenant.officeName}</h3>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-[11px] space-y-1 text-gray-600 min-w-[200px] shadow-xs">
            <p><span className="font-medium text-gray-800">Document Code:</span> {activeTenant.documentCode}</p>
            <p><span className="font-medium text-gray-800">Tenant Code:</span> <span className="font-semibold text-slate-800">{activeTenant.code}</span></p>
            <p><span className="font-medium text-gray-800">Date Effective:</span> September 3, 2026</p>
            <p><span className="font-medium text-gray-800">Page:</span> 1 of 1</p>
          </div>
        </div>

        {/* Main Title Banner */}
        <div className="mt-5 text-white text-center py-3 px-4 rounded-xl font-medium text-sm sm:text-base tracking-wide uppercase shadow-md transition-colors duration-300" style={{ backgroundColor: activeTenant.primaryColor }}>
          UNIFIED BUSINESS PERMIT APPLICATION FORM ({activeTenant.code})
        </div>
      </div>

      {submitStatus.message && (
        <div className={`mb-6 p-4 rounded-xl text-sm text-center font-bold shadow-sm ${
          submitStatus.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
            : 'bg-red-50 text-red-800 border border-red-300'
        }`}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Section 1 - 5 Header Grid */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            
            {/* 1. Type */}
            <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-slate-200 pr-3 pb-3 md:pb-0">
              <span className="font-semibold text-gray-700 block mb-2 text-xs uppercase tracking-wide">1. Type</span>
              <div className="space-y-2 pl-1">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
                  <input type="radio" name="applicationType" value="New" checked={formData.applicationType === 'New'} onChange={handleChange} className="w-4 h-4 text-[#159847] focus:ring-[#159847]" />
                  <span>1.1 New</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
                  <input type="radio" name="applicationType" value="Renewal" checked={formData.applicationType === 'Renewal'} onChange={handleChange} className="w-4 h-4 text-[#159847] focus:ring-[#159847]" />
                  <span>1.2 Renewal</span>
                </label>
              </div>
            </div>

            {/* 2. Amendment */}
            <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-200 pr-3 pb-3 md:pb-0">
              <span className="font-semibold text-gray-700 block mb-2 text-xs uppercase tracking-wide">2. Amendment</span>
              <select name="amendmentType" value={formData.amendmentType} onChange={handleChange} className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium">
                <option value="">-- Select Amendment (if applicable) --</option>
                <option value="2.1 From Single to Partnership">2.1 From Single to Partnership</option>
                <option value="2.2 From Single to Corporation">2.2 From Single to Corporation</option>
                <option value="2.3 From Partnership to Single">2.3 From Partnership to Single</option>
                <option value="2.4 From Partnership to Corporation">2.4 From Partnership to Corporation</option>
                <option value="2.5 From Corporation to Single">2.5 From Corporation to Single</option>
                <option value="2.6 From Corporation to Partnership">2.6 From Corporation to Partnership</option>
                <option value="2.8 Change/Add Line of Business">2.8 Change/Add Line of Business</option>
              </select>
            </div>

            {/* 3. Mode of Payment & 4. Transfer */}
            <div className="md:col-span-3 border-b md:border-b-0 md:border-r border-slate-200 pr-3 pb-3 md:pb-0">
              <span className="font-semibold text-gray-700 block mb-2 text-xs uppercase tracking-wide">3. Mode of Payment</span>
              <div className="space-y-1.5 pl-1 mb-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
                  <input type="radio" name="modeOfPayment" value="Annually" checked={formData.modeOfPayment === 'Annually'} onChange={handleChange} className="w-4 h-4 text-[#159847] focus:ring-[#159847]" />
                  <span>3.1 Annually</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 hover:text-gray-900">
                  <input type="radio" name="modeOfPayment" value="Quarterly" checked={formData.modeOfPayment === 'Quarterly'} onChange={handleChange} className="w-4 h-4 text-[#159847] focus:ring-[#159847]" />
                  <span>3.2 Quarterly</span>
                </label>
              </div>
              <span className="font-semibold text-gray-700 block mb-1 text-xs uppercase tracking-wide">4. Transfer</span>
              <label className="flex items-center gap-2 cursor-pointer pl-1 text-xs font-medium text-gray-700">
                <input type="checkbox" name="transferLocation" checked={formData.transferLocation} onChange={handleChange} className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847]" />
                <span>4.1 Location</span>
              </label>
            </div>

            {/* 5. Business Start Date */}
            <div className="md:col-span-2">
              <label className="font-semibold text-gray-700 block mb-2 text-[11px] uppercase tracking-wide">5. Business Start Date:</label>
              <input type="date" name="businessStartDate" value={formData.businessStartDate} onChange={handleChange} className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>

          </div>
        </div>

        {/* Section 6 - 12 General Information */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
          <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider border-b border-slate-200 pb-2">General Information (Items 6 - 12)</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">6. Date of Application *</label>
              <input type="date" name="dateOfApplication" value={formData.dateOfApplication} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">7. Reference No.</label>
              <input type="text" name="referenceNo" value={formData.referenceNo} onChange={handleChange} placeholder="Auto-generated if empty" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">8. DTI / SEC / CDA Reg No.</label>
              <input type="text" name="dtiSecCdaRegNo" value={formData.dtiSecCdaRegNo} onChange={handleChange} placeholder="Registration No." className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">8.1 DTI/SEC/CDA Reg Date</label>
              <input type="date" name="dtiSecCdaRegDate" value={formData.dtiSecCdaRegDate} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">9. Type of Organization</label>
              <select name="typeOfOrganization" value={formData.typeOfOrganization} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium">
                <option value="Single">Single</option>
                <option value="Partnership">Partnership</option>
                <option value="Corporation">Corporation</option>
                <option value="Cooperative">Cooperative</option>
              </select>
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">10. TIN</label>
              <input type="text" name="tinNo" value={formData.tinNo} onChange={handleChange} placeholder="xxx-xxx-xxx" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">12. CTC NO</label>
              <input type="text" name="ctcNo" value={formData.ctcNo} onChange={handleChange} placeholder="Community Tax Cert" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
          </div>

          {/* 11. Tax Incentive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pt-2 border-t border-slate-200">
            <span className="font-medium text-gray-700 text-xs">11. Are you enjoying tax incentive from any Government Entity?</span>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input type="radio" name="hasTaxIncentive" value="true" checked={formData.hasTaxIncentive === true || formData.hasTaxIncentive === 'true'} onChange={() => setFormData(p => ({ ...p, hasTaxIncentive: true }))} className="w-4 h-4 text-[#159847] focus:ring-[#159847]" />
                <span>Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input type="radio" name="hasTaxIncentive" value="false" checked={formData.hasTaxIncentive === false || formData.hasTaxIncentive === 'false'} onChange={() => setFormData(p => ({ ...p, hasTaxIncentive: false, taxIncentiveEntity: '' }))} className="w-4 h-4 text-[#159847] focus:ring-[#159847]" />
                <span>No</span>
              </label>
            </div>
            {formData.hasTaxIncentive && (
              <input type="text" name="taxIncentiveEntity" value={formData.taxIncentiveEntity} onChange={handleChange} placeholder="Please specify entity name" className="flex-1 p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            )}
          </div>
        </div>

        {/* Section 13 - 16 Names */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
          <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Taxpayer & Business Details (Items 13 - 16)</h4>
          
          {/* 13. Name of Taxpayer */}
          <div>
            <span className="font-medium text-gray-700 block mb-2 text-xs">13. Name of Taxpayer *</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" name="taxpayerLastName" value={formData.taxpayerLastName} onChange={handleChange} placeholder="Last Name" required className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              <input type="text" name="taxpayerFirstName" value={formData.taxpayerFirstName} onChange={handleChange} placeholder="First Name" required className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              <input type="text" name="taxpayerMiddleName" value={formData.taxpayerMiddleName} onChange={handleChange} placeholder="Middle Name" className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
          </div>

          {/* 14 & 15 Business & Trade Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">14. Business Name *</label>
              <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} placeholder="Registered Business Name" required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="font-medium text-gray-700 block mb-1 text-xs">15. Trade Name / Franchise</label>
              <input type="text" name="tradeNameFranchise" value={formData.tradeNameFranchise} onChange={handleChange} placeholder="Trade Name or Franchise (if any)" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
          </div>

          {/* 16. Name of President/Treasurer */}
          <div>
            <span className="font-medium text-gray-700 block mb-2 text-xs">16. Name of President / Treasurer of Corporation</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input type="text" name="corpPresidentLastName" value={formData.corpPresidentLastName} onChange={handleChange} placeholder="Last Name" className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              <input type="text" name="corpPresidentFirstName" value={formData.corpPresidentFirstName} onChange={handleChange} placeholder="First Name" className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              <input type="text" name="corpPresidentMiddleName" value={formData.corpPresidentMiddleName} onChange={handleChange} placeholder="Middle Name" className="p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
          </div>

        </div>

        {/* Section 17 & 18 Addresses Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* 17. Business Address */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider border-b border-slate-200 pb-2">17. Business Address</h4>
            
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.1 House No. / Bldg. No.</label>
              <input type="text" name="busHouseBldgNo" value={formData.busHouseBldgNo} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.2 Building Name / Unit No.</label>
              <input type="text" name="busBuildingName" value={formData.busBuildingName} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.3 Street</label>
              <input type="text" name="busStreet" value={formData.busStreet} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.4 Barangay *</label>
              <input type="text" name="busBarangay" value={formData.busBarangay} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.5 Subdivision / Landmark</label>
              <input type="text" name="busSubdivisionLandmark" value={formData.busSubdivisionLandmark} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.6 City / Municipality</label>
                <input type="text" name="busCityMunicipality" value={formData.busCityMunicipality} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.7 Province</label>
                <input type="text" name="busProvince" value={formData.busProvince} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.8 Telephone No. *</label>
                <input type="tel" name="busTelephoneNo" value={formData.busTelephoneNo} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">17.9 Email Address *</label>
                <input type="email" name="busEmailAddress" value={formData.busEmailAddress} onChange={handleChange} required className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
            </div>
          </div>

          {/* 18. Owner's Address */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider">18. Owner's Address</h4>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
                <input type="checkbox" name="sameAsBusinessAddress" checked={formData.sameAsBusinessAddress} onChange={handleCopyBusinessAddress} className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847]" />
                <span>Same as Business</span>
              </label>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.1 House No. / Bldg. No.</label>
              <input type="text" name="ownerHouseBldgNo" value={formData.ownerHouseBldgNo} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.2 Building Name / Unit No.</label>
              <input type="text" name="ownerBuildingName" value={formData.ownerBuildingName} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.3 Street</label>
              <input type="text" name="ownerStreet" value={formData.ownerStreet} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.4 Barangay</label>
              <input type="text" name="ownerBarangay" value={formData.ownerBarangay} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.5 Subdivision / Landmark</label>
              <input type="text" name="ownerSubdivisionLandmark" value={formData.ownerSubdivisionLandmark} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.6 City / Municipality</label>
                <input type="text" name="ownerCityMunicipality" value={formData.ownerCityMunicipality} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.7 Province</label>
                <input type="text" name="ownerProvince" value={formData.ownerProvince} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.8 Telephone No.</label>
                <input type="tel" name="ownerTelephoneNo" value={formData.ownerTelephoneNo} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">18.9 Email Address</label>
                <input type="email" name="ownerEmailAddress" value={formData.ownerEmailAddress} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs focus:ring-2 focus:ring-[#159847]/30 focus:border-[#159847] font-medium" />
              </div>
            </div>
          </div>

        </div>

        {/* Section 19 & 20 Employees & Lessor Details */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
          <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider border-b border-slate-200 pb-2">Employees & Lessor Details (Items 19 - 20)</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-2">
            <div>
              <span className="font-medium text-gray-700 block mb-2 text-xs">19. Total No. of Employees in Establishment:</span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Male:</span>
                  <input type="number" name="numEmployeesMale" min="0" value={formData.numEmployeesMale} onChange={handleChange} className="w-24 p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-600">Female:</span>
                  <input type="number" name="numEmployeesFemale" min="0" value={formData.numEmployeesFemale} onChange={handleChange} className="w-24 p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
              </div>
            </div>
            <div>
              <span className="font-medium text-gray-700 block mb-2 text-xs">19.1 No. of Employees Residing in Bogo City:</span>
              <input type="number" name="numEmployeesBogoResiding" min="0" value={formData.numEmployeesBogoResiding} onChange={handleChange} className="w-36 p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
            </div>
          </div>

          {/* 20. Rental Details */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center gap-3 mb-3">
              <span className="font-medium text-gray-700 text-xs">20. If Place of Business is Rented:</span>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#159847]">
                <input type="checkbox" name="isRented" checked={formData.isRented} onChange={handleChange} className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847]" />
                <span>Check if Rented</span>
              </label>
            </div>

            {formData.isRented && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">20.1 Lessor's Name</label>
                  <input type="text" name="lessorName" value={formData.lessorName} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">20.2 Monthly Rental (Php)</label>
                  <input type="number" step="0.01" name="monthlyRental" value={formData.monthlyRental} onChange={handleChange} placeholder="0.00" className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">20.3 Lessor's Address</label>
                  <input type="text" name="lessorAddress" value={formData.lessorAddress} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">20.4 Lessor's Contact Number</label>
                  <input type="tel" name="lessorContactNo" value={formData.lessorContactNo} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-600 block mb-1">20.5 Lessor's Email Address</label>
                  <input type="email" name="lessorEmailAddress" value={formData.lessorEmailAddress} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
                </div>
              </div>
            )}

            {/* 20.B Location Special Status & Representative */}
            <div className="pt-3 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 p-2 rounded-lg bg-white border border-slate-200">
                <input 
                  type="checkbox" 
                  name="isMarketStall" 
                  checked={formData.isMarketStall} 
                  onChange={handleChange} 
                  className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847] mt-0.5" 
                />
                <div>
                  <span className="text-[#159847] font-bold block">Business is located at Bogo City Public Market</span>
                  <span className="text-[11px] text-gray-500 font-normal">Requires Stall Clearance from Market Administration (Item 12)</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-gray-700 p-2 rounded-lg bg-white border border-slate-200">
                <input 
                  type="checkbox" 
                  name="isRepresentative" 
                  checked={formData.isRepresentative} 
                  onChange={handleChange} 
                  className="w-4 h-4 rounded text-[#159847] focus:ring-[#159847] mt-0.5" 
                />
                <div>
                  <span className="text-[#159847] font-bold block">Transacting through an Authorized Representative</span>
                  <span className="text-[11px] text-gray-500 font-normal">Requires Authorization Letter / Secretary's Certificate & Valid IDs</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* Section 21 Incase of Emergency */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
          <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider border-b border-slate-200 pb-2">21. Incase of Emergency</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">21.1 Contact Person</label>
              <input type="text" name="emergencyContactPerson" value={formData.emergencyContactPerson} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">21.2 Contact No.</label>
              <input type="tel" name="emergencyContactNo" value={formData.emergencyContactNo} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
            </div>
            <div>
              <label className="text-[11px] font-medium text-gray-700 block mb-1">21.3 Email Address</label>
              <input type="email" name="emergencyEmailAddress" value={formData.emergencyEmailAddress} onChange={handleChange} className="w-full p-2 border border-slate-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-[#159847]/30" />
            </div>
          </div>
        </div>

        {/* Section 22 - 25 Business Activity Table */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2">
            <h4 className="font-semibold text-[#159847] text-xs uppercase tracking-wider">Business Activity Details (Items 22 - 25)</h4>
            <button type="button" onClick={addActivityRow} className="px-4 py-1.5 bg-[#159847] text-white rounded-full text-xs hover:bg-[#12823c] transition-all font-bold shadow-sm flex items-center gap-1 cursor-pointer">
              + Add Line of Business
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-300">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-100 text-gray-700 text-[11px] font-semibold border-b border-slate-300">
                  <th className="p-2.5 w-16 border-r border-slate-300">Code</th>
                  <th className="p-2.5 border-r border-slate-300">22.1 Line of Business *</th>
                  <th className="p-2.5 w-24 border-r border-slate-300">23. Units</th>
                  <th className="p-2.5 w-36 border-r border-slate-300">24. Capitalization (New)</th>
                  <th className="p-2.5 text-center border-r border-slate-300" colSpan={2}>
                    25. Gross Sales / Receipts (Renewal)
                    <div className="grid grid-cols-2 border-t border-slate-300 mt-1 pt-1 text-[10px] font-semibold text-gray-600">
                      <span className="border-r border-slate-300">25.1 Essential</span>
                      <span>25.2 Non-essential</span>
                    </div>
                  </th>
                  <th className="p-2.5 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody>
                {formData.businessActivities.map((act, index) => (
                  <tr key={index} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                    <td className="p-1.5 border-r border-slate-200">
                      <input type="text" value={act.code} onChange={(e) => handleActivityChange(index, 'code', e.target.value)} placeholder="Code" className="w-full p-1.5 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#159847]" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input type="text" value={act.lineOfBusiness} onChange={(e) => handleActivityChange(index, 'lineOfBusiness', e.target.value)} placeholder="Line of Business" required className="w-full p-1.5 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#159847]" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input type="number" value={act.noOfUnits} onChange={(e) => handleActivityChange(index, 'noOfUnits', e.target.value)} placeholder="0" className="w-full p-1.5 border border-slate-200 rounded text-xs text-center font-medium focus:ring-1 focus:ring-[#159847]" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input type="number" step="0.01" value={act.capitalization} onChange={(e) => handleActivityChange(index, 'capitalization', e.target.value)} placeholder="0.00" className="w-full p-1.5 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#159847]" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input type="number" step="0.01" value={act.grossEssential} onChange={(e) => handleActivityChange(index, 'grossEssential', e.target.value)} placeholder="Essential" className="w-full p-1.5 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#159847]" />
                    </td>
                    <td className="p-1.5 border-r border-slate-200">
                      <input type="number" step="0.01" value={act.grossNonEssential} onChange={(e) => handleActivityChange(index, 'grossNonEssential', e.target.value)} placeholder="Non-essential" className="w-full p-1.5 border border-slate-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#159847]" />
                    </td>
                    <td className="p-1.5 text-center">
                      {formData.businessActivities.length > 1 && (
                        <button type="button" onClick={() => removeActivityRow(index)} className="text-red-500 hover:text-red-700 font-bold px-1.5 py-0.5 rounded hover:bg-red-50">
                          ✕
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ARTA Documentary Requirements Section (RA 11032 / Cloudinary Upload) */}
        <ArtaDocumentUpload
          formData={formData}
          uploadedDocuments={formData.uploadedDocuments || {}}
          onDocumentsChange={(docs) => setFormData(prev => ({ ...prev, uploadedDocuments: docs }))}
          onConditionToggle={(field, value) => setFormData(prev => ({ ...prev, [field]: value }))}
          tenantCode={selectedTenantCode}
        />

        {/* Legal Declaration */}
        <div className="border border-amber-300/80 rounded-xl p-4 bg-amber-50/70 text-gray-800 text-xs space-y-3">
          <p className="font-semibold italic text-justify leading-relaxed text-gray-700">
            I DECLARE UNDER PENALTY OF PERJURY that all information in this application is true and correct based on my personal knowledge and authentic records submitted to the City of Bogo. Any false or misleading information supplied, or production of fake / falsified documents shall be grounds for appropriate legal action against me and automatically revokes the permit.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3">
            <label className="font-medium text-gray-700 text-right pr-1">SIGNATURE OVER PRINTED NAME OF APPLICANT / OWNER / AUTHORIZED REPRESENTATIVE:</label>
            <input
              type="text"
              name="applicantSignatureName"
              value={formData.applicantSignatureName}
              onChange={handleChange}
              placeholder="Type Full Name to Sign"
              required
              className="p-2 border.5 border-slate-400 rounded-lg bg-white font-bold text-gray-900 text-sm sm:w-80 shadow-sm focus:ring-2 focus:ring-[#159847]"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#159847] hover:bg-[#12823c] text-white py-3.5 px-6 rounded-full font-medium text-sm sm:text-base transition-all shadow-md hover:shadow-lg disabled:opacity-50 tracking-wide uppercase cursor-pointer"
        >
          {isSubmitting 
            ? (editingApplication ? 'Updating Application...' : 'Submitting Application...') 
            : (editingApplication ? 'SAVE & UPDATE UNIFIED BUSINESS PERMIT APPLICATION' : 'SUBMIT UNIFIED BUSINESS PERMIT APPLICATION')}
        </button>

      </form>
    </div>
  );
}


// Admin Dashboard Component
function AdminDashboard({ setCurrentPage }) {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Admin section tabs
  const [activeTab, setActiveTab] = useState('appointments');

  // Dashboard state
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingId, setUpdatingId] = useState(null);

  // Search & Filter state
}
