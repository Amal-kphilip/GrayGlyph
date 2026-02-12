function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Card({ as: Component = "div", variant = "glass", className = "", children, ...props }) {
  const variantClass = variant === "surface" ? "surface-card" : variant === "none" ? "" : "surface-glass";
  return (
    <Component className={cn("rounded-2xl", variantClass, className)} {...props}>
      {children}
    </Component>
  );
}
