const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, '..', 'src', 'App.jsx');
let content = fs.readFileSync(appPath, 'utf8');

const target = '{/* Multi-Tenant Portal Selection Bar */}';
const replacement = `{/* Logged In User Bar */}
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
      )}

      {/* Multi-Tenant Portal Selection Bar */}`;

if (!content.includes('{/* Logged In User Bar */}')) {
  content = content.replace(target, replacement);
  fs.writeFileSync(appPath, content, 'utf8');
  console.log('User bar added successfully!');
} else {
  console.log('User bar already present.');
}
