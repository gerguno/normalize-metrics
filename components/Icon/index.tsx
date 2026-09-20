import { forwardRef, type SVGProps } from "react";
import { iconRegistry, type IconName } from "@/assets/icons";

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: IconName;
}

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, ...props }, ref) => {
    const Component = iconRegistry[name];
    return <Component ref={ref} {...props} />;
  },
);

Icon.displayName = "Icon";

export default Icon;
