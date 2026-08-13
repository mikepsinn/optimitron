"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { OrganizationForm } from "@/components/organizations/OrganizationForm"
import { searchOrganizations } from "@/app/dashboard/actions"


interface OrganizationSelectorProps {
    value: string | null // organizationId
    onSelect: (orgId: string | null, orgName?: string) => void
    disabled?: boolean
    initialName?: string // To display name if value is set
}

export function OrganizationSelector({ value, onSelect, disabled, initialName }: OrganizationSelectorProps) {
    const [open, setOpen] = useState(false)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState("")
    const [options, setOptions] = useState<{ id: string; name: string; slug: string | null }[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [selectedName, setSelectedName] = useState(initialName || "")

    // Debounce search term to avoid hitting server too often
    // Note: We need to implement a simple useDebounce hook or just use timeout
    // For now I'll use a simple timeout inside the effect

    useEffect(() => {
        // If we have an initial name and value, but no options, set the name
        if (initialName) {
            setSelectedName(initialName)
        }
    }, [initialName])

    useEffect(() => {
        const fetchOrgs = async () => {
            if (!searchTerm || searchTerm.length < 2) {
                setOptions([])
                return
            }

            setIsLoading(true)
            try {
                const results = await searchOrganizations(searchTerm)
                setOptions(results)
            } catch (error) {
                console.error("Failed to search organizations", error)
            } finally {
                setIsLoading(false)
            }
        }

        const timer = setTimeout(fetchOrgs, 300)
        return () => clearTimeout(timer)
    }, [searchTerm])

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className={cn(
                            "w-full justify-between border-2 border-primary bg-background",
                            !value && "text-muted-foreground",
                            disabled && "opacity-50 cursor-not-allowed"
                        )}
                        disabled={disabled}
                    >
                        {value ? (
                            <span className="flex items-center gap-2 truncate">
                                <Building2 className="h-4 w-4 shrink-0" />
                                {selectedName || "Select organization..."}
                            </span>
                        ) : (
                            "Select organization..."
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0 border-2 border-primary">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Search organizations..."
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                        />
                        <CommandList>
                            <CommandEmpty>
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Searching...
                                    </div>
                                ) : searchTerm.length < 2 ? (
                                    <div className="p-4 text-sm text-muted-foreground">Type at least 2 characters...</div>
                                ) : (
                                    <div className="p-2">
                                        <p className="text-sm text-muted-foreground mb-2">No organization found.</p>
                                        <Button
                                            variant="secondary"
                                            className="w-full justify-start text-xs border border-dashed border-primary"
                                            onClick={() => {
                                                setOpen(false)
                                                setDialogOpen(true)
                                            }}
                                        >
                                            <Plus className="mr-2 h-3 w-3" />
                                            Create "{searchTerm}"
                                        </Button>
                                    </div>
                                )}
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((org) => (
                                    <CommandItem
                                        key={org.id}
                                        value={org.name}
                                        onSelect={() => {
                                            onSelect(org.id, org.name)
                                            setSelectedName(org.name)
                                            setOpen(false)
                                        }}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === org.id ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {org.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>

                            {options.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup>
                                        <CommandItem
                                            onSelect={() => {
                                                setOpen(false)
                                                setDialogOpen(true)
                                            }}
                                            className="text-primary font-bold cursor-pointer"
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Create New Organization...
                                        </CommandItem>
                                    </CommandGroup>
                                </>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="border-4 border-primary sm:max-w-[500px] p-0 overflow-hidden bg-background">
                    <DialogHeader className="p-6 pb-2 border-b-2 border-primary/10">
                        <DialogTitle className="text-2xl font-black uppercase">Create Organization</DialogTitle>
                        <DialogDescription>
                            Add a new organization to the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="p-6">
                        <OrganizationForm
                            compact
                            initialName={searchTerm}
                            onSuccess={(org) => {
                                onSelect(org.id, org.name)
                                setSelectedName(org.name)
                                setDialogOpen(false)
                            }}
                            onCancel={() => setDialogOpen(false)}
                        />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
