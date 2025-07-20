$filesToModify = @(
    "src/components/tasks/TaskItem.tsx",
    "src/components/ui/alert-dialog.tsx",
    "src/components/ui/avatar.tsx",
    "src/components/ui/badge.tsx",
    "src/components/ui/calendar.tsx",
    "src/components/ui/card.tsx",
    "src/components/ui/chart.tsx",
    "src/components/ui/checkbox.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/form.tsx",
    "src/components/ui/input.tsx",
    "src/components/ui/label.tsx",
    "src/components/ui/menubar.tsx",
    "src/components/ui/popover.tsx",
    "src/components/ui/progress.tsx",
    "src/components/ui/radio-group.tsx",
    "src/components/ui/scroll-area.tsx",
    "src/components/ui/select.tsx",
    "src/components/ui/separator.tsx",
    "src/components/ui/sheet.tsx",
    "src/components/ui/sidebar.tsx",
    "src/components/ui/skeleton.tsx",
    "src/components/ui/slider.tsx",
    "src/components/ui/switch.tsx",
    "src/components/ui/table.tsx",
    "src/components/ui/tabs.tsx",
    "src/components/ui/textarea.tsx",
    "src/components/ui/toast.tsx",
    "src/components/ui/tooltip.tsx"
)

foreach ($file in $filesToModify) {
    $content = Get-Content $file -Raw
    # Fix for imports ending in ";
    $newContent = $content -replace 'from "@/lib/utils.tsx";', 'from "@/lib/utils";'
    # Fix for imports ending in "
    $newContent = $newContent -replace 'from "@/lib/utils.tsx"', 'from "@/lib/utils"'
    # Fix for imports with single quotes
    $newContent = $newContent -replace "from '@/lib/utils.tsx';", "from '@/lib/utils';"
    $newContent = $newContent -replace "from '@/lib/utils.tsx'", "from '@/lib/utils'"
    Set-Content -Path $file -Value $newContent
}

Write-Host "Import paths for 'cn' have been corrected in all specified UI components."