import type { ReactNode } from 'react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { getSite, updateSite } from '@/lib/edgeops-api'

export default async function EditSitePage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ organizationId?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  if (!query.organizationId) notFound()
  const organizationId = query.organizationId
  const site = await getSite(organizationId, id).catch(() => null)
  if (!site) notFound()

  async function submit(formData: FormData) {
    'use server'
    await updateSite(organizationId, id, {
      name: String(formData.get('name') ?? ''), timezone: String(formData.get('timezone') ?? 'UTC'),
      addressText: String(formData.get('addressText') ?? ''), status: String(formData.get('status')) as 'active' | 'disabled',
    })
    redirect(`/sites/${id}?organizationId=${organizationId}`)
  }

  return <div className="flex max-w-2xl flex-col gap-6">
    <Link href={`/sites/${id}?organizationId=${organizationId}`} className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground"><ArrowLeft className="size-3.5" /> {site.name}</Link>
    <PageHeader title="Edit site" description="Update the persisted site record." />
    <Card><CardContent><form action={submit} className="flex flex-col gap-4">
      <Field label="Name"><Input name="name" required maxLength={200} defaultValue={site.name} /></Field>
      <Field label="Timezone"><Input name="timezone" required defaultValue={site.timezone} /></Field>
      <Field label="Address"><Input name="addressText" maxLength={500} defaultValue={site.addressText} /></Field>
      <label className="flex flex-col gap-1.5 text-sm font-medium">Status<select name="status" defaultValue={site.status} className="h-9 rounded-md border border-input bg-background px-3 text-sm"><option value="active">Active</option><option value="disabled">Disabled</option></select></label>
      <div className="flex justify-end gap-2"><Link className={buttonVariants({ variant: 'outline' })} href={`/sites/${id}?organizationId=${organizationId}`}>Cancel</Link><Button type="submit">Save changes</Button></div>
    </form></CardContent></Card>
  </div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm font-medium">{label}{children}</label>
}
