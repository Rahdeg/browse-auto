import { UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

export default async function Page() {
  await auth.protect()

  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <UserButton />
    </div>
  )
}
