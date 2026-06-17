const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'account', 'page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add state variables and avatar upload callback after `profileSuccess` state
const targetState = `  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);`;
const replacementState = `  // Profile Update State
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [profileAvatar, setProfileAvatar] = useState<string>("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAvatar = localStorage.getItem("mehta_avatar_url");
      if (savedAvatar) {
        setProfileAvatar(savedAvatar);
      }
    }
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileAvatar(base64String);
        localStorage.setItem("mehta_avatar_url", base64String);
        window.dispatchEvent(new Event("avatarUpdated"));
      };
      reader.readAsDataURL(file);
    }
  };`;

content = content.replace(targetState, replacementState);

// 2. Update Sidebar Profile Avatar Box
const targetSidebarAvatar = `<div className="hidden lg:flex items-center gap-4 border-b border-brand-beige/50 pb-5 mb-4 mt-2">
                  <div className="h-12 w-12 bg-gradient-to-br from-brand-orange to-brand-gold rounded-full flex items-center justify-center text-white text-xl font-black shadow-inner shadow-black/10 flex-shrink-0 relative">
                    {profile?.name ? profile.name[0].toUpperCase() : "U"}
                    {isLoggedIn && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>`;
const replacementSidebarAvatar = `<div className="hidden lg:flex items-center gap-4 border-b border-brand-beige/50 pb-5 mb-4 mt-2">
                  <div className="h-12 w-12 rounded-full overflow-hidden border border-brand-beige shadow-inner flex-shrink-0 relative bg-brand-cream flex items-center justify-center text-brand-charcoal text-lg font-black">
                    {profileAvatar ? (
                      <img src={profileAvatar} alt="Sidebar Profile Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile?.name ? profile.name[0].toUpperCase() : "U"
                    )}
                    {isLoggedIn && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 bg-green-500 border-2 border-white rounded-full"></span>
                    )}
                  </div>`;

content = content.replace(targetSidebarAvatar, replacementSidebarAvatar);

// 3. Upgrade TAB 0: DASHBOARD with motion.div, AnimatedCounter, loyalty info
const targetDashboardTab = `                {/* --- TAB 0: DASHBOARD --- */}
                {activeTab === "dashboard" && (
                  <div className="flex flex-col gap-8 animate-fade-in">
                    <div className="bg-gradient-to-r from-brand-cream/50 to-transparent p-6 rounded-2xl border border-brand-beige/50">
                      <h2 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">
                        Welcome back, {profile?.name ? profile.name.split(" ")[0] : "Guest"} 👋
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        Here's an overview of your account and recent activities.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { title: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                        { title: "Wishlist Items", value: wishlistItems.length, icon: Heart, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
                        { title: "Saved Addresses", value: profile?.saved_addresses?.length || 0, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                      ].map((stat, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          key={idx} 
                          className={\`p-5 rounded-2xl border \${stat.border} bg-white shadow-sm flex flex-col gap-3 relative overflow-hidden group\`}
                        >
                          <div className={\`absolute -right-6 -top-6 w-24 h-24 rounded-full \${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500\`}></div>
                          <div className={\`h-10 w-10 rounded-xl \${stat.bg} \${stat.color} flex items-center justify-center relative z-10\`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.title}</h4>
                            <span className="font-serif text-2xl font-bold text-brand-charcoal">{stat.value}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Recent Activity Mini-Card */}
                      <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-serif text-lg font-bold text-brand-charcoal">Recent Activity</h3>
                          <button onClick={() => setActiveTab("orders")} className="text-xs text-brand-orange hover:text-brand-orange-hover font-bold flex items-center gap-1">
                            View All <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        {orders.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {orders.slice(0, 3).map(o => (
                              <div key={o.id} className="flex items-center gap-4 border-b border-brand-beige/30 pb-4 last:border-0 last:pb-0">
                                <div className="h-10 w-10 rounded-lg bg-brand-cream/50 flex items-center justify-center text-brand-orange flex-shrink-0">
                                  <ShoppingBag className="h-5 w-5" />
                                  {o.status === "Delivered" && <Check className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 text-white rounded-full p-[1px]" />}
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-xs font-bold text-brand-charcoal">Order #{o.orderNumber}</h4>
                                  <span className="text-[0.65rem] text-muted-foreground">{o.date} • {o.items.length} items</span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-xs font-bold text-brand-charcoal">₹{o.total}</span>
                                  <span className="text-[0.6rem] font-bold text-brand-orange uppercase">{o.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Clock className="h-8 w-8 text-brand-beige mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No recent activity.</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                        <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setActiveTab("profile")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <User className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Edit Profile</span>
                          </button>
                          <button onClick={() => setActiveTab("addresses")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <MapPin className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Add Address</span>
                          </button>
                          <Link href="/shop" className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <Gift className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Shop Sweets</span>
                          </Link>
                          <button onClick={() => setActiveTab("security")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <Shield className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Security</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}`;

const replacementDashboardTab = `                {/* --- TAB 0: DASHBOARD --- */}
                {activeTab === "dashboard" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-8"
                  >
                    <div className="bg-gradient-to-r from-brand-cream/60 to-transparent p-6 rounded-2xl border border-brand-beige/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h2 className="font-serif text-3xl font-bold text-brand-charcoal mb-2">
                          Welcome back, {profile?.name ? profile.name.split(" ")[0] : "Guest"} 👋
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Here's an overview of your account and recent activities.
                        </p>
                      </div>
                      <div className="bg-white px-4 py-2.5 rounded-xl border border-brand-beige flex items-center gap-3 shadow-xs">
                        <Crown className="w-5 h-5 text-brand-gold" />
                        <div>
                          <span className="text-[0.6rem] font-bold text-muted-foreground uppercase block">LOYALTY TIER</span>
                          <span className="text-xs font-black text-brand-charcoal">{loyaltyTier} ({loyaltyPoints} pts)</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[
                        { title: "Total Orders", value: orders.length, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                        { title: "Wishlist Items", value: wishlistItems.length, icon: Heart, color: "text-pink-600", bg: "bg-pink-50", border: "border-pink-100" },
                        { title: "Saved Addresses", value: profile?.saved_addresses?.length || 0, icon: MapPin, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                      ].map((stat, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          key={idx} 
                          className={\`p-5 rounded-2xl border \${stat.border} bg-white shadow-sm flex flex-col gap-3 relative overflow-hidden group\`}
                        >
                          <div className={\`absolute -right-6 -top-6 w-24 h-24 rounded-full \${stat.bg} opacity-50 group-hover:scale-150 transition-transform duration-500\`}></div>
                          <div className={\`h-10 w-10 rounded-xl \${stat.bg} \${stat.color} flex items-center justify-center relative z-10\`}>
                            <stat.icon className="h-5 w-5" />
                          </div>
                          <div className="relative z-10">
                            <h4 className="text-[0.65rem] font-bold text-muted-foreground uppercase tracking-wider mb-1">{stat.title}</h4>
                            <span className="font-serif text-2xl font-bold text-brand-charcoal">
                              <AnimatedCounter value={stat.value} />
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Recent Activity Mini-Card */}
                      <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="font-serif text-lg font-bold text-brand-charcoal">Recent Activity</h3>
                          <button onClick={() => setActiveTab("orders")} className="text-xs text-brand-orange hover:text-brand-orange-hover font-bold flex items-center gap-1">
                            View All <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                        {orders.length > 0 ? (
                          <div className="flex flex-col gap-4">
                            {orders.slice(0, 3).map(o => (
                              <div key={o.id} className="flex items-center gap-4 border-b border-brand-beige/30 pb-4 last:border-0 last:pb-0">
                                <div className="h-10 w-10 rounded-lg bg-brand-cream/50 flex items-center justify-center text-brand-orange flex-shrink-0">
                                  <ShoppingBag className="h-5 w-5" />
                                  {o.status === "Delivered" && <Check className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 text-white rounded-full p-[1px]" />}
                                </div>
                                <div className="flex-grow">
                                  <h4 className="text-xs font-bold text-brand-charcoal">Order #{o.orderNumber}</h4>
                                  <span className="text-[0.65rem] text-muted-foreground">{o.date} • {o.items.length} items</span>
                                </div>
                                <div className="text-right">
                                  <span className="block text-xs font-bold text-brand-charcoal">₹{o.total}</span>
                                  <span className="text-[0.6rem] font-bold text-brand-orange uppercase">{o.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Clock className="h-8 w-8 text-brand-beige mx-auto mb-2" />
                            <p className="text-xs text-muted-foreground">No recent activity.</p>
                          </div>
                        )}
                      </div>

                      {/* Quick Actions */}
                      <div className="border border-brand-beige/50 rounded-2xl p-6 bg-white shadow-sm">
                        <h3 className="font-serif text-lg font-bold text-brand-charcoal mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setActiveTab("profile")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <User className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Edit Profile</span>
                          </button>
                          <button onClick={() => setActiveTab("addresses")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <MapPin className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Add Address</span>
                          </button>
                          <Link href="/shop" className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <Gift className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Shop Sweets</span>
                          </Link>
                          <button onClick={() => setActiveTab("security")} className="p-4 rounded-xl border border-brand-beige/50 hover:border-brand-orange/30 hover:bg-brand-orange/5 transition-all flex flex-col items-center justify-center gap-2 text-center group">
                            <Shield className="h-6 w-6 text-muted-foreground group-hover:text-brand-orange transition-colors" />
                            <span className="text-xs font-bold text-brand-charcoal">Security</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}`;

content = content.replace(targetDashboardTab, replacementDashboardTab);

// 4. Upgrade TAB 1: PROFILE DETAILS with premium profile card, avatar upload, and floating label inputs
const targetProfileTab = `                {/* --- TAB 1: PROFILE DETAILS --- */}
                {activeTab === "profile" && (
                  <div className="flex flex-col gap-8 animate-fade-in">
                    <div>
                      <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">
                        Personal Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Update your personal details and how we can reach you.
                      </p>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6 max-w-xl bg-white border border-brand-beige/50 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                      {/* Decorative accent */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

                      <div className="flex flex-col gap-2">
                        <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Full Name</label>
                        <div className="relative flex items-center">
                          <User className="absolute left-3.5 h-4 w-4 text-muted-foreground/70" />
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                          <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Email Address</label>
                          <div className="relative flex items-center">
                            <Mail className="absolute left-3.5 h-4 w-4 text-muted-foreground/70" />
                            <input 
                              type="email" 
                              value={editEmail}
                              onChange={(e) => setEditEmail(e.target.value)}
                              className="w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10"
                              placeholder="Add your email"
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Phone Number</label>
                          <div className="relative flex items-center">
                            <Phone className="absolute left-3.5 h-4 w-4 text-muted-foreground/70" />
                            <input 
                              type="tel" 
                              value={editPhone}
                              onChange={(e) => setEditPhone(e.target.value)}
                              className="w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10"
                              required
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-brand-beige/50 pt-6">
                        <div className="min-h-[24px]">
                          {profileSuccess && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100"
                            >
                              <Check className="h-3.5 w-3.5" /> Saved successfully
                            </motion.span>
                          )}
                        </div>
                        <button 
                          type="submit"
                          className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover px-6 py-3 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                )}`;

const replacementProfileTab = `                {/* --- TAB 1: PROFILE DETAILS --- */}
                {activeTab === "profile" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-8"
                  >
                    {/* Premium Profile Card with Editable Avatar */}
                    <div className="bg-gradient-to-r from-brand-cream/60 to-transparent p-6 rounded-2xl border border-brand-beige/50 flex flex-col sm:flex-row items-center gap-6 shadow-sm">
                      <div className="relative group flex-shrink-0">
                        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md relative bg-brand-cream flex items-center justify-center text-3xl font-black text-brand-charcoal">
                          {profileAvatar ? (
                            <img src={profileAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                          ) : (
                            profile?.name ? profile.name[0].toUpperCase() : "U"
                          )}
                        </div>
                        <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[0.65rem] font-black cursor-pointer transition-opacity duration-300 select-none">
                          Change Photo
                        </label>
                        <input 
                          type="file" 
                          id="avatar-upload" 
                          accept="image/*" 
                          onChange={handleAvatarChange} 
                          className="hidden" 
                        />
                      </div>
                      <div className="text-center sm:text-left">
                        <div className="flex flex-wrap items-center gap-2.5 justify-center sm:justify-start">
                          <h3 className="font-serif text-xl font-bold text-brand-charcoal">{profile?.name || "Guest User"}</h3>
                          <span className="text-[0.6rem] font-black text-brand-gold bg-brand-cream/80 border border-brand-beige px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <Crown className="w-3.5 h-3.5 text-brand-gold" /> {loyaltyTier} Member
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{profile?.email || "No email address set"}</p>
                        <p className="text-xs text-brand-orange font-bold mt-2">✨ <AnimatedCounter value={loyaltyPoints} /> Loyalty Points</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-serif text-2xl font-bold text-brand-charcoal mb-2">
                        Personal Information
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Update your personal details and how we can reach you.
                      </p>
                    </div>
                    
                    <form onSubmit={handleUpdateProfile} className="flex flex-col gap-6 max-w-xl bg-white border border-brand-beige/50 rounded-2xl p-6 sm:p-8 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
                      {/* Decorative accent */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-brand-gold"></div>

                      {/* Full Name Input Container */}
                      <div className="relative pt-2">
                        <input 
                          type="text" 
                          id="editName"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder=" "
                          className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10 text-brand-charcoal"
                          required
                        />
                        <User className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                        <label 
                          htmlFor="editName"
                          className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                        >
                          Full Name
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Email Address Input Container */}
                        <div className="relative pt-2">
                          <input 
                            type="email" 
                            id="editEmail"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder=" "
                            className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10 text-brand-charcoal"
                          />
                          <Mail className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label 
                            htmlFor="editEmail"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Email Address
                          </label>
                        </div>

                        {/* Phone Number Input Container */}
                        <div className="relative pt-2">
                          <input 
                            type="tel" 
                            id="editPhone"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder=" "
                            className="peer w-full border border-brand-beige/80 rounded-xl pl-10 pr-4 pt-6 pb-2 text-sm focus:outline-none focus:border-brand-orange focus:ring-4 focus:ring-brand-orange/10 transition-all bg-brand-cream/10 text-brand-charcoal"
                            required
                          />
                          <Phone className="absolute left-3.5 top-[25px] h-4 w-4 text-muted-foreground/75 peer-focus:text-brand-orange transition-colors" />
                          <label 
                            htmlFor="editPhone"
                            className="absolute left-10 top-1.5 text-[0.62rem] font-bold text-brand-charcoal uppercase tracking-wider transition-all peer-placeholder-shown:text-xs peer-placeholder-shown:top-5.5 peer-placeholder-shown:text-muted-foreground/75 peer-focus:top-1.5 peer-focus:text-[0.62rem] peer-focus:text-brand-orange cursor-text"
                          >
                            Phone Number
                          </label>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-brand-beige/50 pt-6">
                        <div className="min-h-[24px]">
                          {profileSuccess && (
                            <motion.span 
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="text-xs text-emerald-600 font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100"
                            >
                              <Check className="h-3.5 w-3.5" /> Saved successfully
                            </motion.span>
                          )}
                        </div>
                        <button 
                          type="submit"
                          className="rounded-xl bg-brand-orange hover:bg-brand-orange-hover px-6 py-3 text-xs font-bold text-white transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}`;

content = content.replace(targetProfileTab, replacementProfileTab);

// 5. Upgrade TAB 2: ORDER HISTORY with expand/collapse accordion and timeline animations
const targetOrdersTab = `                {/* --- TAB 2: ORDER HISTORY --- */}
                {activeTab === "orders" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      Order History
                    </h3>

                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-brand-beige mb-3 mx-auto" />
                        <p className="text-xs text-muted-foreground">You haven't placed any orders yet.</p>
                        <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all">Shop Sweets</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {orders.map((order) => (
                          <div key={order.id} className="border border-brand-beige rounded-xl overflow-hidden shadow-xs">
                            {/* Order mini banner */}
                            <div className="bg-brand-cream/40 p-4 border-b border-brand-beige flex flex-wrap gap-4 justify-between items-center text-xs text-brand-charcoal font-semibold">
                              <div className="flex gap-4">
                                <div>
                                  <span className="text-[0.62rem] text-muted-foreground block font-bold">ORDER PLACED</span>
                                  <span>{order.date}</span>
                                </div>
                                <div>
                                  <span className="text-[0.62rem] text-muted-foreground block font-bold">TOTAL VALUE</span>
                                  <span>₹{order.total}</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[0.62rem] text-muted-foreground block font-bold">ORDER ID</span>
                                <span>{order.orderNumber}</span>
                              </div>
                            </div>

                            {/* Order Details Body */}
                            <div className="p-4 flex flex-col sm:flex-row gap-6 justify-between items-start">
                              <div className="flex-grow flex flex-col gap-3">
                                <div className="mb-4 bg-white p-3 rounded-xl border border-brand-beige">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Order Timeline</span>
                                    <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-orange uppercase tracking-wider">
                                      {order.status}
                                    </span>
                                  </div>
                                  <div className="relative w-full h-1 bg-gray-100 rounded-full mt-3 mb-1">
                                    <div 
                                      className="absolute top-0 left-0 h-1 bg-emerald-500 rounded-full transition-all duration-1000"
                                      style={{ 
                                        width: order.status === 'Cancelled' ? '100%' :
                                               order.status === 'Delivered' ? '100%' : 
                                               order.status === 'Shipped' ? '66%' : 
                                               order.status === 'Processing' ? '33%' : '5%',
                                        backgroundColor: order.status === 'Cancelled' ? '#ef4444' : '#10b981'
                                      }}
                                    ></div>
                                  </div>
                                  <div className="flex justify-between text-[0.6rem] text-muted-foreground font-semibold px-1 mt-2">
                                    <span className={['Pending', 'Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700' : ''}>Placed</span>
                                    <span className={['Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700' : ''}>Confirmed</span>
                                    <span className={['Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700' : ''}>Shipped</span>
                                    <span className={order.status === 'Delivered' ? 'text-emerald-700' : order.status === 'Cancelled' ? 'text-red-600' : ''}>
                                      {order.status === 'Cancelled' ? 'Cancelled' : 'Delivered'}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="flex flex-col gap-2.5 mt-1">
                                  {order.items.map((item, idx) => (
                                    <div key={idx} className="flex gap-3 items-center text-xs">
                                      <img src={item.image} alt={item.productName} className="h-10 w-10 object-cover rounded-md bg-brand-cream border border-brand-beige" />
                                      <div>
                                        <h4 className="font-serif font-bold text-brand-charcoal leading-none mb-1">{item.productName}</h4>
                                        <span className="text-[0.65rem] text-muted-foreground">{item.weight} x {item.quantity}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal">
                                <h4 className="font-serif font-bold text-[0.68rem] text-muted-foreground uppercase mb-1">Shipping Details</h4>
                                <p className="leading-relaxed">
                                  {order.shippingAddress?.name || "Customer"}<br />
                                  {order.shippingAddress?.street || ""}{order.shippingAddress?.city ? \`, \${order.shippingAddress.city}\` : ""}
                                </p>
                              </div>

                              {/* Customer Digital Invoice Actions section */}
                              <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal flex flex-col gap-2">
                                <h4 className="font-serif font-bold text-[0.68rem] text-muted-foreground uppercase mb-1">Digital Invoice</h4>
                                {order.invoice ? (
                                  <div className="flex flex-col gap-1.5 min-w-[150px]">
                                    <span className="text-[0.62rem] font-bold text-brand-gold bg-brand-cream/60 px-1.5 py-0.5 rounded border border-brand-beige text-center">
                                      {order.invoice.invoice_number}
                                    </span>
                                    <a 
                                      href={\`/api/invoices/download?invoiceId=\${order.invoice.id}\`}
                                      className="py-1.5 border border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal text-center text-[0.7rem] font-bold rounded-lg transition-colors hover:bg-brand-cream"
                                    >
                                      Download Invoice
                                    </a>
                                    <button 
                                      onClick={async () => {
                                        setEmailSendingInvoiceId(order.invoice.id);
                                        try {
                                          const res = await fetch("/api/invoices/send", {
                                            method: "POST",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ invoiceId: order.invoice.id })
                                          });
                                          const data = await res.json();
                                          if (data.success) {
                                            window.dispatchEvent(
                                              new CustomEvent("showToast", {
                                                detail: { message: "Invoice sent successfully to your email.", type: "success" }
                                              })
                                            );
                                          } else {
                                            throw new Error(data.error || "Failed to send email");
                                          }
                                        } catch (err: any) {
                                          window.dispatchEvent(
                                            new CustomEvent("showToast", {
                                              detail: { message: err.message || "Failed to send email", type: "error" }
                                            })
                                          );
                                        } finally {
                                          setEmailSendingInvoiceId(null);
                                        }
                                      }}
                                      disabled={emailSendingInvoiceId === order.invoice.id}
                                      className="py-1.5 bg-brand-charcoal hover:bg-black text-white text-[0.7rem] font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-center"
                                    >
                                      {emailSendingInvoiceId === order.invoice.id ? "Sending..." : "Email Invoice"}
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-[0.68rem] text-muted-foreground animate-pulse leading-normal">
                                    Preparing invoice...
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}`;

const replacementOrdersTab = `                {/* --- TAB 2: ORDER HISTORY --- */}
                {activeTab === "orders" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-6"
                  >
                    <h3 className="font-serif text-lg font-bold text-brand-charcoal border-b border-brand-beige pb-3">
                      Order History
                    </h3>

                    {orders.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="h-12 w-12 text-brand-beige mb-3 mx-auto" />
                        <p className="text-xs text-muted-foreground">You haven't placed any orders yet.</p>
                        <Link href="/shop" className="mt-4 inline-flex rounded-lg bg-brand-orange px-5 py-2 text-xs font-bold text-white hover:bg-brand-orange-hover transition-all">Shop Sweets</Link>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {orders.map((order) => {
                          const isExpanded = expandedOrderId === order.id;
                          return (
                            <div key={order.id} className="border border-brand-beige rounded-xl overflow-hidden shadow-xs bg-white">
                              {/* Order mini banner */}
                              <div 
                                onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                                className="bg-brand-cream/40 p-4 border-b border-brand-beige flex flex-wrap gap-4 justify-between items-center text-xs text-brand-charcoal font-semibold cursor-pointer hover:bg-brand-cream/70 transition-colors select-none"
                              >
                                <div className="flex gap-4">
                                  <div>
                                    <span className="text-[0.62rem] text-muted-foreground block font-bold">ORDER PLACED</span>
                                    <span>{order.date}</span>
                                  </div>
                                  <div>
                                    <span className="text-[0.62rem] text-muted-foreground block font-bold">TOTAL VALUE</span>
                                    <span>₹{order.total}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <span className="text-[0.62rem] text-muted-foreground block font-bold">ORDER ID</span>
                                    <span>{order.orderNumber}</span>
                                  </div>
                                  <motion.div
                                    animate={{ rotate: isExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </motion.div>
                                </div>
                              </div>

                              {/* Order Details Body */}
                              <AnimatePresence initial={false}>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "easeInOut" }}
                                    className="overflow-hidden"
                                  >
                                    <div className="p-4 flex flex-col sm:flex-row gap-6 justify-between items-start border-t border-brand-beige/50">
                                      <div className="flex-grow flex flex-col gap-3">
                                        <div className="mb-4 bg-white p-3 rounded-xl border border-brand-beige">
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-[0.65rem] font-bold text-brand-charcoal uppercase tracking-wider">Order Timeline</span>
                                            <span className="inline-flex max-w-fit items-center gap-1 rounded-full bg-brand-orange/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-brand-orange uppercase tracking-wider">
                                              {order.status}
                                            </span>
                                          </div>
                                          <div className="relative w-full h-1 bg-gray-100 rounded-full mt-3 mb-1">
                                            <motion.div 
                                              initial={{ width: "0%" }}
                                              animate={{ 
                                                width: order.status === 'Cancelled' ? '100%' :
                                                       order.status === 'Delivered' ? '100%' : 
                                                       order.status === 'Shipped' ? '66%' : 
                                                       order.status === 'Processing' ? '33%' : '5%'
                                              }}
                                              transition={{ duration: 0.8, ease: "easeOut" }}
                                              className="absolute top-0 left-0 h-1 rounded-full"
                                              style={{ 
                                                backgroundColor: order.status === 'Cancelled' ? '#ef4444' : '#10b981'
                                              }}
                                            ></motion.div>
                                          </div>
                                          <div className="flex justify-between text-[0.6rem] text-muted-foreground font-semibold px-1 mt-2">
                                            <span className={['Pending', 'Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700 font-bold' : ''}>Placed</span>
                                            <span className={['Paid', 'Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700 font-bold' : ''}>Confirmed</span>
                                            <span className={['Shipped', 'Delivered'].includes(order.status) ? 'text-emerald-700 font-bold' : ''}>Shipped</span>
                                            <span className={order.status === 'Delivered' ? 'text-emerald-700 font-bold' : order.status === 'Cancelled' ? 'text-red-600 font-bold' : ''}>
                                              {order.status === 'Cancelled' ? 'Cancelled' : 'Delivered'}
                                            </span>
                                          </div>
                                        </div>
                                        
                                        <div className="flex flex-col gap-2.5 mt-1">
                                          {order.items.map((item, idx) => (
                                            <div key={idx} className="flex gap-3 items-center text-xs">
                                              <img src={item.image} alt={item.productName} className="h-10 w-10 object-cover rounded-md bg-brand-cream border border-brand-beige" />
                                              <div>
                                                <h4 className="font-serif font-bold text-brand-charcoal leading-none mb-1">{item.productName}</h4>
                                                <span className="text-[0.65rem] text-muted-foreground">{item.weight} x {item.quantity}</span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>

                                      <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal">
                                        <h4 className="font-serif font-bold text-[0.68rem] text-muted-foreground uppercase mb-1">Shipping Details</h4>
                                        <p className="leading-relaxed">
                                          {order.shippingAddress?.name || "Customer"}<br />
                                          {order.shippingAddress?.street || ""}{order.shippingAddress?.city ? \`, \${order.shippingAddress.city}\` : ""}
                                        </p>
                                      </div>

                                      {/* Customer Digital Invoice Actions section */}
                                      <div className="border-t sm:border-t-0 border-brand-beige pt-3 sm:pt-0 w-full sm:w-auto text-xs text-brand-charcoal flex flex-col gap-2">
                                        <h4 className="font-serif font-bold text-[0.68rem] text-muted-foreground uppercase mb-1">Digital Invoice</h4>
                                        {order.invoice ? (
                                          <div className="flex flex-col gap-1.5 min-w-[150px]">
                                            <span className="text-[0.62rem] font-bold text-brand-gold bg-brand-cream/60 px-1.5 py-0.5 rounded border border-brand-beige text-center">
                                              {order.invoice.invoice_number}
                                            </span>
                                            <a 
                                              href={\`/api/invoices/download?invoiceId=\${order.invoice.id}\`}
                                              className="py-1.5 border border-brand-beige hover:border-brand-gold bg-white text-brand-charcoal text-center text-[0.7rem] font-bold rounded-lg transition-colors hover:bg-brand-cream"
                                            >
                                              Download Invoice
                                            </a>
                                            <button 
                                              onClick={async () => {
                                                setEmailSendingInvoiceId(order.invoice.id);
                                                try {
                                                  const res = await fetch("/api/invoices/send", {
                                                    method: "POST",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ invoiceId: order.invoice.id })
                                                  });
                                                  const data = await res.json();
                                                  if (data.success) {
                                                    window.dispatchEvent(
                                                      new CustomEvent("showToast", {
                                                        detail: { message: "Invoice sent successfully to your email.", type: "success" }
                                                      })
                                                    );
                                                  } else {
                                                    throw new Error(data.error || "Failed to send email");
                                                  }
                                                } catch (err: any) {
                                                  window.dispatchEvent(
                                                    new CustomEvent("showToast", {
                                                      detail: { message: err.message || "Failed to send email", type: "error" }
                                                    })
                                                  );
                                                } finally {
                                                  setEmailSendingInvoiceId(null);
                                                }
                                              }}
                                              disabled={emailSendingInvoiceId === order.invoice.id}
                                              className="py-1.5 bg-brand-charcoal hover:bg-black text-white text-[0.7rem] font-bold rounded-lg transition-colors disabled:opacity-50 cursor-pointer text-center"
                                            >
                                              {emailSendingInvoiceId === order.invoice.id ? "Sending..." : "Email Invoice"}
                                            </button>
                                          </div>
                                        ) : (
                                          <span className="text-[0.68rem] text-muted-foreground animate-pulse leading-normal">
                                            Preparing invoice...
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </motion.div>
                )}`;

content = content.replace(targetOrdersTab, replacementOrdersTab);

// 6. Upgrade TAB 3: SAVED ADDRESSES with hover lift and accordion animated forms
const targetAddressesTab = `                {/* --- TAB 3: SAVED ADDRESSES --- */}
                {activeTab === "addresses" && (
                  <div className="flex flex-col gap-6 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-brand-beige pb-3">
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                        Address Book
                      </h3>
                      {!showAddressForm && (
                        <button 
                          onClick={handleOpenAddressForm}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline animate-pulse"
                        >
                          <Plus className="h-4 w-4" /> Add Address
                        </button>
                      )}
                    </div>

                    {showAddressForm && (
                      <form onSubmit={handleAddAddress} className="bg-brand-cream/35 border border-brand-beige rounded-xl p-5 flex flex-col gap-4 max-w-lg animate-fade-in-up">
                        <h4 className="font-serif text-xs font-bold text-brand-charcoal">Create Address</h4>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Recipient Name *</label>
                            <input 
                              type="text" 
                              placeholder="Aarya Mehta"
                              value={addrName}
                              onChange={(e) => setAddrName(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number *</label>
                            <input 
                              type="tel" 
                              placeholder="98765 43210"
                              value={addrPhone}
                              onChange={(e) => setAddrPhone(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Flat, House no., Building, Company, Apartment *</label>
                            <input 
                              type="text" 
                              placeholder="Flat/House No, Building, Company"
                              value={addrFlat}
                              onChange={(e) => setAddrFlat(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Area, Street, Sector, Village *</label>
                            <input 
                              type="text" 
                              placeholder="Area, Street, Sector, Village"
                              value={addrArea}
                              onChange={(e) => setAddrArea(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 col-span-full">
                          <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Landmark (Optional)</label>
                          <input 
                            type="text" 
                            placeholder="E.g. near apollo hospital"
                            value={addrLandmark}
                            onChange={(e) => setAddrLandmark(e.target.value)}
                            className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-full">
                          <div className="flex flex-col gap-1.5 relative">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Pincode *</label>
                            <input 
                              type="text" 
                              placeholder="380015"
                              value={addrPincode}
                              onChange={async (e) => {
                                const val = e.target.value.replace(/\\D/g, '').slice(0, 6);
                                setAddrPincode(val);
                                
                                if (val.length < 6) {
                                  setPincodeStatus({ type: '', message: '' });
                                  return;
                                }

                                setIsPincodeLoading(true);
                                setPincodeStatus({ type: '', message: '' });

                                try {
                                  const res = await fetch(\`https://api.postalpincode.in/pincode/\${val}\`);
                                  const data = await res.json();

                                  if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
                                    const office = data[0].PostOffice[0];
                                    const fetchedCity = (office.Block && office.Block.toLowerCase() !== "na") ? office.Block : (office.District || office.Division || office.Name);
                                    const fetchedState = office.State;
                                    
                                    if (fetchedCity) {
                                      setCustomCities(prev => Array.from(new Set([...prev, fetchedCity])));
                                      setAddrCity(fetchedCity);
                                    }
                                    if (fetchedState) {
                                      setAddrState(fetchedState);
                                    }

                                    const { data: zones } = await supabase.from('delivery_zones').select('*');
                                    const activeZones = zones || deliveryZones;

                                    const matchedZone = activeZones.find((zone: any) => {
                                      const pincodesStr = zone.pincodes || zone.pincode || "";
                                      const pincodesArr = pincodesStr.split(",").map((p: string) => p.trim());
                                      return pincodesArr.includes(val);
                                    });

                                    if (matchedZone) {
                                      const charge = Number(matchedZone.delivery_charge) || 0;
                                      setPincodeStatus({
                                        type: 'success',
                                        message: \`Serviceable Area! Shipping: ₹\${charge} | Delivery: \${matchedZone.estimated_days || '1-2 Days'}\`
                                      });
                                    } else {
                                      setPincodeStatus({
                                        type: 'warning',
                                        message: "This area is outside our home delivery region. Only Self Pickup will be available."
                                      });
                                    }
                                  } else {
                                    setPincodeStatus({
                                      type: 'error',
                                      message: "Invalid PIN code. Please enter a valid 6-digit Indian PIN code."
                                    });
                                    setAddrCity("");
                                    setAddrState("");
                                  }
                                } catch (err) {
                                  console.error("Error fetching pincode info:", err);
                                  setPincodeStatus({
                                    type: 'error',
                                    message: "Error fetching location details. Select City & State manually."
                                  });
                                } finally {
                                  setIsPincodeLoading(false);
                                }
                              }}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                              required
                            />
                            {isPincodeLoading && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
                                <span className="text-[0.62rem] text-muted-foreground">Autofetching city & state...</span>
                              </div>
                            )}
                            {pincodeStatus.message && (
                              <p className={\`text-[0.62rem] font-bold mt-1.5 \${
                                pincodeStatus.type === 'success' ? 'text-emerald-600' :
                                pincodeStatus.type === 'warning' ? 'text-amber-600' : 'text-red-500'
                              }\`}>
                                {pincodeStatus.message}
                              </p>
                            )}
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">City *</label>
                            <select
                              value={addrCity}
                              onChange={(e) => setAddrCity(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                              required
                            >
                              <option value="">Select City</option>
                              {Array.from(new Set([...deliveryZones.map(z => z.city), ...DEFAULT_CITIES, ...customCities])).filter(Boolean).sort().map((city) => (
                                <option key={city} value={city}>{city}</option>
                              ))}
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">State *</label>
                            <select
                              value={addrState}
                              onChange={(e) => setAddrState(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                              required
                            >
                              <option value="">Select State</option>
                              {INDIAN_STATES.map((state) => (
                                <option key={state} value={state}>{state}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-2 border-t border-brand-beige pt-4">
                          <button 
                            type="button" 
                            onClick={() => setShowAddressForm(false)}
                            className="px-4 py-2 border border-brand-beige rounded-lg text-xs font-bold text-brand-charcoal"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold"
                          >
                            Add Address
                          </button>
                        </div>
                      </form>
                    )}

                    {!profile?.saved_addresses || profile.saved_addresses.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No saved addresses found. Please add a billing/shipping address.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile?.saved_addresses?.map((addr: any) => (
                          <div key={addr.id} className="rounded-xl border border-brand-beige p-4 flex justify-between items-start bg-brand-cream/10">
                            <div>
                              <h4 className="font-serif text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                                {addr.name}
                                {addr.isDefault && (
                                  <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-brand-beige px-1.5 py-0.5 rounded text-brand-gold">Default</span>
                                )}
                              </h4>
                              <p className="text-[0.7rem] text-muted-foreground mt-2 leading-relaxed">
                                {addr.street},<br />
                                {addr.landmark ? \`Landmark: \${addr.landmark}, \` : ''}
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <span className="text-[0.7rem] text-brand-charcoal font-semibold mt-2 block">
                                📞 {addr.phone}
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              aria-label="Delete Address"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}`;

const replacementAddressesTab = `                {/* --- TAB 3: SAVED ADDRESSES --- */}
                {activeTab === "addresses" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col gap-6"
                  >
                    <div className="flex justify-between items-center border-b border-brand-beige pb-3">
                      <h3 className="font-serif text-lg font-bold text-brand-charcoal">
                        Address Book
                      </h3>
                      {!showAddressForm && (
                        <button 
                          onClick={handleOpenAddressForm}
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-orange hover:underline animate-pulse"
                        >
                          <Plus className="h-4 w-4" /> Add Address
                        </button>
                      )}
                    </div>

                    <AnimatePresence initial={false}>
                      {showAddressForm && (
                        <motion.form 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          onSubmit={handleAddAddress} 
                          className="bg-brand-cream/35 border border-brand-beige rounded-xl p-5 flex flex-col gap-4 max-w-lg overflow-hidden"
                        >
                          <h4 className="font-serif text-xs font-bold text-brand-charcoal">Create Address</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Recipient Name *</label>
                              <input 
                                type="text" 
                                placeholder="Aarya Mehta"
                                value={addrName}
                                onChange={(e) => setAddrName(e.target.value)}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                                required
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Phone Number *</label>
                              <input 
                                type="tel" 
                                placeholder="98765 43210"
                                value={addrPhone}
                                onChange={(e) => setAddrPhone(e.target.value)}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                                required
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 col-span-full">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Flat, House no., Building, Company, Apartment *</label>
                              <input 
                                type="text" 
                                placeholder="Flat/House No, Building, Company"
                                value={addrFlat}
                                onChange={(e) => setAddrFlat(e.target.value)}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                                required
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Area, Street, Sector, Village *</label>
                              <input 
                                type="text" 
                                placeholder="Area, Street, Sector, Village"
                                value={addrArea}
                                onChange={(e) => setAddrArea(e.target.value)}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none"
                                required
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5 col-span-full">
                            <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Landmark (Optional)</label>
                            <input 
                              type="text" 
                              placeholder="E.g. near apollo hospital"
                              value={addrLandmark}
                              onChange={(e) => setAddrLandmark(e.target.value)}
                              className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 col-span-full">
                            <div className="flex flex-col gap-1.5 relative">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">Pincode *</label>
                              <input 
                                type="text" 
                                placeholder="380015"
                                value={addrPincode}
                                onChange={async (e) => {
                                  const val = e.target.value.replace(/\\D/g, '').slice(0, 6);
                                  setAddrPincode(val);
                                  
                                  if (val.length < 6) {
                                    setPincodeStatus({ type: '', message: '' });
                                    return;
                                  }

                                  setIsPincodeLoading(true);
                                  setPincodeStatus({ type: '', message: '' });

                                  try {
                                    const res = await fetch(\`https://api.postalpincode.in/pincode/\${val}\`);
                                    const data = await res.json();

                                    if (data && data[0] && data[0].Status === "Success" && data[0].PostOffice) {
                                      const office = data[0].PostOffice[0];
                                      const fetchedCity = (office.Block && office.Block.toLowerCase() !== "na") ? office.Block : (office.District || office.Division || office.Name);
                                      const fetchedState = office.State;
                                      
                                      if (fetchedCity) {
                                        setCustomCities(prev => Array.from(new Set([...prev, fetchedCity])));
                                        setAddrCity(fetchedCity);
                                      }
                                      if (fetchedState) {
                                        setAddrState(fetchedState);
                                      }

                                      const { data: zones } = await supabase.from('delivery_zones').select('*');
                                      const activeZones = zones || deliveryZones;

                                      const matchedZone = activeZones.find((zone: any) => {
                                        const pincodesStr = zone.pincodes || zone.pincode || "";
                                        const pincodesArr = pincodesStr.split(",").map((p: string) => p.trim());
                                        return pincodesArr.includes(val);
                                      });

                                      if (matchedZone) {
                                        const charge = Number(matchedZone.delivery_charge) || 0;
                                        setPincodeStatus({
                                          type: 'success',
                                          message: \`Serviceable Area! Shipping: ₹\${charge} | Delivery: \${matchedZone.estimated_days || '1-2 Days'}\`
                                        });
                                      } else {
                                        setPincodeStatus({
                                          type: 'warning',
                                          message: "This area is outside our home delivery region. Only Self Pickup will be available."
                                        });
                                      }
                                    } else {
                                      setPincodeStatus({
                                        type: 'error',
                                        message: "Invalid PIN code. Please enter a valid 6-digit Indian PIN code."
                                      });
                                      setAddrCity("");
                                      setAddrState("");
                                    }
                                  } catch (err) {
                                    console.error("Error fetching pincode info:", err);
                                    setPincodeStatus({
                                      type: 'error',
                                      message: "Error fetching location details. Select City & State manually."
                                    });
                                  } finally {
                                    setIsPincodeLoading(false);
                                  }
                                }}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                                required
                              />
                              {isPincodeLoading && (
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-brand-orange border-t-transparent"></div>
                                  <span className="text-[0.62rem] text-muted-foreground">Autofetching city & state...</span>
                                </div>
                              )}
                              {pincodeStatus.message && (
                                <p className={\`text-[0.62rem] font-bold mt-1.5 \${
                                  pincodeStatus.type === 'success' ? 'text-emerald-600' :
                                  pincodeStatus.type === 'warning' ? 'text-amber-600' : 'text-red-500'
                                }\`}>
                                  {pincodeStatus.message}
                                </p>
                              )}
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">City *</label>
                              <select
                                value={addrCity}
                                onChange={(e) => setAddrCity(e.target.value)}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                                required
                              >
                                <option value="">Select City</option>
                                {Array.from(new Set([...deliveryZones.map(z => z.city), ...DEFAULT_CITIES, ...customCities])).filter(Boolean).sort().map((city) => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[0.68rem] font-bold text-brand-charcoal uppercase">State *</label>
                              <select
                                value={addrState}
                                onChange={(e) => setAddrState(e.target.value)}
                                className="border border-brand-beige rounded-lg px-3 py-2 text-xs bg-white focus:outline-none focus:border-brand-orange"
                                required
                              >
                                <option value="">Select State</option>
                                {INDIAN_STATES.map((state) => (
                                  <option key={state} value={state}>{state}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 mt-2 border-t border-brand-beige pt-4">
                            <button 
                              type="button" 
                              onClick={() => setShowAddressForm(false)}
                              className="px-4 py-2 border border-brand-beige rounded-lg text-xs font-bold text-brand-charcoal"
                            >
                              Cancel
                            </button>
                            <button 
                              type="submit" 
                              className="px-5 py-2 bg-brand-orange hover:bg-brand-orange-hover text-white rounded-lg text-xs font-bold"
                            >
                              Add Address
                            </button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {!profile?.saved_addresses || profile.saved_addresses.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">No saved addresses found. Please add a billing/shipping address.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {profile?.saved_addresses?.map((addr: any) => (
                          <motion.div 
                            key={addr.id} 
                            whileHover={{ y: -4, boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)" }}
                            className="rounded-xl border border-brand-beige p-4 flex justify-between items-start bg-brand-cream/10 transition-shadow duration-300"
                          >
                            <div>
                              <h4 className="font-serif text-xs font-bold text-brand-charcoal flex items-center gap-1.5">
                                {addr.name}
                                {addr.isDefault && (
                                  <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-brand-beige px-1.5 py-0.5 rounded text-brand-gold">Default</span>
                                )}
                              </h4>
                              <p className="text-[0.7rem] text-muted-foreground mt-2 leading-relaxed">
                                {addr.street},<br />
                                {addr.landmark ? \`Landmark: \${addr.landmark}, \` : ''}
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                              <span className="text-[0.7rem] text-brand-charcoal font-semibold mt-2 block">
                                📞 {addr.phone}
                              </span>
                            </div>
                            
                            <button 
                              onClick={() => handleDeleteAddress(addr.id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1"
                              aria-label="Delete Address"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}`;

content = content.replace(targetAddressesTab, replacementAddressesTab);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully upgraded account page!');
