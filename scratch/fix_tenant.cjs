const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

const target = 'export default function RestaurantApp() {';
const replacement = `export default function RestaurantApp() {
  // Multi-Tenant state for Navigation Bar & Application
  const [selectedTenantCode, setSelectedTenantCode] = useState('BOGO');
  const activeTenant = TENANTS.find(t => t.code === selectedTenantCode) || TENANTS[0];`;

content = content.replace(target, replacement);
fs.writeFileSync(appPath, content, 'utf8');
console.log('Fixed tenant state injection in RestaurantApp!');
