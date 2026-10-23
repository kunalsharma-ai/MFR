import { createContext, useCallback, useContext, useState } from 'react';

const Ctx = createContext(() => {});
export const useToast = () => useContext(Ctx);

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);
  const push = useCallback((text, kind = 'info', icon = '') => {
    const id = Math.random().toString(36).slice(2);
    setItems((x) => [...x.slice(-2), { id, text, kind, icon }]);
    setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 2600);
  }, []);
  return (
    <Ctx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.icon && <span aria-hidden="true">{t.icon}</span>} {t.text}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
