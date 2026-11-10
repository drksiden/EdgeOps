import type { ReactNode } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button, buttonVariants } from '@/components/ui/button'
import { createSite, listOrganizations } from '@/lib/edgeops-api'

export default async function NewSitePage() {
  const organizations = await listOrganizations()
  const organization = organizations[0]
  if (!organization) throw new Error('Create an organization before creating a site')

  async function submit(formData: FormData) {
    'use server'
    const site = await createSite(organization!.id, {
      name: String(formData.get('name') ?? ''),
      timezone: String(formData.get('timezone') ?? 'UTC'),
      addressText: String(formData.get('addressText') ?? ''),
    })
    redirect(`/sites/${site.id}?organizationId=${site.organizationId}`)
  }

  return <div className="flex max-w-2xl flex-col gap-6">
    <Link href="/sites" className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground"><ArrowLeft className="size-3.5" /> Sites</Link>
    <PageHeader title="Add site" description={`Create a physical location for ${organization.name}.`} />
    <Card><CardContent><form action={submit} className="flex flex-col gap-4">
      <Field label="Name"><Input name="name" required maxLength={200} placeholder="Demo Laboratory" /></Field>
      <Field label="Timezone"><Input name="timezone" required defaultValue="Asia/Almaty" /></Field>
      <Field label="Address"><Input name="addressText" maxLength={500} placeholder="Almaty, Kazakhstan" /></Field>
      <div className="flex justify-end gap-2"><Link href="/sites" className={buttonVariants({ variant: 'outline' })}>Cancel</Link><Button type="submit">Create site</Button></div>
    </form></CardContent></Card>
  </div>
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="flex flex-col gap-1.5 text-sm font-medium">{label}{children}</label>
}
