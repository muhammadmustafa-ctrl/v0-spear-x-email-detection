import { ConnectGmail } from "@/components/spearx/connect-gmail"
import { EmailTable } from "@/components/spearx/email-table"

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-pretty">SpearX Email Detection</h1>
          <p className="text-sm text-muted-foreground text-pretty">
            Static scan of headers and HTML for links, forms, scripts, IDN, and attachments. Deterministic risk scoring.
          </p>
        </div>
        <ConnectGmail />
      </header>
      <section>
        <EmailTable />
      </section>
    </main>
  )
}
