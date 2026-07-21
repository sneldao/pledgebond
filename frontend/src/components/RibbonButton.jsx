import React from "react";

export const RibbonButton = React.forwardRef(function RibbonButton(
  { children, variant = "wax", type = "button", className = "", ...rest },
  ref
) {
  const cls =
    variant === "gold" ? "ribbon-btn ribbon-btn-gold" : variant === "ghost" ? "ribbon-btn ribbon-btn-ghost" : "ribbon-btn";
  return (
    <button ref={ref} type={type} className={`${cls} ${className}`} {...rest}>
      {children}
    </button>
  );
});

export default RibbonButton;
