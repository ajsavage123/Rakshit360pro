/// <reference types="vite/client" />

// Add SVG module declaration for ReactComponent import
// Allows: import { ReactComponent as Icon } from './icon.svg';
declare module "*.svg" {
  import * as React from "react";
  export const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}
