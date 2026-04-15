import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "@radix-ui/react-slot"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-[18px] border border-transparent bg-clip-padding text-sm font-semibold tracking-[-0.01em] whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring/30 focus-visible:ring-4 focus-visible:ring-ring/12 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(15,23,42,0.08),0_10px_24px_-18px_rgba(15,23,42,0.4)] hover:-translate-y-px hover:bg-primary/92 hover:shadow-[0_2px_4px_rgba(15,23,42,0.08),0_16px_30px_-20px_rgba(15,23,42,0.42)]",
        outline:
          "border-border bg-transparent text-foreground shadow-none hover:border-foreground/20 hover:bg-transparent hover:text-foreground dark:border-input dark:bg-transparent dark:hover:bg-transparent",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground shadow-none hover:bg-secondary/92",
        ghost:
          "bg-transparent text-foreground/72 shadow-none hover:bg-transparent hover:text-foreground dark:hover:bg-transparent",
        destructive:
          "border-transparent bg-destructive/10 text-destructive shadow-none hover:bg-destructive/16",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-11 gap-2 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-7 gap-1 rounded-xl px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-2xl px-3 text-[0.82rem] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-12 gap-2 px-5 text-base has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-11",
        "icon-xs": "size-7 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-2xl",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
