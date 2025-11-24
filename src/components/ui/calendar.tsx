import * as React from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { DayPicker } from "react-day-picker";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  showPredefinedPeriods?: boolean;
  onPredefinedPeriodSelect?: (range: { from: Date; to: Date }) => void;
};

function Calendar({ 
  className, 
  classNames, 
  showOutsideDays = true, 
  showPredefinedPeriods = false,
  onPredefinedPeriodSelect,
  ...props 
}: CalendarProps) {
  // Usar el mes de las props si existe, sino el actual
  const initialMonth = props.month || (props.selected instanceof Date ? props.selected : new Date());
  const [month, setMonth] = React.useState<Date>(initialMonth);
  
  // Genera años desde 1970 hasta el año actual + 10 años hacia el futuro
  const currentYear = new Date().getFullYear();
  const startYear = 1970;
  const endYear = currentYear + 10;
  const years = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i);
  
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];

  const predefinedPeriods = [
    { 
      label: 'Este mes', 
      shortLabel: 'Este mes',
      getValue: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), now.getMonth(), 1),
          to: now
        };
      }
    },
    { 
      label: 'Mes anterior', 
      shortLabel: 'Mes ant.',
      getValue: () => {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          from: lastMonth,
          to: lastDayOfLastMonth
        };
      }
    },
    { 
      label: 'Este año', 
      shortLabel: 'Este año',
      getValue: () => {
        const now = new Date();
        return {
          from: new Date(now.getFullYear(), 0, 1),
          to: now
        };
      }
    },
    { 
      label: 'Último año', 
      shortLabel: 'Últ. año',
      getValue: () => {
        const now = new Date();
        const lastYear = now.getFullYear() - 1;
        return {
          from: new Date(lastYear, 0, 1),
          to: new Date(lastYear, 11, 31)
        };
      }
    },
    { 
      label: 'Todos los tiempos', 
      shortLabel: 'Todo',
      getValue: () => {
        return {
          from: new Date(1970, 0, 1),
          to: new Date()
        };
      }
    }
  ];

  const handleYearChange = (year: string) => {
    const newDate = new Date(month);
    newDate.setFullYear(parseInt(year));
    setMonth(newDate);
  };

  const handleMonthChange = (monthIndex: string) => {
    const newDate = new Date(month);
    newDate.setMonth(parseInt(monthIndex));
    setMonth(newDate);
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(month.getMonth() - 1);
    setMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(month);
    newDate.setMonth(month.getMonth() + 1);
    setMonth(newDate);
  };

  const handlePredefinedPeriodClick = (period: typeof predefinedPeriods[0]) => {
    const range = period.getValue();
    if (onPredefinedPeriodSelect) {
      onPredefinedPeriodSelect(range);
    }
  };

  return (
    <div className="flex flex-col">
      <DayPicker
        showOutsideDays={showOutsideDays}
        className={cn("p-3", className)}
        month={month}
        onMonthChange={setMonth}
        classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          ),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({ variant: "ghost" }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected:
            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside:
            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible",
          ...classNames,
        }}
        components={{
          IconLeft: ({ ..._props }) => <ChevronLeft className="h-4 w-4" />,
          IconRight: ({ ..._props }) => <ChevronRight className="h-4 w-4" />,
          Caption: ({ displayMonth }) => (
            <div className="flex justify-center items-center gap-2 relative w-full">
              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute left-1"
                )}
                onClick={goToPreviousMonth}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              <div className="flex items-center gap-1">
                <Select
                  value={displayMonth.getMonth().toString()}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="h-7 w-[110px] text-sm font-medium border-none shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((monthName, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        {monthName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={displayMonth.getFullYear().toString()}
                  onValueChange={handleYearChange}
                >
                  <SelectTrigger className="h-7 w-[80px] text-sm font-medium border-none shadow-none focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <button
                type="button"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 absolute right-1"
                )}
                onClick={goToNextMonth}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ),
        }}
        {...props}
      />

      {/* Periodos Predefinidos */}
      {showPredefinedPeriods && (
        <div className="border-t border-white/10 pt-3 pb-2 px-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-3.5 w-3.5 text-white/70" />
            <span className="text-xs font-medium text-white/70">Periodos rápidos:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {predefinedPeriods.map((period) => (
              <Button
                key={period.label}
                onClick={() => handlePredefinedPeriodClick(period)}
                variant="outline"
                size="sm"
                className="h-7 text-xs px-2.5 bg-white/5 border-white/10 hover:bg-white/10 text-white hover:border-cyan-300/30 transition-all duration-300"
              >
                <span className="hidden sm:inline">{period.label}</span>
                <span className="sm:hidden">{period.shortLabel}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };