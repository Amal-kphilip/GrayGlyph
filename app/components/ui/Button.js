import Link from "next/link";

function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  href,
  variant = "primary",
  className = "",
  children,
  type = "button",
  ...props
}) {
  const variantClass = variant === "ghost" ? "btn-ghost" : "btn-primary";
  const classes = cn(variantClass, className);

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
