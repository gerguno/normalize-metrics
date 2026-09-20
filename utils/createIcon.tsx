import { forwardRef, type ReactNode, type SVGProps } from "react";

const defaultProps: SVGProps<SVGSVGElement> = {
  width: 16,
  height: 16,
  viewBox: "0 0 16 16",
};

export interface IconRenderProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

type IconRender = (props: IconRenderProps) => SVGProps<SVGSVGElement> & {
  children?: ReactNode;
};

export const createIcon = (render: IconRender) => {
  const Icon = forwardRef<SVGSVGElement, IconRenderProps>(
    ({ title, ...props }, ref) => {
      const { children, ...svgProps } = render(props);
      const finalProps = {
        ...defaultProps,
        ...svgProps,
      };

      return (
        <svg ref={ref} {...finalProps}>
          {title ? <title>{title}</title> : null}
          {children}
        </svg>
      );
    },
  );

  Icon.displayName = "CreatedIcon";

  return Icon;
};
