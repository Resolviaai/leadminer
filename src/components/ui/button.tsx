import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground font-semibold hover:bg-brand-hover shadow-sm',
        brand:
          'bg-primary text-primary-foreground font-semibold hover:bg-brand-hover shadow-sm',
        destructive:
          'bg-destructive/15 text-destructive border border-destructive/30 hover:bg-destructive/25',
        outline:
          'border border-border bg-surface-100 hover:bg-surface-200 hover:text-text-main text-text-secondary',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-surface-300 border border-border/50',
        ghost:
          'text-text-secondary hover:bg-surface-200 hover:text-text-main',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-6 text-sm',
        icon: 'h-9 w-9 p-0',
        mobile: 'min-h-[44px] min-w-[44px] px-4 py-2.5 text-xs',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
