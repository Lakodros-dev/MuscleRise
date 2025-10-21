import Layout from "@/components/Layout";
import { useAppState } from "@/state/app-state";
import { useState, useEffect, memo, useCallback, useMemo } from "react";

type ShopItem = {
  id: string;
  name: string;
  cost: number;
  type: "skin" | "outfit" | "muscle";
};

const ShopPage = memo(function ShopPage() {
  const { state, dispatch } = useAppState();
  const [showWorkingModal, setShowWorkingModal] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#10B981");
  const [globalMuscleBoostEnabled, setGlobalMuscleBoostEnabled] = useState(false);
  const customCost = 250;

  // Check global muscle boost setting on component mount
  useEffect(() => {
    const fetchGlobalSettings = async () => {
      try {
        const response = await fetch('/api/admin/info');
        if (response.ok) {
          const data = await response.json();
          setGlobalMuscleBoostEnabled(data.globalMuscleBoostEnabled ?? false);
        }
      } catch (e) {
        console.warn('Failed to fetch global settings:', e);
      }
    };
    
    fetchGlobalSettings();
    
    // Listen for global muscle boost changes
    const handleGlobalMuscleBoostChange = (event: CustomEvent) => {
      setGlobalMuscleBoostEnabled(event.detail.enabled);
    };
    
    // Add event listener
    window.addEventListener('globalMuscleBoostChange', handleGlobalMuscleBoostChange as EventListener);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('globalMuscleBoostChange', handleGlobalMuscleBoostChange as EventListener);
    };
  }, []);

  // Force update CSS variables when component mounts
  useEffect(() => {
    const applyThemeStyles = () => {
      const cards = document.querySelectorAll('.rounded-xl.border.bg-card');
      let bgColor = '';
      let borderColor = '';
      
      switch (state.theme.skin) {
        case 'design-dark':
          bgColor = 'rgba(120, 120, 130, 0.10)'; // neutral gray with slight blue hint
          borderColor = 'rgba(120, 120, 130, 0.22)';
          break;
        case 'design-emerald':
          bgColor = 'rgba(180, 120, 100, 0.06)'; // subtle warm hint
          borderColor = 'rgba(180, 120, 100, 0.15)';
          break;
        case 'design-sky':
          bgColor = 'rgba(200, 150, 120, 0.07)'; // subtle warm hint
          borderColor = 'rgba(200, 150, 120, 0.18)';
          break;
        case 'design-white':
          bgColor = 'rgba(156, 163, 175, 0.15)'; // light gray
          borderColor = 'rgba(156, 163, 175, 0.3)';
          break;
        case 'bg-gradient':
          bgColor = 'rgba(200, 150, 120, 0.07)'; // subtle warm hint
          borderColor = 'rgba(200, 150, 120, 0.18)';
          break;
        case 'bg-forest':
          bgColor = 'rgba(140, 120, 160, 0.06)'; // subtle cool hint
          borderColor = 'rgba(140, 120, 160, 0.15)';
          break;
        default:
          return;
      }
      
      cards.forEach(card => {
        (card as HTMLElement).style.background = bgColor;
        (card as HTMLElement).style.borderColor = borderColor;
      });
    };
    
    applyThemeStyles();
  }, [state.theme.skin]);

  const items = useMemo((): ShopItem[] => {
    const baseItems: ShopItem[] = [
      { id: "design-dark", name: "Dark Theme", cost: 600, type: "skin" },
      { id: "design-emerald", name: "Emerald Theme", cost: 600, type: "skin" },
      { id: "design-sky", name: "Sky Theme", cost: 600, type: "skin" },
      { id: "design-white", name: "White Theme", cost: 600, type: "skin" },
      { id: "bg-gradient", name: "Background Gradient", cost: 600, type: "skin" },
      { id: "bg-forest", name: "Forest Theme", cost: 600, type: "skin" },
    ];
    
    // Only include muscle boost if globally enabled
    if (globalMuscleBoostEnabled) {
      baseItems.push({ id: "muscle+", name: "Muscle Boost (Increase visual muscles)", cost: 250, type: "muscle" });
    }
    
    return baseItems;
  }, [globalMuscleBoostEnabled]);

  const buy = useCallback((id: string, cost: number, type: "skin" | "outfit" | "muscle") => {
    // Check if trying to buy white theme when not enabled
    if (id === "design-white" && !state.theme.whiteThemeEnabled) {
      setShowWorkingModal(true);
      return;
    }
    dispatch({ type: "PURCHASE", payload: { id, cost, itemType: type } });
    
    // Show success message for muscle items
    if (type === "muscle") {
      console.log("Muscle Boost purchased successfully! Your avatar will now appear more muscular.");
    }
  }, [dispatch, state.theme.whiteThemeEnabled]);

  const isItemOwned = useCallback((item: typeof items[number]) => {
    if (item.type === "skin") return state.theme.unlockedSkins.includes(item.id);
    if (item.type === "muscle") return false; // Muscle items are consumable, not owned
    if (item.type === "outfit") return state.theme.outfitsUnlocked.includes(item.id);
    return false;
  }, [state.theme.unlockedSkins, state.theme.outfitsUnlocked]);

  // primary color quick-choices
  const primaryChoices = useMemo((): { id: string; hsl: string; label: string; cost: number }[] => [
    { id: "primary-emerald", hsl: "166 72% 45%", label: "Emerald", cost: 100 },
    { id: "primary-sky", hsl: "199 89% 48%", label: "Sky", cost: 100 },
    { id: "primary-pink", hsl: "330 85% 56%", label: "Pink", cost: 100 },
    { id: "primary-yellow", hsl: "48 100% 50%", label: "Yellow", cost: 100 },
    { id: "primary-white", hsl: "0 0% 100%", label: "White", cost: 100 },
  ], []);

  const hslToRgbString = useCallback((hsl: string) => {
    const parts = hsl.trim().split(/\s+/);
    const h = parseFloat(parts[0]);
    const s = parseFloat(parts[1].replace("%", "")) / 100;
    const l = parseFloat(parts[2].replace("%", "")) / 100;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    const R = Math.round((r + m) * 255);
    const G = Math.round((g + m) * 255);
    const B = Math.round((b + m) * 255);
    return `${R}, ${G}, ${B}`;
  }, []);

  const hexToRgbString = useCallback((hex: string) => {
    const h = hex.replace('#', '');
    const r = parseInt(h.substring(0,2),16);
    const g = parseInt(h.substring(2,4),16);
    const b = parseInt(h.substring(4,6),16);
    return `${r}, ${g}, ${b}`;
  }, []);

  const rgbToHex = useCallback((rgb: string) => {
    try {
      const parts = rgb.split(',').map(p=>parseInt(p.trim()));
      const toHex = (v:number)=>v.toString(16).padStart(2,'0');
      return `#${toHex(parts[0])}${toHex(parts[1])}${toHex(parts[2])}`.toUpperCase();
    } catch(e){ return '#10B981'; }
  }, []);

  const applyPrimary = useCallback(async (choice: typeof primaryChoices[number]) => {
    if (state.coins < choice.cost) return;
    
    // Convert HSL to hex for consistent storage
    const rgbString = hslToRgbString(choice.hsl);
    const [r, g, b] = rgbString.split(',').map(v => parseInt(v.trim()));
    const toHex = (n: number) => n.toString(16).padStart(2, '0');
    const hexColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    
    // Apply color immediately to DOM
    try { 
      document.documentElement.style.setProperty("--primary-rgb", rgbString); 
    } catch (e) {
      console.warn('Failed to apply color to DOM:', e);
    }
    
    // Save to server if user is logged in
    if (state.user?.id) {
      try {
        const response = await fetch(`/api/auth/user/${state.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            customPrimaryColor: hexColor, // Save as hex for consistency
            coins: state.coins - choice.cost
          }),
        });
        
        if (response.ok) {
          console.log('✅ Primary color saved to server successfully:', hexColor);
        } else {
          console.warn('❌ Failed to save primary color - server response:', response.status);
        }
      } catch (e) {
        console.warn('❌ Failed to save primary color to server:', e);
      }
    }
    
    // Deduct coins
    dispatch({ type: "ADD_COINS", payload: { amount: -choice.cost } });
  }, [state.coins, state.user?.id, hslToRgbString, dispatch]);

  // Get current primary color on mount
  useEffect(() => {
    try {
      const currentRgb = getComputedStyle(document.documentElement).getPropertyValue("--primary-rgb").trim();
      if (currentRgb) {
        const hex = rgbToHex(currentRgb);
        setSelectedColor(hex);
      }
    } catch (e) {
      console.error('Failed to get current color:', e);
    }
  }, []);

  const handleColorConfirm = useCallback(async () => {
    if (state.coins < customCost) {
      alert(`You need ${customCost} coins but only have ${state.coins} coins!`);
      return;
    }
    
    // Convert hex to RGB
    const rgb = hexToRgbString(selectedColor);
    
    // Apply color immediately to DOM
    try { 
      document.documentElement.style.setProperty("--primary-rgb", rgb); 
    } catch (e) {
      console.error('Failed to apply color:', e);
    }
    
    // Save to server if user is logged in
    if (state.user?.id) {
      try {
        const response = await fetch(`/api/auth/user/${state.user.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            customPrimaryColor: selectedColor, // Already in hex format
            coins: state.coins - customCost
          }),
        });
        
        if (response.ok) {
          console.log('✅ Custom primary color saved to server successfully:', selectedColor);
        } else {
          console.warn('❌ Failed to save custom primary color - server response:', response.status);
        }
      } catch (e) {
        console.warn('❌ Failed to save custom color to server:', e);
      }
    }
    
    // Deduct coins
    dispatch({ type: "ADD_COINS", payload: { amount: -customCost } });
    
    setShowColorPicker(false);
  }, [state.coins, state.user?.id, selectedColor, hexToRgbString, dispatch]);

  return (
    <Layout>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">Shop</h2>
        <div className="text-sm text-foreground">Coins: <span className="font-semibold" style={{ color: "rgb(var(--primary-rgb))" }}>{state.coins}</span></div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-4 relative z-0">
        <h3 className="font-semibold mb-2 text-foreground">Primary Color Quick Picks (cost 100 coins each time)</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {primaryChoices.map((c) => (
            <button 
              key={c.id}
              onClick={() => applyPrimary(c)} 
              className="flex items-center gap-2 rounded-md p-2 border border-border bg-transparent hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-transparent" 
              disabled={state.coins < c.cost}
              style={{
                color: state.coins >= c.cost 
                  ? `rgb(var(--primary-rgb))` 
                  : '#888'
              }}
            >
              <span className="w-6 h-6 rounded" style={{ background: `rgb(${hslToRgbString(c.hsl)})` }} />
              <span className="text-sm">{c.label}</span>
            </button>
          ))}

          {/* Make Yourself custom color - shows a simple color picker modal */}
          <button 
            onClick={() => setShowColorPicker(true)} 
            className="flex items-center gap-2 rounded-md p-2 border border-border bg-transparent hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 transition-all duration-200"
          >
            <span className="w-6 h-6 rounded border border-border" style={{ background: selectedColor }} />
            <span className="text-sm" style={{ color: `rgb(var(--primary-rgb))` }}>Make Yourself</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => {
          const owned = isItemOwned(it);
          const isActive = state.theme.skin === it.id;
          return (
            <div key={it.id} className="rounded-xl border border-border bg-card p-4 relative z-0 transition-all duration-200 hover:bg-muted/50">
              <div className="font-semibold text-foreground">{it.name}</div>
              <div className="text-xs text-foreground/70">{it.type === "muscle" ? "Increases visible muscle size" : "Site design / background"}</div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-semibold" style={{ color: "rgb(var(--primary-rgb))" }}>{it.cost} coins</span>
                <div className="flex gap-2">
                  {owned && it.type === "skin" ? (
                    <button
                      onClick={() => {
                        if (it.id === "design-white" && !state.theme.whiteThemeEnabled) {
                          setShowWorkingModal(true);
                          return;
                        }
                        if (!isActive) {
                          dispatch({ type: "APPLY_THEME", payload: { id: it.id } });
                        }
                      }}
                      className={`rounded-md px-3 py-1 text-sm border border-border bg-transparent hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 transition-all duration-200 ${isActive ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      style={{
                        color: `rgb(var(--primary-rgb))`,
                        fontWeight: isActive ? '600' : '400'
                      }}
                    >
                      {isActive ? "Active" : "Select"}
                    </button>
                  ) : (
                    <button
                      disabled={state.coins < it.cost}
                      onClick={() => buy(it.id, it.cost, it.type)}
                      className="rounded-md px-3 py-1 text-sm border border-border bg-transparent hover:bg-[rgba(255,255,255,0.08)] hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:bg-transparent"
                      style={{
                        color: state.coins >= it.cost 
                          ? `rgb(var(--primary-rgb))` 
                          : '#888'
                      }}
                    >
                      Buy
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* "We are working on it" Modal for White Theme */}
      {showWorkingModal && (
        <div className="fixed inset-0 z-[200] grid place-items-center bg-black/90 p-4">
          <div className="w-full max-w-md rounded-xl bg-card border border-border p-6">
            <div className="text-center">
              <h4 className="font-semibold text-foreground text-lg mb-3">🚧 We are working on it! 🚧</h4>
              <p className="text-foreground/70 mb-4">
                White theme is currently under development and will be available soon.
              </p>
              <p className="text-sm text-foreground/50 mb-6">
                Stay tuned for updates!
              </p>
              <button 
                onClick={() => setShowWorkingModal(false)}
                className="rounded-md px-4 py-2 bg-white/10 hover:bg-white/15 transition-colors"
                style={{ color: `rgb(var(--primary-rgb))` }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Primary Color Modal */}
      {showColorPicker && (
        <div className="fixed inset-0 grid place-items-center bg-black/90 p-4" style={{ zIndex: 99999 }} onClick={() => setShowColorPicker(false)}>
          <div className="w-full max-w-md rounded-xl border border-border p-6 shadow-2xl" style={{ backgroundColor: 'hsl(var(--card))', zIndex: 100000 }} onClick={(e) => e.stopPropagation()}>
            <h4 className="font-semibold text-foreground text-lg">Custom Primary Color</h4>
            <p className="text-sm text-foreground/70 mt-2">Choose your text color (cost {customCost} coins)</p>
            
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4">
                <input 
                  type="color" 
                  value={selectedColor} 
                  onChange={(e) => setSelectedColor(e.target.value)} 
                  className="w-20 h-20 rounded-lg border-2 border-border cursor-pointer"
                />
                <div className="flex-1">
                  <div className="text-sm text-foreground/70 mb-1">Selected Color:</div>
                  <div className="text-2xl font-bold" style={{ color: selectedColor }}>{selectedColor}</div>
                </div>
              </div>
              
              <div className="rounded-lg border border-border p-4 bg-muted/30">
                <div className="text-xs text-foreground/70 mb-2">Preview:</div>
                <div className="space-y-2">
                  <div className="text-lg font-semibold" style={{ color: selectedColor }}>Sample Text</div>
                  <div className="text-sm" style={{ color: selectedColor }}>This is how your text will look</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex items-center justify-end gap-3">
              <button 
                onClick={() => setShowColorPicker(false)} 
                className="rounded-md bg-muted px-4 py-2 text-foreground hover:bg-muted/80 transition-colors"
              >
                Cancel
              </button>
              <button 
                disabled={state.coins < customCost} 
                onClick={handleColorConfirm} 
                className="rounded-md px-4 py-2 border border-border bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                style={{
                  color: state.coins >= customCost ? selectedColor : '#888'
                }}
                title={state.coins < customCost ? `You need ${customCost} coins (you have ${state.coins})` : 'Apply this color'}
              >
                Apply ({customCost} coins)
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
});

export default ShopPage;
