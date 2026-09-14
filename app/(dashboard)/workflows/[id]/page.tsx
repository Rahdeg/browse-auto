import { auth } from "@clerk/nextjs/server"

export default async function Page({ params }: PageProps<"/workflows/[id]">) {
  await auth.protect()

  const { id } = await params

  return (
    <div className="flex flex-1 flex-col gap-1 p-6">
      <h1 className="font-heading text-sm font-medium tracking-tight">
        Workflow
      </h1>
      <p className="text-sm/relaxed text-muted-foreground">{id}</p>
    </div>
  )
}
