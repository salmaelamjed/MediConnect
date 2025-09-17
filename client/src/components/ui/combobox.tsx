"use client"

import * as React from "react"
import { CheckIcon, ChevronsUpDownIcon, Heart, Baby, Layers, Loader2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useEffect } from 'react';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useAppSelector, useAppDispatch } from "@/store/hooks"
import { actGetAllActive } from "@/store/specialities/act/actGetAllActive"

interface Specialty {
  id: number
  value: string
  label: string
  icon: string
}

interface ComboboxProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  error?: boolean
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  child: Baby, // Map "child" to Baby icon for Pediatrics
  skin: Layers, // Placeholder for Dermatology; consider a custom icon
  // Add more mappings as needed
}

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      value = "",
      onValueChange,
      placeholder = "Select specialty...",
      className,
      disabled = false,
      error = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const { records: specialties, loading, error: reduxError } = useAppSelector(
      (state) => state.specialities
    )

    const dispatch = useAppDispatch()

    useEffect(() => {
      dispatch(actGetAllActive())
    }, [dispatch])

    // Vérification de sécurité : s'assurer que specialties est un tableau
    const safeSpecialties = Array.isArray(specialties) ? specialties : []
    
    // Map specialties to include value, label, and icon
    const formattedSpecialties: Specialty[] = React.useMemo(
      () =>
        safeSpecialties.map((specialty) => ({
          id: specialty.id,
          value: specialty.id.toString(),
          label: specialty.name,
          icon: specialty.icon,
        })),
      [safeSpecialties]
    )


    return (
      <div className="relative">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              ref={ref}
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select specialty"
              aria-controls="specialty-combobox"
              className={cn(
                "w-full justify-between",
                !value && "text-muted-foreground",
                error && "border-red-500 focus:ring-red-500",
                className
              )}
              disabled={disabled || loading === "pending"}
            >
              <span className="flex items-center">
                {loading === "pending" && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {value && formattedSpecialties.length > 0 ? (
                  (() => {
                    const selected = formattedSpecialties.find((s) => s.value === value)
                    if (selected) {
                      const Icon = iconMap[selected.icon] || Circle // Fallback to Circle
                      return (
                        <>
                          <Icon className="w-4 h-4 mr-2" />
                          {selected.label}
                        </>
                      )
                    }
                    return placeholder
                  })()
                ) : (
                  placeholder
                )}
              </span>
              <ChevronsUpDownIcon className="w-4 h-4 ml-2 opacity-50 shrink-0" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput
                placeholder="Search specialty..."
                aria-label="Search specialty"
              />
              <CommandList>
                <CommandEmpty>
                  {loading === "pending"
                    ? "Loading specialties..."
                    : safeSpecialties.length === 0
                    ? "No specialties available."
                    : "No specialty found."}
                </CommandEmpty>
                <CommandGroup>
                  {formattedSpecialties.map((specialty) => {
                    const Icon = iconMap[specialty.icon] || Circle // Fallback to Circle
                    return (
                      <CommandItem
                        key={specialty.id}
                        value={specialty.label.toLowerCase()} // Case-insensitive search
                        onSelect={() => {
                          onValueChange?.(specialty.value)
                          setOpen(false)
                        }}
                        aria-selected={value === specialty.value}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === specialty.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Icon className="w-4 h-4 mr-2" />
                        {specialty.label}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {reduxError && (
          <p className="mt-1 text-xs text-red-600">{reduxError}</p>
        )}
      </div>
    )
  }
)

Combobox.displayName = "Combobox"