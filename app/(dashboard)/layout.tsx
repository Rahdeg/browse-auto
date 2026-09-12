import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

export default async function DashboardLayout({ children }: LayoutProps<"/">) {
  const cookieStore = await cookies()
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false"

  return (
    <SidebarProvider defaultOpen={defaultOpen} className="h-svh">
      <AppSidebar />
      {/* Desktop keeps an icon rail, but mobile closes off-canvas. */}
      <SidebarTrigger className="fixed top-3 left-3 z-20 md:hidden" />
      <SidebarInset className="min-h-0 overflow-hidden border shadow-none!">{children}</SidebarInset>
    </SidebarProvider>
  )
}
