// D:\applications\tasks\TaskZenith\src\components\layout\SidebarNavContent.tsx
// -- CORRECTED HREF FOR TASKS --

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ListChecks, BarChart3, Bot, Settings, Zap, LogIn, LogOut, UserCircle } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils"; // Removed .tsx extension, it should be .ts
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";


// --- THIS IS THE FIX ---
const menuItems = [
  { href: "/dashboard", label: "Tasks", icon: ListChecks, requiresAuth: true },
  { href: "/reports", label: "Productivity Reports", icon: BarChart3, requiresAuth: true },
];
// ----------------------

export function SidebarNavContent() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  const UserAvatar = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 p-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      );
    }
    if (session?.user) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center justify-start gap-2 p-2 h-auto w-full hover:bg-sidebar-accent">
              <Avatar className="h-8 w-8">
                {session.user.image && <AvatarImage src={session.user.image} alt={session.user.name || "User"} />}
                <AvatarFallback>
                  {session.user.name ? session.user.name.charAt(0).toUpperCase() : <UserCircle size={20}/>}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start text-left">
                <span className="text-sm font-medium text-sidebar-foreground truncate max-w-[120px]">
                  {session.user.name || "User"}
                </span>
                <span className="text-xs text-sidebar-foreground/70 truncate max-w-[120px]">
                  {session.user.email}
                </span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56 bg-popover text-popover-foreground">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/auth/signin' })}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    return (
       <Button variant="ghost" onClick={() => signIn()} className="w-full justify-start hover:bg-sidebar-accent">
          <LogIn className="h-5 w-5 mr-2" />
          <span>Sign In</span>
        </Button>
    );
  };

  return (
    <>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">TaskZenith</h1>
        </Link>
      </SidebarHeader>

      <SidebarGroup className="flex-1 overflow-y-auto">
        <SidebarGroupLabel>Navigation</SidebarGroupLabel>
        <SidebarMenu>
          {menuItems.map((item) => {
            if (item.requiresAuth && !session && !isLoading) {
              return null;
            }
            if (item.requiresAuth && isLoading) {
              return (
                <SidebarMenuItem key={`${item.href}-skeleton`}>
                  <SidebarMenuButton
                    asChild
                    className="justify-start"
                    disabled
                    tooltip={{ children: item.label, side: "right", align: "center" }}
                  >
                    <a>
                      <Skeleton className="h-5 w-5 mr-2" />
                      <Skeleton className="h-4 w-24" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            }
            return (
              <SidebarMenuItem key={item.href}>
                <Link href={item.href} passHref legacyBehavior>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === item.href}
                    className={cn(
                      "justify-start",
                      pathname === item.href && "bg-sidebar-accent text-sidebar-accent-foreground"
                    )}
                    tooltip={{ children: item.label, side: "right", align: "center" }}
                  >
                    <a>
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroup>
      
      <SidebarFooter className="p-2 border-t border-sidebar-border space-y-2">
        <div className="p-2">
            <UserAvatar />
        </div>
        
        {/* --- THIS IS THE NEW, IMPROVED FOOTER SECTION --- */}
        <div className="flex items-center justify-between p-2 rounded-lg hover:bg-sidebar-accent transition-colors">
            <Link href="/" className="flex items-center gap-2" aria-label="Go to Homepage">
                <Zap className="h-6 w-6 text-primary" />
                <span className="text-sm font-semibold text-sidebar-foreground">Home</span>
            </Link>
            <ThemeToggle />
        </div>
        {/* ----------------------------------------------- */}
      </SidebarFooter>
    </>
  );
}
