
import React from "react";

// Minimal PageTransition component: no animations to avoid parser/build issues.
const PageTransition = ({ children }) => {
   return <>{children}</>; 
};

export default PageTransition;