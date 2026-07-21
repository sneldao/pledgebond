import React from "react";

export const WaxStamp = ({ children, variant = "burgundy", className = "", ...rest }) => {
  const cls =
    variant === "gold" ? "wax-stamp wax-stamp-gold" : variant === "ink" ? "wax-stamp wax-stamp-ink" : "wax-stamp";
  return (
    <span className={`${cls} ${className}`} {...rest}>
      {children}
    </span>
  );
};

export default WaxStamp;
