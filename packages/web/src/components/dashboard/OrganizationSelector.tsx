"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/retroui/Button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Popover } from "@/components/retroui/Popover"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/retroui/Input"
import { Label } from "@/components/retroui/Label"

interface OrganizationSelectorProps {
  value: string | null
  onSelect: (orgId: string | null, orgName?: string) => void
  disabled?: boolean
  initialName?: string
}

export function OrganizationSelector({ value, onSelect, disabled, initialName }: OrganizationSelectorProps) {
  const [open, setOpen] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [options, setOptions] = useState<{ id: string; name: string; slug: string | null }[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedName, setSelectedName] = useState(initialName || "")

  // Create form state
  const [createName, setCreateName] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
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
        const res = await fetch(`/api/organizations?q=${encodeURIComponent(searchTerm)}`)
        if (res.ok) {
          const results = await res.json()
          setOptions(results)
        }
      } catch (error) {
        console.error("Failed to search organizations", error)
      } finally {
        setIsLoading(false)
      }
    }

    const timer = setTimeout(fetchOrgs, 300)
    return () => clearTimeout(timer)
  }, [searchTerm])

  const handleCreate = async () => {
    if (!createName.trim()) return
    setIsCreating(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      })
      if (res.ok) {
        const data = await res.json()
        const org = data.organization
        onSelect(org.id, org.name)
        setSelectedName(org.name)
        setDialogOpen(false)
        setCreateName("")
      }
    } catch (error) {
      console.error("Failed to create organization", error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between border-4 border-primary bg-background",
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
        </Popover.Trigger>
        <Popover.Content className="w-[300px] p-0 border-4 border-primary">
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
                        setCreateName(searchTerm)
                        setDialogOpen(true)
                      }}
                    >
                      <Plus className="mr-2 h-3 w-3" />
                      Create &quot;{searchTerm}&quot;
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
                        setCreateName("")
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
        </Popover.Content>
      </Popover>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="border-4 border-primary sm:max-w-[500px] p-0 overflow-hidden bg-background">
          <DialogHeader className="p-6 pb-2 border-b-2 border-primary/10">
            <DialogTitle className="text-2xl font-black uppercase">Create Organization</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 space-y-4">
            <div>
              <Label className="text-sm font-bold uppercase">Organization Name</Label>
              <Input
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="border-4 border-primary bg-background mt-1"
                placeholder="Enter organization name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setDialogOpen(false)}
                className="border-4 border-primary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isCreating || !createName.trim()}
                className="border-4 border-primary bg-brutal-pink"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
