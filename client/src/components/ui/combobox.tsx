"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, Heart, Baby, Layers, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { actGetAllActive } from "@/store/specialities/act/actGetAllActive";

interface Specialty {
  id: number;
  value: string;
  label: string;
  icon: string;
}

interface ComboboxProps {
  value?: number | undefined; // Changed to number | undefined
  onValueChange?: (value: string, id?: number) => void; // Updated to include id
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  heart: Heart,
  child: Baby,
  skin: Layers,
};

export const Combobox = React.forwardRef<HTMLButtonElement, ComboboxProps>(
  (
    {
      value,
      onValueChange,
      placeholder = "Select specialty...",
      className,
      disabled = false,
      error = false,
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);
    const { records: specialties, loading, error: reduxError } = useAppSelector(
      (state) => state.specialities
    );

    const dispatch = useAppDispatch();

    useEffect(() => {
      dispatch(actGetAllActive());
    }, [dispatch]);

    // Ensure specialties is an array
    const safeSpecialties = Array.isArray(specialties) ? specialties : [];

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
    );

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
                {value && formattedSpecialties.length > 0 ? (
                  (() => {
                    const selected = formattedSpecialties.find((s) => s.id === value);
                    if (selected) {
                      const Icon = iconMap[selected.icon] || Circle;
                      return (
                        <>
                          <Icon className="w-4 h-4 mr-2" />
                          {selected.label}
                        </>
                      );
                    }
                    return placeholder;
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
              <CommandInput placeholder="Search specialty..." aria-label="Search specialty" />
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
                    const Icon = iconMap[specialty.icon] || Circle;
                    return (
                      <CommandItem
                        key={specialty.id}
                        value={specialty.label.toLowerCase()}
                        onSelect={() => {
                          onValueChange?.(specialty.label, specialty.id); // Pass label and id
                          setOpen(false);
                        }}
                        aria-selected={value === specialty.id}
                      >
                        <CheckIcon
                          className={cn(
                            "mr-2 h-4 w-4",
                            value === specialty.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <Icon className="w-4 h-4 mr-2" />
                        {specialty.label}
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {reduxError && <p className="mt-1 text-xs text-red-600">{reduxError}</p>}
      </div>
    );
  }
);

Combobox.displayName = "Combobox";