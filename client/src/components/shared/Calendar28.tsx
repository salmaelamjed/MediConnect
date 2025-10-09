"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// Define props interface
interface Calendar28Props {
  onDateSelect: (date: string) => void;
}

function formatDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  // Format date as Y-m-d (e.g., 2025-10-09)
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-based
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidDate(date: Date | undefined) {
  if (!date) {
    return false;
  }
  return !isNaN(date.getTime());
}

export function Calendar28({ onDateSelect }: Calendar28Props) {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(
    new Date("2025-06-01")
  );
  const [month, setMonth] = React.useState<Date | undefined>(date);
  const [value, setValue] = React.useState(formatDate(date));

  return (
    <div className="flex flex-col gap-3">
      <div className="relative flex gap-2">
        <Input
          id="date"
          value={value}
          placeholder="YYYY-MM-DD"
          className="h-12 border-gray-300 focus:border-blue-600 focus:ring-blue-600"
          onChange={(e) => {
            const input = e.target.value;
            setValue(input);
            const date = new Date(input);
            if (isValidDate(date)) {
              setDate(date);
              setMonth(date);
              onDateSelect(formatDate(date)); // Call onDateSelect with Y-m-d format
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setOpen(true);
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id="date-picker"
              variant="ghost"
              className="absolute -translate-y-1/2 top-1/2 right-2 size-6"
            >
              <CalendarIcon className="size-6" />
              <span className="sr-only">Select date</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 overflow-hidden"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={(date) => {
                setDate(date);
                const formattedDate = formatDate(date);
                setValue(formattedDate);
                onDateSelect(formattedDate); // Call onDateSelect with Y-m-d format
                setOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}