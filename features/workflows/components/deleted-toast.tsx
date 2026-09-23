"use client"

import { useEffect } from "react"
import { toast } from "sonner"

/**
 * Confirms a delete that has already happened. The action redirects away from
 * the workflow before it returns, so there is no client left on that page to
 * report back to: the name of what was deleted rides along in the URL and is
 * announced here, once the home page has landed. The toaster lives in the root
 * layout, so the toast outlives this component and the param it clears.
 */
function DeletedToast({ name }: { name: string }) {
  useEffect(() => {
    // A fixed id, so a second run — React invokes effects twice in development
    // — replaces the toast instead of stacking another one beside it.
    toast.success(`Deleted “${name}”`, { id: "workflow-deleted" })

    // The confirmation has been delivered, so the param goes: a reload of the
    // home page shouldn't announce the same delete again. `replaceState` keeps
    // this to the URL bar, where `router.replace` would refetch the page.
    window.history.replaceState(null, "", "/")
  }, [name])

  return null
}

export { DeletedToast }
