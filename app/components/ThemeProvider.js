export default function ThemeProvider({ children }) {
  return children;
}

export function useTheme() {
  return { ready: true, setTheme: () => {}, toggleTheme: () => {} };
}
