"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
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
import { MedicalIcon } from "@/components/ui/medical-icon";

interface Specialty {
  id: number;
  value: string;
  label: string;
  icon: string;
}

interface ComboboxProps {
  value?: number | undefined;
  onValueChange?: (value: string, id?: number) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: boolean;
}

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

    const safeSpecialties = Array.isArray(specialties) ? specialties : [];

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

    const selectedSpecialty = React.useMemo(
      () => formattedSpecialties.find((s) => s.id === value),
      [formattedSpecialties, value]
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
              <span className="flex items-center gap-2">
                {selectedSpecialty ? (
                  <>
                    <MedicalIcon
                      name={selectedSpecialty.icon}
                      className="text-blue-500"
                      size={16}
                    />
                    <span>{selectedSpecialty.label}</span>
                  </>
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
                  {formattedSpecialties.map((specialty) => (
                    <CommandItem
                      key={specialty.id}
                      value={specialty.label.toLowerCase()}
                      onSelect={() => {
                        onValueChange?.(specialty.label, specialty.id);
                        setOpen(false);
                      }}
                      aria-selected={value === specialty.id}
                      className="flex items-center gap-2"
                    >
                      <CheckIcon
                        className={cn(
                          "h-4 w-4",
                          value === specialty.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <MedicalIcon
                        name={specialty.icon}
                        className="text-blue-500"
                        size={16}
                      />
                      <span>{specialty.label}</span>
                    </CommandItem>
                  ))}
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