import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      variant: {
        default: 'border-border bg-muted text-muted-foreground',
        outline: 'border-border text-foreground',
        primary: 'border-primary/30 bg-primary/10 text-primary',
        success: 'border-[var(--success)]/30 bg-[var(--success)]/10 text-[var(--success)]',
        warning: 'border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]',
        critical: 'border-destructive/30 bg-destructive/10 text-destructive',
        info: 'border-[var(--info)]/30 bg-[var(--info)]/10 text-[var(--info)]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
